import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

import {
    getPhysicsWorld
} from './physics.js';

import {
    getDynamicObjects
} from './objects.js';


// ============================================================
// CONFIGURACIÓN
// ============================================================

const GRENADE_RADIUS = 0.12;

const THROW_FORCE = 8.5;

const THROW_UP_FORCE = 3.8;

const FUSE_TIME = 2.5;

const EXPLOSION_RADIUS = 4.2;

const EXPLOSION_FORCE = 5.8;

const GRENADE_COOLDOWN = 1.0;

const MAX_ACTIVE_GRENADES = 5;


// ============================================================
// ESTADO
// ============================================================

let sceneRef = null;

let cooldownRemaining = 0;

const grenades = [];

const explosionEffects = [];


// ============================================================
// VECTORES TEMPORALES
// ============================================================

const forwardVector =
    new THREE.Vector3();

const grenadeOrigin =
    new THREE.Vector3();

const explosionDirection =
    new THREE.Vector3();


// ============================================================
// INICIALIZAR
// ============================================================

export function initGrenadeSystem(scene) {

    sceneRef = scene;

    console.log(
        '💣 Sistema de granadas listo'
    );

}


// ============================================================
// PUEDE LANZAR
// ============================================================

export function canThrowGrenade() {

    if (!sceneRef) {
        return false;
    }

    if (cooldownRemaining > 0) {
        return false;
    }

    if (
        grenades.length >=
        MAX_ACTIVE_GRENADES
    ) {
        return false;
    }

    return true;

}


// ============================================================
// LANZAR GRANADA
// ============================================================

export function launchGrenade(
    characterRoot
) {

    if (!canThrowGrenade()) {
        return false;
    }


    const world =
        getPhysicsWorld();


    if (!world) {

        console.warn(
            '⚠️ Mundo Rapier no disponible.'
        );

        return false;

    }


    // ========================================================
    // DIRECCIÓN DEL PERSONAJE
    // ========================================================

    forwardVector.set(
        0,
        0,
        1
    );


    forwardVector.applyQuaternion(
        characterRoot.quaternion
    );


    forwardVector.y = 0;


    if (
        forwardVector.lengthSq() === 0
    ) {

        forwardVector.set(
            0,
            0,
            1
        );

    }


    forwardVector.normalize();


    // ========================================================
    // POSICIÓN DE SALIDA
    // ========================================================

    grenadeOrigin
        .copy(
            characterRoot.position
        )
        .addScaledVector(
            forwardVector,
            0.75
        );


    grenadeOrigin.y +=
        1.0;


    // ========================================================
    // MODELO VISUAL
    // ========================================================

    const grenadeMesh =
        createGrenadeVisual();


    grenadeMesh.position.copy(
        grenadeOrigin
    );


    sceneRef.add(
        grenadeMesh
    );


    // ========================================================
    // RIGID BODY
    // ========================================================

    const rigidBodyDesc =
        RAPIER
            .RigidBodyDesc
            .dynamic()
            .setTranslation(
                grenadeOrigin.x,
                grenadeOrigin.y,
                grenadeOrigin.z
            )
            .setCcdEnabled(
                true
            );


    const body =
        world.createRigidBody(
            rigidBodyDesc
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
        1.4
    );


    colliderDesc.setFriction(
        0.65
    );


    colliderDesc.setRestitution(
        0.55
    );


    world.createCollider(
        colliderDesc,
        body
    );


    // ========================================================
    // VELOCIDAD
    // ========================================================

    body.setLinvel(
        {
            x:
                forwardVector.x *
                THROW_FORCE,

            y:
                THROW_UP_FORCE,

            z:
                forwardVector.z *
                THROW_FORCE
        },
        true
    );


    body.setAngvel(
        {
            x: 8,
            y: 5,
            z: 10
        },
        true
    );


    // ========================================================
    // REGISTRAR
    // ========================================================

    grenades.push({
        mesh:
            grenadeMesh,

        body,

        fuse:
            FUSE_TIME
    });


    cooldownRemaining =
        GRENADE_COOLDOWN;


    console.log(
        '💣 Granada lanzada'
    );


    return true;

}


// ============================================================
// CREAR MODELO DE GRANADA
// ============================================================

function createGrenadeVisual() {

    const group =
        new THREE.Group();


    group.name =
        'Grenade';


    // ========================================================
    // CUERPO
    // ========================================================

    const bodyMaterial =
        new THREE.MeshStandardMaterial({
            color:
                0x3e4b26,

            roughness:
                0.75,

            metalness:
                0.2
        });


    const bodyMesh =
        new THREE.Mesh(

            new THREE.IcosahedronGeometry(
                GRENADE_RADIUS,
                2
            ),

            bodyMaterial

        );


    bodyMesh.scale.set(
        1,
        1.15,
        1
    );


    bodyMesh.castShadow =
        true;


    bodyMesh.receiveShadow =
        true;


    group.add(
        bodyMesh
    );


    // ========================================================
    // BANDA
    // ========================================================

    const bandMaterial =
        new THREE.MeshStandardMaterial({
            color:
                0x252a1b,

            roughness:
                0.65,

            metalness:
                0.45
        });


    const band =
        new THREE.Mesh(

            new THREE.TorusGeometry(
                0.095,
                0.012,
                8,
                20
            ),

            bandMaterial

        );


    band.rotation.x =
        Math.PI /
        2;


    band.castShadow =
        true;


    group.add(
        band
    );


    // ========================================================
    // PARTE SUPERIOR
    // ========================================================

    const metalMaterial =
        new THREE.MeshStandardMaterial({
            color:
                0x555555,

            roughness:
                0.35,

            metalness:
                0.8
        });


    const top =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.045,
                0.055,
                0.08,
                10
            ),

            metalMaterial

        );


    top.position.y =
        0.15;


    top.castShadow =
        true;


    group.add(
        top
    );


    // ========================================================
    // PALANCA
    // ========================================================

    const lever =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                0.035,
                0.11,
                0.12
            ),

            metalMaterial

        );


    lever.position.set(
        0.025,
        0.19,
        -0.035
    );


    lever.rotation.x =
        -0.25;


    lever.castShadow =
        true;


    group.add(
        lever
    );


    // ========================================================
    // ANILLA
    // ========================================================

    const ring =
        new THREE.Mesh(

            new THREE.TorusGeometry(
                0.045,
                0.007,
                8,
                18
            ),

            metalMaterial

        );


    ring.position.set(
        0.085,
        0.17,
        0
    );


    ring.rotation.y =
        Math.PI /
        2;


    group.add(
        ring
    );


    return group;

}


// ============================================================
// ACTUALIZAR GRANADAS
// ============================================================

export function updateGrenades(
    delta
) {

    if (
        cooldownRemaining >
        0
    ) {

        cooldownRemaining =
            Math.max(
                0,
                cooldownRemaining -
                delta
            );

    }


    // ========================================================
    // GRANADAS ACTIVAS
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


        grenade.fuse -=
            delta;


        // ====================================================
        // SINCRONIZAR THREE / RAPIER
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
        // EXPLOTAR
        // ====================================================

        if (
            grenade.fuse <=
            0
        ) {

            explodeGrenade(
                i
            );

        }

    }


    // ========================================================
    // EFECTOS DE EXPLOSIÓN
    // ========================================================

    updateExplosionEffects(
        delta
    );

}


// ============================================================
// EXPLOTAR GRANADA
// ============================================================

function explodeGrenade(
    index
) {

    const grenade =
        grenades[index];


    if (!grenade) {
        return;
    }


    const world =
        getPhysicsWorld();


    const translation =
        grenade.body.translation();


    const explosionPosition =
        new THREE.Vector3(
            translation.x,
            translation.y,
            translation.z
        );


    console.log(
        '💥 EXPLOSIÓN',
        explosionPosition
    );


    // ========================================================
    // ONDA EXPANSIVA
    // ========================================================

    applyExplosionForce(
        explosionPosition
    );


    // ========================================================
    // EFECTO VISUAL
    // ========================================================

    createExplosionEffect(
        explosionPosition
    );


    // ========================================================
    // ELIMINAR GRANADA
    // ========================================================

    if (
        world
    ) {

        world.removeRigidBody(
            grenade.body
        );

    }


    sceneRef.remove(
        grenade.mesh
    );


    disposeObject3D(
        grenade.mesh
    );


    grenades.splice(
        index,
        1
    );

}


// ============================================================
// APLICAR FUERZA DE EXPLOSIÓN
// ============================================================

function applyExplosionForce(
    explosionPosition
) {

    const objects =
        getDynamicObjects();


    for (
        const object of objects
    ) {

        if (
            !object.body
        ) {

            continue;

        }


        const translation =
            object.body.translation();


        explosionDirection.set(

            translation.x -
                explosionPosition.x,

            translation.y -
                explosionPosition.y,

            translation.z -
                explosionPosition.z

        );


        const distance =
            explosionDirection.length();


        if (
            distance >
            EXPLOSION_RADIUS
        ) {

            continue;

        }


        if (
            distance <
            0.05
        ) {

            explosionDirection.set(
                0,
                1,
                0
            );

        } else {

            explosionDirection.normalize();

        }


        // ====================================================
        // UN POCO MÁS DE FUERZA HACIA ARRIBA
        // ====================================================

        explosionDirection.y +=
            0.45;


        explosionDirection.normalize();


        // ====================================================
        // FUERZA SEGÚN DISTANCIA
        // ====================================================

        const falloff =
            1 -
            THREE.MathUtils.clamp(
                distance /
                EXPLOSION_RADIUS,
                0,
                1
            );


        const strength =
            0.8 +
            EXPLOSION_FORCE *
            falloff;


        object.body.applyImpulse(
            {
                x:
                    explosionDirection.x *
                    strength,

                y:
                    explosionDirection.y *
                    strength,

                z:
                    explosionDirection.z *
                    strength
            },
            true
        );

    }

}


// ============================================================
// EFECTO VISUAL
// ============================================================

function createExplosionEffect(
    position
) {

    if (!sceneRef) {
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


    // ========================================================
    // BOLA DE FUEGO
    // ========================================================

    const flashMaterial =
        new THREE.MeshBasicMaterial({
            color:
                0xffa000,

            transparent:
                true,

            opacity:
                1,

            depthWrite:
                false
        });


    const flash =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.28,
                16,
                16
            ),

            flashMaterial

        );


    group.add(
        flash
    );


    // ========================================================
    // ONDA EXPANSIVA
    // ========================================================

    const waveMaterial =
        new THREE.MeshBasicMaterial({
            color:
                0xffd54f,

            transparent:
                true,

            opacity:
                0.8,

            wireframe:
                true,

            depthWrite:
                false
        });


    const wave =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.4,
                16,
                12
            ),

            waveMaterial

        );


    group.add(
        wave
    );


    // ========================================================
    // PARTÍCULAS
    // ========================================================

    const particleGeometry =
        new THREE.SphereGeometry(
            0.055,
            6,
            6
        );


    const particleMaterial =
        new THREE.MeshBasicMaterial({
            color:
                0xff6d00,

            transparent:
                true,

            opacity:
                1,

            depthWrite:
                false
        });


    const particles = [];


    for (
        let i = 0;
        i < 24;
        i++
    ) {

        const particle =
            new THREE.Mesh(
                particleGeometry,
                particleMaterial
            );


        particle.position.set(
            0,
            0,
            0
        );


        const direction =
            new THREE.Vector3(

                Math.random() *
                    2 -
                    1,

                Math.random() *
                    1.6 +
                    0.2,

                Math.random() *
                    2 -
                    1

            )
                .normalize();


        const speed =
            THREE.MathUtils.randFloat(
                2.5,
                6
            );


        particle.userData.velocity =
            direction.multiplyScalar(
                speed
            );


        group.add(
            particle
        );


        particles.push(
            particle
        );

    }


    // ========================================================
    // LUZ DE EXPLOSIÓN
    // ========================================================

    const light =
        new THREE.PointLight(
            0xff8c00,
            35,
            8,
            2
        );


    light.position.set(
        0,
        0.3,
        0
    );


    group.add(
        light
    );


    // ========================================================
    // REGISTRAR EFECTO
    // ========================================================

    explosionEffects.push({

        group,

        flash,

        wave,

        particles,

        light,

        age:
            0,

        duration:
            0.7

    });

}


// ============================================================
// ACTUALIZAR EXPLOSIONES
// ============================================================

function updateExplosionEffects(
    delta
) {

    for (
        let i =
            explosionEffects.length -
            1;
        i >= 0;
        i--
    ) {

        const effect =
            explosionEffects[i];


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
        // BOLA DE FUEGO
        // ====================================================

        const flashScale =
            1 +
            progress *
            5;


        effect.flash.scale.setScalar(
            flashScale
        );


        effect.flash.material.opacity =
            1 -
            progress;


        // ====================================================
        // ONDA EXPANSIVA
        // ====================================================

        const waveScale =
            1 +
            progress *
            9;


        effect.wave.scale.setScalar(
            waveScale
        );


        effect.wave.material.opacity =
            (
                1 -
                progress
            ) *
            0.75;


        // ====================================================
        // PARTÍCULAS
        // ====================================================

        for (
            const particle of
            effect.particles
        ) {

            const velocity =
                particle.userData
                    .velocity;


            particle.position.addScaledVector(
                velocity,
                delta
            );


            velocity.y -=
                4.2 *
                delta;


            particle.scale.setScalar(
                Math.max(
                    0.1,
                    1 -
                    progress *
                    0.7
                )
            );


            particle.material.opacity =
                1 -
                progress;

        }


        // ====================================================
        // LUZ
        // ====================================================

        effect.light.intensity =
            35 *
            (
                1 -
                progress
            );


        // ====================================================
        // TERMINAR
        // ====================================================

        if (
            progress >=
            1
        ) {

            sceneRef.remove(
                effect.group
            );


            disposeObject3D(
                effect.group
            );


            explosionEffects.splice(
                i,
                1
            );

        }

    }

}


// ============================================================
// REINICIAR GRANADAS
// ============================================================

export function resetGrenades() {

    const world =
        getPhysicsWorld();


    for (
        const grenade of grenades
    ) {

        if (
            world
        ) {

            world.removeRigidBody(
                grenade.body
            );

        }


        if (
            sceneRef
        ) {

            sceneRef.remove(
                grenade.mesh
            );

        }


        disposeObject3D(
            grenade.mesh
        );

    }


    grenades.length =
        0;


    for (
        const effect of
        explosionEffects
    ) {

        if (
            sceneRef
        ) {

            sceneRef.remove(
                effect.group
            );

        }


        disposeObject3D(
            effect.group
        );

    }


    explosionEffects.length =
        0;


    cooldownRemaining =
        0;

}


// ============================================================
// LIBERAR GEOMETRÍAS / MATERIALES
// ============================================================

function disposeObject3D(
    object
) {

    object.traverse(
        (child) => {

            if (
                child.geometry
            ) {

                child.geometry.dispose();

            }


            if (
                child.material
            ) {

                if (
                    Array.isArray(
                        child.material
                    )
                ) {

                    child.material.forEach(
                        (material) =>
                            material.dispose()
                    );

                } else {

                    child.material.dispose();

                }

            }

        }
    );

}