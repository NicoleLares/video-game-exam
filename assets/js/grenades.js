import * as THREE from 'three';

import RAPIER from '@dimforge/rapier3d-compat';

import {
    getPhysicsWorld
} from './physics.js';

import {
    getDynamicObjects
} from './objects.js';

import {
    damageObjectives
} from './objectives.js';


// ============================================================
// OPERATION IMPACT
// GRENADES.JS
// VERSION 1.0.6
//
// GRANADA CONTROLADA
// DIRECCIÓN SEGÚN CÁMARA
// VELOCIDAD CON setLinvel()
// EXPLOSIÓN
// ONDA EXPANSIVA
// PARTÍCULAS
// HUMO
// LUZ
// ============================================================


// ============================================================
// GRANADA
// ============================================================

const GRENADE_RADIUS =
    0.15;

const GRENADE_DENSITY =
    4.5;

const GRENADE_FRICTION =
    0.75;

const GRENADE_RESTITUTION =
    0.30;


// ============================================================
// LANZAMIENTO
// ============================================================
//
// IMPORTANTE:
//
// Estos valores ahora representan prácticamente
// la velocidad inicial de la granada.
//
// Ya NO usamos applyImpulse().
//
// ============================================================

const THROW_FORCE =
    4.2;

const THROW_UP_FORCE =
    2.8;


// ============================================================
// EXPLOSIÓN
// ============================================================

const FUSE_TIME =
    2.2;

const EXPLOSION_RADIUS =
    4.8;

const EXPLOSION_FORCE =
    18;

const EXPLOSION_UP_FORCE =
    5.5;


// ============================================================
// LÍMITES
// ============================================================

const GRENADE_COOLDOWN =
    1;

const MAX_ACTIVE_GRENADES =
    5;


// ============================================================
// EFECTOS
// ============================================================

const FLASH_DURATION =
    0.16;

const FIREBALL_DURATION =
    0.38;

const SHOCKWAVE_DURATION =
    0.48;

const PARTICLE_DURATION =
    0.85;

const SMOKE_DURATION =
    1.6;

const LIGHT_DURATION =
    0.30;


// ============================================================
// REFERENCIAS
// ============================================================

let sceneRef =
    null;

let cameraRef =
    null;


// ============================================================
// ESTADO
// ============================================================

let throwCooldown =
    0;


// ============================================================
// GRANADAS ACTIVAS
// ============================================================

const grenades =
    [];


// ============================================================
// EFECTOS ACTIVOS
// ============================================================

const effects =
    [];


// ============================================================
// VECTORES
// ============================================================

const throwDirection =
    new THREE.Vector3();

const explosionDirection =
    new THREE.Vector3();

const explosionPosition =
    new THREE.Vector3();


// ============================================================
// MATERIALES BASE
// ============================================================

const grenadeMaterial =
    new THREE.MeshStandardMaterial({

        color:
            0x26332a,

        roughness:
            0.68,

        metalness:
            0.42

    });


const grenadeStripeMaterial =
    new THREE.MeshStandardMaterial({

        color:
            0x9da85d,

        emissive:
            0x283000,

        emissiveIntensity:
            0.35,

        roughness:
            0.52,

        metalness:
            0.30

    });


// ============================================================
// INICIALIZAR SISTEMA
// ============================================================

export function initGrenadeSystem(
    scene,
    camera
) {

    sceneRef =
        scene;


    cameraRef =
        camera;


    throwCooldown =
        0;


    console.log(
        '💣 Sistema de granadas v1.0.6 listo'
    );

}


// ============================================================
// COMPROBAR SI SE PUEDE LANZAR
// ============================================================

export function canThrowGrenade() {

    const world =
        getPhysicsWorld();


    return (
        Boolean(
            sceneRef
        ) &&
        Boolean(
            world
        ) &&
        throwCooldown <=
            0 &&
        grenades.length <
            MAX_ACTIVE_GRENADES
    );

}


// ============================================================
// CREAR MODELO DE GRANADA
// ============================================================

function createGrenadeMesh() {

    const group =
        new THREE.Group();


    group.name =
        'Grenade';


    // ========================================================
    // CUERPO
    // ========================================================

    const body =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                GRENADE_RADIUS,
                18,
                14
            ),

            grenadeMaterial.clone()

        );


    body.scale.set(
        1,
        1.18,
        1
    );


    body.castShadow =
        true;


    body.receiveShadow =
        true;


    group.add(
        body
    );


    // ========================================================
    // FRANJA
    // ========================================================

    const stripe =
        new THREE.Mesh(

            new THREE.TorusGeometry(

                GRENADE_RADIUS *
                0.82,

                0.020,

                7,

                20

            ),

            grenadeStripeMaterial.clone()

        );


    stripe.rotation.x =
        Math.PI /
        2;


    stripe.castShadow =
        true;


    group.add(
        stripe
    );


    // ========================================================
    // TAPA
    // ========================================================

    const capMaterial =
        new THREE.MeshStandardMaterial({

            color:
                0x1d2420,

            roughness:
                0.48,

            metalness:
                0.65

        });


    const cap =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.050,
                0.060,
                0.075,
                10
            ),

            capMaterial

        );


    cap.position.y =
        GRENADE_RADIUS *
        1.16 +
        0.025;


    cap.castShadow =
        true;


    group.add(
        cap
    );


    // ========================================================
    // ANILLA
    // ========================================================

    const ringMaterial =
        new THREE.MeshStandardMaterial({

            color:
                0xb0b6ba,

            roughness:
                0.30,

            metalness:
                0.80

        });


    const ring =
        new THREE.Mesh(

            new THREE.TorusGeometry(
                0.052,
                0.009,
                6,
                16
            ),

            ringMaterial

        );


    ring.position.set(

        0.055,

        cap.position.y +
        0.038,

        0

    );


    ring.rotation.y =
        Math.PI /
        2;


    group.add(
        ring
    );


    // ========================================================
    // INDICADOR ROJO
    // ========================================================
    //
    // Sirve para poder seguir visualmente la granada.
    //
    // ========================================================

    const indicatorMaterial =
        new THREE.MeshStandardMaterial({

            color:
                0xff2b2b,

            emissive:
                0xff0000,

            emissiveIntensity:
                2.5,

            roughness:
                0.25,

            metalness:
                0.10

        });


    const indicator =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.035,
                10,
                8
            ),

            indicatorMaterial

        );


    indicator.position.set(

        0,

        GRENADE_RADIUS *
        0.25,

        GRENADE_RADIUS *
        0.92

    );


    group.add(
        indicator
    );


    // ========================================================
    // LUZ DEL INDICADOR
    // ========================================================

    const indicatorLight =
        new THREE.PointLight(

            0xff2200,

            2,

            2.5,

            2

        );


    indicatorLight.position.copy(
        indicator.position
    );


    group.add(
        indicatorLight
    );


    // ========================================================
    // GUARDAR REFERENCIAS
    // ========================================================

    group.userData.indicator =
        indicator;


    group.userData.indicatorLight =
        indicatorLight;


    return group;

}


// ============================================================
// DIRECCIÓN DE LANZAMIENTO
// ============================================================

function getThrowDirection(
    characterRoot
) {

    // ========================================================
    // PRIORIDAD: CÁMARA
    // ========================================================

    if (
        cameraRef
    ) {

        cameraRef.getWorldDirection(
            throwDirection
        );

    } else {

        characterRoot.getWorldDirection(
            throwDirection
        );

    }


    // ========================================================
    // LIMITAR DIRECCIÓN VERTICAL
    // ========================================================
    //
    // Permitimos mirar un poco arriba o abajo,
    // pero evitamos tiros completamente verticales.
    //
    // ========================================================

    throwDirection.y =
        THREE.MathUtils.clamp(

            throwDirection.y,

            -0.15,

            0.22

        );


    // ========================================================
    // SEGURIDAD
    // ========================================================

    if (
        throwDirection.lengthSq() <
        0.0001
    ) {

        throwDirection.set(
            0,
            0,
            -1
        );

    }


    throwDirection.normalize();


    return throwDirection;

}


// ============================================================
// LANZAR GRANADA
// ============================================================

export function launchGrenade(
    characterRoot
) {

    // ========================================================
    // VALIDACIONES
    // ========================================================

    if (
        !canThrowGrenade()
    ) {

        return false;

    }


    if (
        !characterRoot
    ) {

        return false;

    }


    const world =
        getPhysicsWorld();


    if (
        !world
    ) {

        return false;

    }


    // ========================================================
    // DIRECCIÓN SEGÚN CÁMARA
    // ========================================================

    getThrowDirection(
        characterRoot
    );


    // ========================================================
    // POSICIÓN INICIAL
    // ========================================================
    //
    // La granada aparece cerca del personaje.
    //
    // ========================================================

    const startPosition =
        characterRoot.position
            .clone();


    startPosition.y +=
        1.05;


    startPosition.addScaledVector(

        throwDirection,

        0.48

    );


    // ========================================================
    // CREAR MESH
    // ========================================================

    const mesh =
        createGrenadeMesh();


    mesh.position.copy(
        startPosition
    );


    sceneRef.add(
        mesh
    );


    // ========================================================
    // CUERPO FÍSICO
    // ========================================================

    const bodyDesc =
        RAPIER
            .RigidBodyDesc
            .dynamic()

            .setTranslation(

                startPosition.x,

                startPosition.y,

                startPosition.z

            )

            .setLinearDamping(
                0.12
            )

            .setAngularDamping(
                0.20
            )

            .setCcdEnabled(
                true
            );


    const body =
        world.createRigidBody(
            bodyDesc
        );


    // ========================================================
    // COLLIDER
    // ========================================================

    const colliderDesc =
        RAPIER
            .ColliderDesc
            .ball(
                GRENADE_RADIUS
            );


    colliderDesc.setDensity(
        GRENADE_DENSITY
    );


    colliderDesc.setFriction(
        GRENADE_FRICTION
    );


    colliderDesc.setRestitution(
        GRENADE_RESTITUTION
    );


    world.createCollider(
        colliderDesc,
        body
    );


    // ========================================================
    // VELOCIDAD INICIAL
    // ========================================================
    //
    // ESTA ES LA CORRECCIÓN IMPORTANTE.
    //
    // Antes:
    //
    // body.applyImpulse(...)
    //
    // Ahora:
    //
    // body.setLinvel(...)
    //
    // De esta forma la masa de la granada no provoca
    // velocidades exageradas.
    //
    // ========================================================

    body.setLinvel(

        {

            x:
                throwDirection.x *
                THROW_FORCE,

            y:
                THROW_UP_FORCE +
                throwDirection.y *
                1.5,

            z:
                throwDirection.z *
                THROW_FORCE

        },

        true

    );


    // ========================================================
    // ROTACIÓN
    // ========================================================

    body.setAngvel(

        {

            x:
                THREE.MathUtils.randFloat(
                    -5,
                    5
                ),

            y:
                THREE.MathUtils.randFloat(
                    -4,
                    4
                ),

            z:
                THREE.MathUtils.randFloat(
                    -5,
                    5
                )

        },

        true

    );


    // ========================================================
    // REGISTRAR GRANADA
    // ========================================================

    grenades.push({

        mesh,

        body,

        fuse:
            FUSE_TIME,

        exploded:
            false

    });


    // ========================================================
    // COOLDOWN
    // ========================================================

    throwCooldown =
        GRENADE_COOLDOWN;


    console.log(
        '💣 Granada lanzada'
    );


    console.log(
        '➡️ Dirección:',
        {

            x:
                throwDirection.x.toFixed(
                    2
                ),

            y:
                throwDirection.y.toFixed(
                    2
                ),

            z:
                throwDirection.z.toFixed(
                    2
                )

        }
    );


    console.log(
        '🚀 Velocidad:',
        {

            x:
                (
                    throwDirection.x *
                    THROW_FORCE
                ).toFixed(
                    2
                ),

            y:
                (
                    THROW_UP_FORCE +
                    throwDirection.y *
                    1.5
                ).toFixed(
                    2
                ),

            z:
                (
                    throwDirection.z *
                    THROW_FORCE
                ).toFixed(
                    2
                )

        }
    );


    return true;

}


// ============================================================
// EXPLOTAR GRANADA
// ============================================================

function explodeGrenade(
    grenade
) {

    if (
        !grenade ||
        grenade.exploded
    ) {

        return;

    }


    grenade.exploded =
        true;


    const world =
        getPhysicsWorld();


    const position =
        grenade.body.translation();


    explosionPosition.set(

        position.x,

        position.y,

        position.z

    );


    console.log(
        '💥 GRANADA DETONADA'
    );


    console.log(
        '📍 Explosión:',
        {

            x:
                explosionPosition.x.toFixed(
                    2
                ),

            y:
                explosionPosition.y.toFixed(
                    2
                ),

            z:
                explosionPosition.z.toFixed(
                    2
                )

        }
    );


    // ========================================================
    // DAÑO A LOS NÚCLEOS
    // ========================================================

    damageObjectives(

        explosionPosition,

        EXPLOSION_RADIUS

    );


    // ========================================================
    // ONDA EXPANSIVA FÍSICA
    // ========================================================

    applyExplosionForce(
        explosionPosition
    );


    // ========================================================
    // EFECTOS
    // ========================================================

    createExplosionEffects(
        explosionPosition
    );


    // ========================================================
    // ELIMINAR MODELO
    // ========================================================

    sceneRef?.remove(
        grenade.mesh
    );


    disposeObject(
        grenade.mesh
    );


    // ========================================================
    // ELIMINAR CUERPO RAPIER
    // ========================================================

    if (
        world &&
        grenade.body
    ) {

        world.removeRigidBody(
            grenade.body
        );

    }

}


// ============================================================
// ONDA EXPANSIVA FÍSICA
// ============================================================

function applyExplosionForce(
    center
) {

    const objects =
        getDynamicObjects();


    for (
        const object of
        objects
    ) {

        if (
            !object ||
            !object.body ||
            object.destroyed
        ) {

            continue;

        }


        const position =
            object.body.translation();


        // ====================================================
        // DIRECCIÓN DESDE LA EXPLOSIÓN
        // ====================================================

        explosionDirection.set(

            position.x -
            center.x,

            position.y -
            center.y,

            position.z -
            center.z

        );


        let distance =
            explosionDirection.length();


        // ====================================================
        // FUERA DEL RADIO
        // ====================================================

        if (
            distance >
            EXPLOSION_RADIUS
        ) {

            continue;

        }


        // ====================================================
        // EVITAR VECTOR CERO
        // ====================================================

        if (
            distance <
            0.05
        ) {

            explosionDirection.set(

                THREE.MathUtils.randFloat(
                    -1,
                    1
                ),

                0.5,

                THREE.MathUtils.randFloat(
                    -1,
                    1
                )

            );


            distance =
                0.05;

        }


        explosionDirection.normalize();


        // ====================================================
        // CAÍDA DE FUERZA
        // ====================================================

        const falloff =
            THREE.MathUtils.clamp(

                1 -
                distance /
                EXPLOSION_RADIUS,

                0,

                1

            );


        // ====================================================
        // FUERZA
        // ====================================================

        const force =
            EXPLOSION_FORCE *
            (
                0.20 +
                falloff *
                0.80
            );


        // ====================================================
        // IMPULSO
        // ====================================================

        object.body.applyImpulse(

            {

                x:
                    explosionDirection.x *
                    force,

                y:
                    Math.max(

                        EXPLOSION_UP_FORCE *
                        falloff,

                        1.2

                    ),

                z:
                    explosionDirection.z *
                    force

            },

            true

        );


        // ====================================================
        // ROTACIÓN
        // ====================================================

        object.body.applyTorqueImpulse(

            {

                x:
                    THREE.MathUtils.randFloat(
                        -3,
                        3
                    ) *
                    falloff,

                y:
                    THREE.MathUtils.randFloat(
                        -2,
                        2
                    ) *
                    falloff,

                z:
                    THREE.MathUtils.randFloat(
                        -3,
                        3
                    ) *
                    falloff

            },

            true

        );

    }

}


// ============================================================
// CREAR EFECTOS
// ============================================================

function createExplosionEffects(
    position
) {

    createExplosionFlash(
        position
    );


    createFireball(
        position
    );


    createShockwave(
        position
    );


    createExplosionParticles(
        position
    );


    createSmoke(
        position
    );


    createExplosionLight(
        position
    );

}


// ============================================================
// FLASH
// ============================================================

function createExplosionFlash(
    position
) {

    if (
        !sceneRef
    ) {

        return;

    }


    const geometry =
        new THREE.SphereGeometry(
            0.35,
            16,
            12
        );


    const material =
        new THREE.MeshBasicMaterial({

            color:
                0xfff3d0,

            transparent:
                true,

            opacity:
                1,

            blending:
                THREE.AdditiveBlending,

            depthWrite:
                false

        });


    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );


    mesh.position.copy(
        position
    );


    sceneRef.add(
        mesh
    );


    effects.push({

        type:
            'flash',

        object:
            mesh,

        age:
            0,

        duration:
            FLASH_DURATION

    });

}


// ============================================================
// BOLA DE FUEGO
// ============================================================

function createFireball(
    position
) {

    if (
        !sceneRef
    ) {

        return;

    }


    const geometry =
        new THREE.SphereGeometry(
            0.42,
            18,
            14
        );


    const material =
        new THREE.MeshBasicMaterial({

            color:
                0xff6d00,

            transparent:
                true,

            opacity:
                0.82,

            blending:
                THREE.AdditiveBlending,

            depthWrite:
                false

        });


    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );


    mesh.position.copy(
        position
    );


    sceneRef.add(
        mesh
    );


    effects.push({

        type:
            'fireball',

        object:
            mesh,

        age:
            0,

        duration:
            FIREBALL_DURATION

    });

}


// ============================================================
// ONDA EXPANSIVA VISUAL
// ============================================================

function createShockwave(
    position
) {

    if (
        !sceneRef
    ) {

        return;

    }


    const geometry =
        new THREE.RingGeometry(
            0.42,
            0.66,
            40
        );


    const material =
        new THREE.MeshBasicMaterial({

            color:
                0xffb300,

            transparent:
                true,

            opacity:
                0.78,

            side:
                THREE.DoubleSide,

            blending:
                THREE.AdditiveBlending,

            depthWrite:
                false

        });


    const ring =
        new THREE.Mesh(
            geometry,
            material
        );


    ring.position.copy(
        position
    );


    ring.position.y +=
        0.04;


    ring.rotation.x =
        -Math.PI /
        2;


    ring.scale.setScalar(
        0.15
    );


    sceneRef.add(
        ring
    );


    effects.push({

        type:
            'shockwave',

        object:
            ring,

        age:
            0,

        duration:
            SHOCKWAVE_DURATION

    });

}


// ============================================================
// PARTÍCULAS
// ============================================================

function createExplosionParticles(
    position
) {

    if (
        !sceneRef
    ) {

        return;

    }


    const group =
        new THREE.Group();


    group.position.copy(
        position
    );


    sceneRef.add(
        group
    );


    const particles =
        [];


    const PARTICLE_COUNT =
        38;


    for (
        let i = 0;
        i <
        PARTICLE_COUNT;
        i++
    ) {

        const size =
            THREE.MathUtils.randFloat(
                0.025,
                0.085
            );


        const geometry =
            new THREE.SphereGeometry(
                size,
                5,
                5
            );


        const material =
            new THREE.MeshBasicMaterial({

                color:
                    getExplosionColor(),

                transparent:
                    true,

                opacity:
                    1,

                blending:
                    THREE.AdditiveBlending,

                depthWrite:
                    false

            });


        const particle =
            new THREE.Mesh(
                geometry,
                material
            );


        // ====================================================
        // VELOCIDAD ALEATORIA
        // ====================================================

        const velocity =
            new THREE.Vector3(

                THREE.MathUtils.randFloatSpread(
                    2
                ),

                THREE.MathUtils.randFloat(
                    0.1,
                    1.5
                ),

                THREE.MathUtils.randFloatSpread(
                    2
                )

            );


        if (
            velocity.lengthSq() <
            0.001
        ) {

            velocity.set(
                0,
                1,
                0
            );

        }


        velocity
            .normalize()
            .multiplyScalar(

                THREE.MathUtils.randFloat(
                    2.5,
                    7
                )

            );


        particle.userData.velocity =
            velocity;


        particle.userData.spin =
            new THREE.Vector3(

                THREE.MathUtils.randFloatSpread(
                    12
                ),

                THREE.MathUtils.randFloatSpread(
                    12
                ),

                THREE.MathUtils.randFloatSpread(
                    12
                )

            );


        group.add(
            particle
        );


        particles.push(
            particle
        );

    }


    effects.push({

        type:
            'particles',

        object:
            group,

        particles,

        age:
            0,

        duration:
            PARTICLE_DURATION

    });

}


// ============================================================
// COLOR PARTÍCULAS
// ============================================================

function getExplosionColor() {

    const random =
        Math.random();


    if (
        random <
        0.33
    ) {

        return 0xff3d00;

    }


    if (
        random <
        0.66
    ) {

        return 0xff9100;

    }


    return 0xffd740;

}


// ============================================================
// HUMO
// ============================================================

function createSmoke(
    position
) {

    if (
        !sceneRef
    ) {

        return;

    }


    const group =
        new THREE.Group();


    group.position.copy(
        position
    );


    sceneRef.add(
        group
    );


    const particles =
        [];


    const SMOKE_COUNT =
        14;


    for (
        let i = 0;
        i <
        SMOKE_COUNT;
        i++
    ) {

        const geometry =
            new THREE.SphereGeometry(

                THREE.MathUtils.randFloat(
                    0.12,
                    0.24
                ),

                8,

                6

            );


        const gray =
            THREE.MathUtils.randInt(
                45,
                80
            );


        const color =
            new THREE.Color(
                `rgb(${gray}, ${gray}, ${gray})`
            );


        const material =
            new THREE.MeshBasicMaterial({

                color,

                transparent:
                    true,

                opacity:
                    0.28,

                depthWrite:
                    false

            });


        const smoke =
            new THREE.Mesh(
                geometry,
                material
            );


        smoke.position.set(

            THREE.MathUtils.randFloatSpread(
                0.45
            ),

            THREE.MathUtils.randFloat(
                0,
                0.25
            ),

            THREE.MathUtils.randFloatSpread(
                0.45
            )

        );


        smoke.userData.velocity =
            new THREE.Vector3(

                THREE.MathUtils.randFloatSpread(
                    0.28
                ),

                THREE.MathUtils.randFloat(
                    0.45,
                    1.05
                ),

                THREE.MathUtils.randFloatSpread(
                    0.28
                )

            );


        smoke.userData.growth =
            THREE.MathUtils.randFloat(
                0.8,
                1.6
            );


        group.add(
            smoke
        );


        particles.push(
            smoke
        );

    }


    effects.push({

        type:
            'smoke',

        object:
            group,

        particles,

        age:
            0,

        duration:
            SMOKE_DURATION

    });

}


// ============================================================
// LUZ DE EXPLOSIÓN
// ============================================================

function createExplosionLight(
    position
) {

    if (
        !sceneRef
    ) {

        return;

    }


    const light =
        new THREE.PointLight(

            0xff6d00,

            18,

            10,

            2

        );


    light.position.copy(
        position
    );


    light.position.y +=
        0.25;


    sceneRef.add(
        light
    );


    effects.push({

        type:
            'light',

        object:
            light,

        originalIntensity:
            18,

        age:
            0,

        duration:
            LIGHT_DURATION

    });

}


// ============================================================
// ACTUALIZAR INDICADOR DE GRANADA
// ============================================================

function updateGrenadeIndicator(
    grenade
) {

    const indicator =
        grenade.mesh
            .userData
            .indicator;


    const light =
        grenade.mesh
            .userData
            .indicatorLight;


    if (
        !indicator ||
        !indicator.material
    ) {

        return;

    }


    const fuseRatio =
        THREE.MathUtils.clamp(

            grenade.fuse /
            FUSE_TIME,

            0,

            1

        );


    // ========================================================
    // PARPADEO MÁS RÁPIDO CERCA DE LA EXPLOSIÓN
    // ========================================================

    const frequency =
        THREE.MathUtils.lerp(

            0.012,

            0.050,

            1 -
            fuseRatio

        );


    const pulse =
        (
            Math.sin(
                performance.now() *
                frequency
            ) +
            1
        ) /
        2;


    // ========================================================
    // EMISIÓN
    // ========================================================

    indicator.material.emissiveIntensity =
        THREE.MathUtils.lerp(
            0.8,
            6,
            pulse
        );


    // ========================================================
    // TAMAÑO
    // ========================================================

    const scale =
        THREE.MathUtils.lerp(
            0.85,
            1.35,
            pulse
        );


    indicator.scale.setScalar(
        scale
    );


    // ========================================================
    // LUZ
    // ========================================================

    if (
        light
    ) {

        light.intensity =
            THREE.MathUtils.lerp(
                0.4,
                3.5,
                pulse
            );

    }

}


// ============================================================
// ACTUALIZAR EFECTOS
// ============================================================

function updateEffects(
    delta
) {

    for (
        let i =
            effects.length -
            1;
        i >= 0;
        i--
    ) {

        const effect =
            effects[i];


        effect.age +=
            delta;


        const progress =
            THREE.MathUtils.clamp(

                effect.age /
                effect.duration,

                0,

                1

            );


        // ====================================================
        // FLASH
        // ====================================================

        if (
            effect.type ===
            'flash'
        ) {

            effect.object.scale.setScalar(

                THREE.MathUtils.lerp(
                    0.5,
                    5,
                    progress
                )

            );


            effect.object.material.opacity =
                1 -
                progress;

        }


        // ====================================================
        // BOLA DE FUEGO
        // ====================================================

        if (
            effect.type ===
            'fireball'
        ) {

            const scale =
                THREE.MathUtils.lerp(
                    0.4,
                    5.2,
                    progress
                );


            effect.object.scale.setScalar(
                scale
            );


            effect.object.material.opacity =
                (
                    1 -
                    progress
                ) *
                0.82;


            effect.object.rotation.y +=
                delta *
                3;

        }


        // ====================================================
        // ONDA EXPANSIVA
        // ====================================================

        if (
            effect.type ===
            'shockwave'
        ) {

            const scale =
                THREE.MathUtils.lerp(

                    0.15,

                    EXPLOSION_RADIUS *
                    2,

                    progress

                );


            effect.object.scale.setScalar(
                scale
            );


            effect.object.material.opacity =
                (
                    1 -
                    progress
                ) *
                0.78;

        }


        // ====================================================
        // PARTÍCULAS
        // ====================================================

        if (
            effect.type ===
            'particles'
        ) {

            for (
                const particle of
                effect.particles
            ) {

                particle.position
                    .addScaledVector(

                        particle
                            .userData
                            .velocity,

                        delta

                    );


                // =============================================
                // GRAVEDAD
                // =============================================

                particle
                    .userData
                    .velocity
                    .y -=
                    5.8 *
                    delta;


                // =============================================
                // GIRO
                // =============================================

                particle.rotation.x +=

                    particle
                        .userData
                        .spin
                        .x *
                    delta;


                particle.rotation.y +=

                    particle
                        .userData
                        .spin
                        .y *
                    delta;


                particle.rotation.z +=

                    particle
                        .userData
                        .spin
                        .z *
                    delta;


                // =============================================
                // OPACIDAD
                // =============================================

                particle.material.opacity =
                    1 -
                    progress;


                // =============================================
                // TAMAÑO
                // =============================================

                particle.scale.setScalar(

                    Math.max(

                        0.05,

                        1 -
                        progress *
                        0.75

                    )

                );

            }

        }


        // ====================================================
        // HUMO
        // ====================================================

        if (
            effect.type ===
            'smoke'
        ) {

            for (
                const smoke of
                effect.particles
            ) {

                smoke.position
                    .addScaledVector(

                        smoke
                            .userData
                            .velocity,

                        delta

                    );


                const growth =
                    1 +
                    progress *
                    smoke
                        .userData
                        .growth;


                smoke.scale.setScalar(
                    growth
                );


                smoke.material.opacity =
                    (
                        1 -
                        progress
                    ) *
                    0.28;

            }

        }


        // ====================================================
        // LUZ
        // ====================================================

        if (
            effect.type ===
            'light'
        ) {

            effect.object.intensity =
                effect.originalIntensity *
                (
                    1 -
                    progress
                );

        }


        // ====================================================
        // ELIMINAR EFECTO
        // ====================================================

        if (
            progress >=
            1
        ) {

            sceneRef?.remove(
                effect.object
            );


            disposeObject(
                effect.object
            );


            effects.splice(
                i,
                1
            );

        }

    }

}


// ============================================================
// ACTUALIZAR GRANADAS
// ============================================================

export function updateGrenades(
    delta
) {

    // ========================================================
    // COOLDOWN
    // ========================================================

    if (
        throwCooldown >
        0
    ) {

        throwCooldown =
            Math.max(

                0,

                throwCooldown -
                delta

            );

    }


    // ========================================================
    // GRANADAS
    // ========================================================

    for (
        let i =
            grenades.length -
            1;
        i >= 0;
        i--
    ) {

        const grenade =
            grenades[i];


        // ====================================================
        // YA EXPLOTÓ
        // ====================================================

        if (
            grenade.exploded
        ) {

            grenades.splice(
                i,
                1
            );


            continue;

        }


        // ====================================================
        // SINCRONIZAR CON RAPIER
        // ====================================================

        const position =
            grenade.body.translation();


        const rotation =
            grenade.body.rotation();


        grenade.mesh.position.set(

            position.x,

            position.y,

            position.z

        );


        grenade.mesh.quaternion.set(

            rotation.x,

            rotation.y,

            rotation.z,

            rotation.w

        );


        // ====================================================
        // FUSIBLE
        // ====================================================

        grenade.fuse -=
            delta;


        // ====================================================
        // PARPADEO
        // ====================================================

        updateGrenadeIndicator(
            grenade
        );


        // ====================================================
        // EXPLOTAR
        // ====================================================

        if (
            grenade.fuse <=
            0
        ) {

            explodeGrenade(
                grenade
            );


            grenades.splice(
                i,
                1
            );

        }

    }


    // ========================================================
    // EFECTOS
    // ========================================================

    updateEffects(
        delta
    );

}


// ============================================================
// RESET
// ============================================================

export function resetGrenades() {

    const world =
        getPhysicsWorld();


    // ========================================================
    // GRANADAS
    // ========================================================

    for (
        const grenade of
        grenades
    ) {

        sceneRef?.remove(
            grenade.mesh
        );


        disposeObject(
            grenade.mesh
        );


        if (
            world &&
            grenade.body
        ) {

            world.removeRigidBody(
                grenade.body
            );

        }

    }


    grenades.length =
        0;


    // ========================================================
    // EFECTOS
    // ========================================================

    for (
        const effect of
        effects
    ) {

        sceneRef?.remove(
            effect.object
        );


        disposeObject(
            effect.object
        );

    }


    effects.length =
        0;


    // ========================================================
    // COOLDOWN
    // ========================================================

    throwCooldown =
        0;


    console.log(
        '🔄 Granadas reiniciadas'
    );

}


// ============================================================
// LIBERAR RECURSOS
// ============================================================

function disposeObject(
    object
) {

    if (
        !object
    ) {

        return;

    }


    object.traverse?.(

        (child) => {

            // =================================================
            // GEOMETRÍA
            // =================================================

            if (
                child.geometry
            ) {

                child.geometry.dispose();

            }


            // =================================================
            // MATERIAL
            // =================================================

            if (
                child.material
            ) {

                if (
                    Array.isArray(
                        child.material
                    )
                ) {

                    child.material.forEach(

                        (material) => {

                            material.dispose();

                        }

                    );

                } else {

                    child.material.dispose();

                }

            }

        }

    );

}