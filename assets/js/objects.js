import * as THREE from 'three';

import RAPIER from '@dimforge/rapier3d-compat';

import {
    getPhysicsWorld
} from './physics.js';


// ============================================================
// OPERATION IMPACT
// OBJECTS.JS
// VERSION 1.0.7
//
// FIGURAS FÍSICAS
// DISTRIBUCIÓN ALEATORIA
// PLATAFORMAS
// TORRE
// VIDA
// DESTRUCCIÓN
// CCD
// PROTECCIÓN CONTRA TUNNELING
// LÍMITES DE VELOCIDAD
// RESET DE SEGURIDAD
// ============================================================


// ============================================================
// CONFIGURACIÓN GENERAL
// ============================================================

const DEFAULT_OBJECT_HEALTH =
    100;

const FLOOR_OBJECT_COUNT =
    18;

const PLATFORM_GROUP_COUNT =
    3;


// ============================================================
// DISTANCIAS DE SEGURIDAD
// ============================================================

const SPAWN_SAFE_DISTANCE =
    5.0;

const RESERVED_SAFE_DISTANCE =
    2.3;

const OBJECT_SPACING =
    1.45;


// ============================================================
// FÍSICA
// ============================================================
//
// Estas densidades hacen que las figuras tengan más peso
// y no salgan disparadas exageradamente con cada bala.
//
// ============================================================

const BOX_DENSITY =
    6.0;

const SPHERE_DENSITY =
    5.0;

const CYLINDER_DENSITY =
    7.0;

const CONE_DENSITY =
    5.5;

const TOWER_DENSITY =
    7.5;


// ============================================================
// DAMPING
// ============================================================

const LINEAR_DAMPING =
    0.65;

const ANGULAR_DAMPING =
    0.90;


// ============================================================
// SEGURIDAD DE VELOCIDAD
// ============================================================
//
// Muy importante.
//
// Aunque CCD esté habilitado, evitar velocidades absurdamente
// grandes ayuda todavía más a impedir que los cuerpos atraviesen
// paredes del escenario.
//
// ============================================================

const MAX_HORIZONTAL_SPEED =
    11;

const MAX_VERTICAL_SPEED =
    8;

const MAX_ANGULAR_SPEED =
    16;


// ============================================================
// SEGURIDAD DEL ESCENARIO
// ============================================================

const MAP_RESET_MARGIN =
    2.5;

const MIN_SAFE_Y =
    -7;

const MAX_SAFE_Y =
    20;


// ============================================================
// OBJETOS
// ============================================================

const dynamicObjects =
    [];


// ============================================================
// ESTADOS INICIALES
// ============================================================

const initialStates =
    [];


// ============================================================
// POSICIONES UTILIZADAS
// ============================================================

const usedPositions =
    [];


// ============================================================
// GRUPO
// ============================================================

let objectsGroup =
    null;


// ============================================================
// LÍMITES DEL MAPA
// ============================================================

const mapBounds = {

    minX:
        -22,

    maxX:
        22,

    minZ:
        -22,

    maxZ:
        22

};


// ============================================================
// GENERADOR ALEATORIO DETERMINISTA
// ============================================================

let randomSeed =
    123456789;


// ============================================================
// MATERIALES BASE
// ============================================================

const boxMaterial =
    new THREE.MeshStandardMaterial({

        color:
            0x795548,

        roughness:
            0.75,

        metalness:
            0.05

    });


const sphereMaterial =
    new THREE.MeshStandardMaterial({

        color:
            0x1565c0,

        roughness:
            0.45,

        metalness:
            0.20

    });


const cylinderMaterial =
    new THREE.MeshStandardMaterial({

        color:
            0xb71c1c,

        roughness:
            0.55,

        metalness:
            0.35

    });


const coneMaterial =
    new THREE.MeshStandardMaterial({

        color:
            0xef6c00,

        roughness:
            0.60,

        metalness:
            0.05

    });


const towerMaterial =
    new THREE.MeshStandardMaterial({

        color:
            0x8d6e63,

        roughness:
            0.75,

        metalness:
            0.05

    });


// ============================================================
// RANDOM DETERMINISTA
// ============================================================

function seededRandom() {

    randomSeed =
        (
            randomSeed *
            1664525 +
            1013904223
        ) %
        4294967296;


    return (
        randomSeed /
        4294967296
    );

}


// ============================================================
// RANDOM ENTRE DOS NÚMEROS
// ============================================================

function randomRange(
    min,
    max
) {

    return (
        min +
        seededRandom() *
        (
            max -
            min
        )
    );

}


// ============================================================
// CREAR MATERIAL ÚNICO
// ============================================================
//
// Cada figura recibe su propio material.
//
// Esto será importante después para poder mostrar daño visual
// sin cambiar el color de todas las demás figuras.
//
// ============================================================

function cloneMaterial(
    material
) {

    return material.clone();

}


// ============================================================
// CREAR CUERPO DINÁMICO
// ============================================================
//
// AQUÍ ESTÁ UNA DE LAS CORRECCIONES MÁS IMPORTANTES.
//
// setCcdEnabled(true)
//
// CCD = Continuous Collision Detection.
//
// Rapier comprobará mejor las colisiones de objetos que se
// desplazan rápidamente.
//
// ============================================================

function createHeavyBody(
    world,
    x,
    y,
    z
) {

    const bodyDesc =
        RAPIER
            .RigidBodyDesc
            .dynamic()

            .setTranslation(
                x,
                y,
                z
            )

            .setCcdEnabled(
                true
            )

            .setLinearDamping(
                LINEAR_DAMPING
            )

            .setAngularDamping(
                ANGULAR_DAMPING
            );


    return world.createRigidBody(
        bodyDesc
    );

}


// ============================================================
// DISTANCIA 2D
// ============================================================

function distance2D(
    x1,
    z1,
    x2,
    z2
) {

    const dx =
        x1 -
        x2;


    const dz =
        z1 -
        z2;


    return Math.sqrt(
        dx * dx +
        dz * dz
    );

}


// ============================================================
// LEER POSICIÓN X/Z
// ============================================================

function getXZ(
    value
) {

    if (
        !value
    ) {

        return null;

    }


    const x =
        Number(
            value.x
        );


    const z =
        Number(
            value.z
        );


    if (
        !Number.isFinite(
            x
        ) ||
        !Number.isFinite(
            z
        )
    ) {

        return null;

    }


    return {
        x,
        z
    };

}


// ============================================================
// COMPROBAR POSICIÓN SEGURA
// ============================================================

function isPositionSafe(
    x,
    z,
    spawn,
    reservedPositions = []
) {

    // ========================================================
    // SPAWN DEL JUGADOR
    // ========================================================

    const spawnPosition =
        getXZ(
            spawn
        );


    if (
        spawnPosition
    ) {

        const distanceFromSpawn =
            distance2D(

                x,
                z,

                spawnPosition.x,
                spawnPosition.z

            );


        if (
            distanceFromSpawn <
            SPAWN_SAFE_DISTANCE
        ) {

            return false;

        }

    }


    // ========================================================
    // OBJETIVOS / NÚCLEOS
    // ========================================================

    for (
        const reserved of
        reservedPositions
    ) {

        const position =
            getXZ(
                reserved
            );


        if (
            !position
        ) {

            continue;

        }


        const distance =
            distance2D(

                x,
                z,

                position.x,
                position.z

            );


        if (
            distance <
            RESERVED_SAFE_DISTANCE
        ) {

            return false;

        }

    }


    // ========================================================
    // OTRAS FIGURAS
    // ========================================================

    for (
        const used of
        usedPositions
    ) {

        const distance =
            distance2D(

                x,
                z,

                used.x,
                used.z

            );


        if (
            distance <
            OBJECT_SPACING
        ) {

            return false;

        }

    }


    return true;

}


// ============================================================
// REGISTRAR POSICIÓN
// ============================================================

function reservePosition(
    x,
    z
) {

    usedPositions.push({

        x,

        z

    });

}


// ============================================================
// REGISTRAR OBJETO
// ============================================================

function registerDynamicObject(
    mesh,
    body,
    type
) {

    const translation =
        body.translation();


    const rotation =
        body.rotation();


    const item = {

        mesh,

        body,

        type,

        health:
            DEFAULT_OBJECT_HEALTH,

        maxHealth:
            DEFAULT_OBJECT_HEALTH,

        destroyed:
            false,

        hitFlash:
            0

    };


    dynamicObjects.push(
        item
    );


    initialStates.push({

        item,

        body,

        mesh,

        position: {

            x:
                translation.x,

            y:
                translation.y,

            z:
                translation.z

        },

        rotation: {

            x:
                rotation.x,

            y:
                rotation.y,

            z:
                rotation.z,

            w:
                rotation.w

        }

    });


    return item;

}


// ============================================================
// CREAR CAJA
// ============================================================

function createBox({

    x,

    z,

    width,

    height,

    depth,

    baseY,

    material =
        boxMaterial,

    density =
        BOX_DENSITY,

    type =
        'box'

}) {

    const world =
        getPhysicsWorld();


    if (
        !world ||
        !Number.isFinite(
            baseY
        )
    ) {

        return null;

    }


    const y =
        baseY +
        height /
        2 +
        0.035;


    // ========================================================
    // THREE.JS
    // ========================================================

    const geometry =
        new THREE.BoxGeometry(

            width,

            height,

            depth

        );


    const mesh =
        new THREE.Mesh(

            geometry,

            cloneMaterial(
                material
            )

        );


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    mesh.position.set(
        x,
        y,
        z
    );


    objectsGroup.add(
        mesh
    );


    // ========================================================
    // RAPIER
    // ========================================================

    const body =
        createHeavyBody(
            world,
            x,
            y,
            z
        );


    const colliderDesc =
        RAPIER
            .ColliderDesc
            .cuboid(

                width /
                2,

                height /
                2,

                depth /
                2

            );


    colliderDesc.setDensity(
        density
    );


    colliderDesc.setFriction(
        type ===
            'tower'
            ?
            0.95
            :
            0.90
    );


    colliderDesc.setRestitution(
        type ===
            'tower'
            ?
            0.01
            :
            0.03
    );


    world.createCollider(

        colliderDesc,

        body

    );


    return registerDynamicObject(

        mesh,

        body,

        type

    );

}


// ============================================================
// CREAR ESFERA
// ============================================================

function createSphere({

    x,

    z,

    radius,

    baseY

}) {

    const world =
        getPhysicsWorld();


    if (
        !world ||
        !Number.isFinite(
            baseY
        )
    ) {

        return null;

    }


    const y =
        baseY +
        radius +
        0.035;


    const geometry =
        new THREE.SphereGeometry(

            radius,

            24,

            18

        );


    const mesh =
        new THREE.Mesh(

            geometry,

            cloneMaterial(
                sphereMaterial
            )

        );


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    mesh.position.set(
        x,
        y,
        z
    );


    objectsGroup.add(
        mesh
    );


    const body =
        createHeavyBody(
            world,
            x,
            y,
            z
        );


    const colliderDesc =
        RAPIER
            .ColliderDesc
            .ball(
                radius
            );


    colliderDesc.setDensity(
        SPHERE_DENSITY
    );


    colliderDesc.setFriction(
        0.68
    );


    colliderDesc.setRestitution(
        0.16
    );


    world.createCollider(

        colliderDesc,

        body

    );


    return registerDynamicObject(

        mesh,

        body,

        'sphere'

    );

}


// ============================================================
// CREAR CILINDRO
// ============================================================

function createCylinder({

    x,

    z,

    radius,

    height,

    baseY

}) {

    const world =
        getPhysicsWorld();


    if (
        !world ||
        !Number.isFinite(
            baseY
        )
    ) {

        return null;

    }


    const y =
        baseY +
        height /
        2 +
        0.035;


    const geometry =
        new THREE.CylinderGeometry(

            radius,

            radius,

            height,

            24

        );


    const mesh =
        new THREE.Mesh(

            geometry,

            cloneMaterial(
                cylinderMaterial
            )

        );


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    mesh.position.set(
        x,
        y,
        z
    );


    objectsGroup.add(
        mesh
    );


    const body =
        createHeavyBody(
            world,
            x,
            y,
            z
        );


    const colliderDesc =
        RAPIER
            .ColliderDesc
            .cylinder(

                height /
                2,

                radius

            );


    colliderDesc.setDensity(
        CYLINDER_DENSITY
    );


    colliderDesc.setFriction(
        0.86
    );


    colliderDesc.setRestitution(
        0.05
    );


    world.createCollider(

        colliderDesc,

        body

    );


    return registerDynamicObject(

        mesh,

        body,

        'cylinder'

    );

}


// ============================================================
// CREAR CONO
// ============================================================

function createCone({

    x,

    z,

    radius,

    height,

    baseY

}) {

    const world =
        getPhysicsWorld();


    if (
        !world ||
        !Number.isFinite(
            baseY
        )
    ) {

        return null;

    }


    const y =
        baseY +
        height /
        2 +
        0.035;


    const geometry =
        new THREE.ConeGeometry(

            radius,

            height,

            24

        );


    const mesh =
        new THREE.Mesh(

            geometry,

            cloneMaterial(
                coneMaterial
            )

        );


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    mesh.position.set(
        x,
        y,
        z
    );


    objectsGroup.add(
        mesh
    );


    const body =
        createHeavyBody(
            world,
            x,
            y,
            z
        );


    const colliderDesc =
        RAPIER
            .ColliderDesc
            .cone(

                height /
                2,

                radius

            );


    colliderDesc.setDensity(
        CONE_DENSITY
    );


    colliderDesc.setFriction(
        0.86
    );


    colliderDesc.setRestitution(
        0.04
    );


    world.createCollider(

        colliderDesc,

        body

    );


    return registerDynamicObject(

        mesh,

        body,

        'cone'

    );

}


// ============================================================
// CREAR FIGURA ALEATORIA
// ============================================================

function createRandomShape(
    index,
    x,
    z,
    groundY
) {

    const type =
        index %
        4;


    // ========================================================
    // CAJA
    // ========================================================

    if (
        type ===
        0
    ) {

        return createBox({

            x,

            z,

            width:
                randomRange(
                    0.55,
                    0.90
                ),

            height:
                randomRange(
                    0.50,
                    0.85
                ),

            depth:
                randomRange(
                    0.55,
                    0.90
                ),

            baseY:
                groundY

        });

    }


    // ========================================================
    // ESFERA
    // ========================================================

    if (
        type ===
        1
    ) {

        return createSphere({

            x,

            z,

            radius:
                randomRange(
                    0.28,
                    0.43
                ),

            baseY:
                groundY

        });

    }


    // ========================================================
    // CILINDRO
    // ========================================================

    if (
        type ===
        2
    ) {

        return createCylinder({

            x,

            z,

            radius:
                randomRange(
                    0.27,
                    0.38
                ),

            height:
                randomRange(
                    0.70,
                    1.05
                ),

            baseY:
                groundY

        });

    }


    // ========================================================
    // CONO
    // ========================================================

    return createCone({

        x,

        z,

        radius:
            randomRange(
                0.28,
                0.40
            ),

        height:
            randomRange(
                0.65,
                1.0
            ),

        baseY:
            groundY

    });

}


// ============================================================
// CREAR FIGURAS DEL PISO
// ============================================================

function createFloorObjects(
    getGroundHeight,
    options
) {

    const {

        minX,

        maxX,

        minZ,

        maxZ,

        spawn,

        reservedPositions = []

    } = options;


    const margin =
        2.0;


    const safeMinX =
        minX +
        margin;


    const safeMaxX =
        maxX -
        margin;


    const safeMinZ =
        minZ +
        margin;


    const safeMaxZ =
        maxZ -
        margin;


    let created =
        0;


    let attempts =
        0;


    const MAX_ATTEMPTS =
        350;


    while (
        created <
            FLOOR_OBJECT_COUNT &&
        attempts <
            MAX_ATTEMPTS
    ) {

        attempts++;


        const x =
            randomRange(
                safeMinX,
                safeMaxX
            );


        const z =
            randomRange(
                safeMinZ,
                safeMaxZ
            );


        if (
            !isPositionSafe(

                x,
                z,

                spawn,

                reservedPositions

            )
        ) {

            continue;

        }


        const groundY =
            getGroundHeight(
                x,
                z
            );


        if (
            !Number.isFinite(
                groundY
            )
        ) {

            continue;

        }


        const object =
            createRandomShape(

                created,

                x,

                z,

                groundY

            );


        if (
            !object
        ) {

            continue;

        }


        reservePosition(
            x,
            z
        );


        created++;

    }


    console.log(
        `📦 Figuras de piso creadas: ${created}`
    );

}


// ============================================================
// FIGURAS EN PLATAFORMAS
// ============================================================

function createPlatformObjects(
    options
) {

    const {

        columnPlatforms = [],

        spawn,

        reservedPositions = []

    } = options;


    if (
        !Array.isArray(
            columnPlatforms
        ) ||
        columnPlatforms.length ===
            0
    ) {

        return;

    }


    let groups =
        0;


    for (
        const platform of
        columnPlatforms
    ) {

        if (
            groups >=
            PLATFORM_GROUP_COUNT
        ) {

            break;

        }


        if (
            !Number.isFinite(
                platform.x
            ) ||
            !Number.isFinite(
                platform.y
            ) ||
            !Number.isFinite(
                platform.z
            )
        ) {

            continue;

        }


        if (
            platform.width <
                0.75 ||
            platform.depth <
                0.75
        ) {

            continue;

        }


        if (
            !isPositionSafe(

                platform.x,

                platform.z,

                spawn,

                reservedPositions

            )
        ) {

            continue;

        }


        // ====================================================
        // TAMAÑO DE OFFSETS
        // ====================================================

        const offsetX =
            Math.min(

                0.38,

                platform.width *
                0.22

            );


        const offsetZ =
            Math.min(

                0.38,

                platform.depth *
                0.22

            );


        // ====================================================
        // CAJA CENTRAL
        // ====================================================

        createBox({

            x:
                platform.x,

            z:
                platform.z,

            width:
                0.50,

            height:
                0.60,

            depth:
                0.50,

            baseY:
                platform.y

        });


        // ====================================================
        // CILINDRO
        // ====================================================

        createCylinder({

            x:
                platform.x +
                offsetX,

            z:
                platform.z -
                offsetZ,

            radius:
                0.23,

            height:
                0.65,

            baseY:
                platform.y

        });


        // ====================================================
        // CONO
        // ====================================================

        createCone({

            x:
                platform.x -
                offsetX,

            z:
                platform.z +
                offsetZ,

            radius:
                0.24,

            height:
                0.62,

            baseY:
                platform.y

        });


        reservePosition(
            platform.x,
            platform.z
        );


        groups++;

    }


    console.log(
        `🏛️ Grupos sobre plataformas: ${groups}`
    );

}


// ============================================================
// COMPROBAR PISO PLANO PARA TORRE
// ============================================================

function getFlatTowerGround(
    getGroundHeight,
    x,
    z
) {

    const probe =
        0.65;


    const samples = [

        [
            0,
            0
        ],

        [
            probe,
            0
        ],

        [
            -probe,
            0
        ],

        [
            0,
            probe
        ],

        [
            0,
            -probe
        ]

    ];


    const heights =
        [];


    for (
        const [
            dx,
            dz
        ] of samples
    ) {

        const y =
            getGroundHeight(

                x +
                dx,

                z +
                dz

            );


        if (
            !Number.isFinite(
                y
            )
        ) {

            return null;

        }


        heights.push(
            y
        );

    }


    const minHeight =
        Math.min(
            ...heights
        );


    const maxHeight =
        Math.max(
            ...heights
        );


    if (
        maxHeight -
        minHeight >
        0.16
    ) {

        return null;

    }


    return (
        heights.reduce(

            (
                total,
                value
            ) =>
                total +
                value,

            0

        ) /
        heights.length
    );

}


// ============================================================
// BUSCAR POSICIÓN PARA TORRE
// ============================================================

function findTowerPosition(
    getGroundHeight,
    options
) {

    const {

        minX,

        maxX,

        minZ,

        maxZ,

        spawn,

        reservedPositions = []

    } = options;


    const width =
        maxX -
        minX;


    const depth =
        maxZ -
        minZ;


    const candidates = [

        [
            0.60,
            0.63
        ],

        [
            0.38,
            0.68
        ],

        [
            0.68,
            0.38
        ],

        [
            0.32,
            0.35
        ],

        [
            0.72,
            0.72
        ],

        [
            0.50,
            0.78
        ]

    ];


    // ========================================================
    // CANDIDATOS FIJOS
    // ========================================================

    for (
        const [
            rx,
            rz
        ] of candidates
    ) {

        const x =
            minX +
            width *
            rx;


        const z =
            minZ +
            depth *
            rz;


        if (
            !isPositionSafe(

                x,
                z,

                spawn,

                reservedPositions

            )
        ) {

            continue;

        }


        const ground =
            getFlatTowerGround(

                getGroundHeight,

                x,

                z

            );


        if (
            Number.isFinite(
                ground
            )
        ) {

            return {

                x,

                z,

                ground

            };

        }

    }


    // ========================================================
    // BÚSQUEDA ALEATORIA
    // ========================================================

    for (
        let attempt = 0;
        attempt <
        100;
        attempt++
    ) {

        const x =
            randomRange(

                minX +
                2,

                maxX -
                2

            );


        const z =
            randomRange(

                minZ +
                2,

                maxZ -
                2

            );


        if (
            !isPositionSafe(

                x,
                z,

                spawn,

                reservedPositions

            )
        ) {

            continue;

        }


        const ground =
            getFlatTowerGround(

                getGroundHeight,

                x,

                z

            );


        if (
            Number.isFinite(
                ground
            )
        ) {

            return {

                x,

                z,

                ground

            };

        }

    }


    return null;

}


// ============================================================
// CREAR TORRE
// ============================================================

function createTower(
    getGroundHeight,
    options
) {

    const position =
        findTowerPosition(

            getGroundHeight,

            options

        );


    if (
        !position
    ) {

        console.warn(
            '⚠️ No se encontró zona segura para la torre'
        );


        return;

    }


    const width =
        0.55;


    const height =
        0.38;


    const depth =
        0.55;


    const horizontalSpacing =
        0.58;


    const verticalSpacing =
        0.018;


    const rows =
        4;


    // ========================================================
    // 4 + 3 + 2 + 1 = 10 BLOQUES
    // ========================================================

    for (
        let row = 0;
        row <
        rows;
        row++
    ) {

        const count =
            rows -
            row;


        for (
            let column = 0;
            column <
            count;
            column++
        ) {

            const x =
                position.x +
                (
                    column -
                    (
                        count -
                        1
                    ) /
                    2
                ) *
                horizontalSpacing;


            const baseY =
                position.ground +
                row *
                (
                    height +
                    verticalSpacing
                );


            createBox({

                x,

                z:
                    position.z,

                width,

                height,

                depth,

                baseY,

                material:
                    towerMaterial,

                density:
                    TOWER_DENSITY,

                type:
                    'tower'

            });

        }

    }


    reservePosition(

        position.x,

        position.z

    );


    console.log(
        '🧱 Torre física creada'
    );

}


// ============================================================
// LIMITAR VELOCIDAD
// ============================================================
//
// SEGUNDA PROTECCIÓN CONTRA ATRAVESAR PAREDES.
//
// Si una explosión o disparo aplica demasiada fuerza,
// reducimos la velocidad a un máximo razonable.
//
// ============================================================

function limitObjectVelocity(
    item
) {

    if (
        !item ||
        !item.body ||
        item.destroyed
    ) {

        return;

    }


    const velocity =
        item.body.linvel();


    let vx =
        velocity.x;


    let vy =
        velocity.y;


    let vz =
        velocity.z;


    let changed =
        false;


    // ========================================================
    // VELOCIDAD HORIZONTAL
    // ========================================================

    const horizontalSpeed =
        Math.sqrt(

            vx *
            vx +

            vz *
            vz

        );


    if (
        horizontalSpeed >
        MAX_HORIZONTAL_SPEED
    ) {

        const scale =
            MAX_HORIZONTAL_SPEED /
            horizontalSpeed;


        vx *=
            scale;


        vz *=
            scale;


        changed =
            true;

    }


    // ========================================================
    // VELOCIDAD VERTICAL
    // ========================================================

    const clampedY =
        THREE.MathUtils.clamp(

            vy,

            -MAX_VERTICAL_SPEED,

            MAX_VERTICAL_SPEED

        );


    if (
        clampedY !==
        vy
    ) {

        vy =
            clampedY;


        changed =
            true;

    }


    // ========================================================
    // APLICAR
    // ========================================================

    if (
        changed
    ) {

        item.body.setLinvel(

            {

                x:
                    vx,

                y:
                    vy,

                z:
                    vz

            },

            true

        );

    }


    // ========================================================
    // VELOCIDAD ANGULAR
    // ========================================================

    const angular =
        item.body.angvel();


    const angularLength =
        Math.sqrt(

            angular.x *
            angular.x +

            angular.y *
            angular.y +

            angular.z *
            angular.z

        );


    if (
        angularLength >
        MAX_ANGULAR_SPEED
    ) {

        const scale =
            MAX_ANGULAR_SPEED /
            angularLength;


        item.body.setAngvel(

            {

                x:
                    angular.x *
                    scale,

                y:
                    angular.y *
                    scale,

                z:
                    angular.z *
                    scale

            },

            true

        );

    }

}


// ============================================================
// OBJETO FUERA DEL ESCENARIO
// ============================================================

function isObjectOutsideMap(
    item
) {

    const position =
        item.body.translation();


    if (
        position.x <
            mapBounds.minX -
            MAP_RESET_MARGIN
    ) {

        return true;

    }


    if (
        position.x >
            mapBounds.maxX +
            MAP_RESET_MARGIN
    ) {

        return true;

    }


    if (
        position.z <
            mapBounds.minZ -
            MAP_RESET_MARGIN
    ) {

        return true;

    }


    if (
        position.z >
            mapBounds.maxZ +
            MAP_RESET_MARGIN
    ) {

        return true;

    }


    if (
        position.y <
        MIN_SAFE_Y
    ) {

        return true;

    }


    if (
        position.y >
        MAX_SAFE_Y
    ) {

        return true;

    }


    return false;

}


// ============================================================
// BUSCAR ESTADO INICIAL
// ============================================================

function getInitialState(
    item
) {

    return initialStates.find(

        (
            state
        ) =>
            state.item ===
            item

    );

}


// ============================================================
// REINICIAR UNA FIGURA
// ============================================================

function resetSingleObject(
    item,
    resetHealth =
        false
) {

    const state =
        getInitialState(
            item
        );


    if (
        !state
    ) {

        return;

    }


    item.body.setTranslation(

        state.position,

        true

    );


    item.body.setRotation(

        state.rotation,

        true

    );


    item.body.setLinvel(

        {

            x:
                0,

            y:
                0,

            z:
                0

        },

        true

    );


    item.body.setAngvel(

        {

            x:
                0,

            y:
                0,

            z:
                0

        },

        true

    );


    item.mesh.position.set(

        state.position.x,

        state.position.y,

        state.position.z

    );


    item.mesh.quaternion.set(

        state.rotation.x,

        state.rotation.y,

        state.rotation.z,

        state.rotation.w

    );


    if (
        resetHealth
    ) {

        item.health =
            item.maxHealth;


        item.destroyed =
            false;


        item.mesh.visible =
            true;

    }

}


// ============================================================
// ACTUALIZAR FIGURAS
// ============================================================

export function updateDynamicObjects() {

    for (
        const item of
        dynamicObjects
    ) {

        if (
            !item ||
            !item.body ||
            !item.mesh
        ) {

            continue;

        }


        // ====================================================
        // DESTRUIDO
        // ====================================================

        if (
            item.destroyed
        ) {

            continue;

        }


        // ====================================================
        // LIMITAR VELOCIDAD
        // ====================================================

        limitObjectVelocity(
            item
        );


        // ====================================================
        // SALIÓ DEL MAPA
        // ====================================================

        if (
            isObjectOutsideMap(
                item
            )
        ) {

            console.warn(
                `⚠️ ${item.type} salió del mapa. Restaurando posición.`
            );


            resetSingleObject(
                item,
                false
            );


            continue;

        }


        // ====================================================
        // SINCRONIZAR RAPIER -> THREE.JS
        // ====================================================

        const position =
            item.body.translation();


        const rotation =
            item.body.rotation();


        item.mesh.position.set(

            position.x,

            position.y,

            position.z

        );


        item.mesh.quaternion.set(

            rotation.x,

            rotation.y,

            rotation.z,

            rotation.w

        );

    }

}


// ============================================================
// DAÑAR FIGURA
// ============================================================
//
// shooting.js utiliza esta función.
//
// ============================================================

export function damageDynamicObject(
    target,
    damage =
        0
) {

    const item =
        dynamicObjects.find(

            (
                object
            ) =>

                object ===
                    target ||

                object.mesh ===
                    target

        );


    if (
        !item
    ) {

        return {

            health:
                0,

            maxHealth:
                DEFAULT_OBJECT_HEALTH,

            destroyed:
                false,

            valid:
                false

        };

    }


    if (
        item.destroyed
    ) {

        return {

            health:
                0,

            maxHealth:
                item.maxHealth,

            destroyed:
                true,

            valid:
                true

        };

    }


    // ========================================================
    // DAÑO
    // ========================================================

    item.health =
        Math.max(

            0,

            item.health -
            Math.max(
                0,
                damage
            )

        );


    // ========================================================
    // DESTRUIR
    // ========================================================

    if (
        item.health <=
        0
    ) {

        item.health =
            0;


        item.destroyed =
            true;


        item.mesh.visible =
            false;


        // ====================================================
        // DETENER OBJETO
        // ====================================================

        item.body.setLinvel(

            {

                x:
                    0,

                y:
                    0,

                z:
                    0

            },

            true

        );


        item.body.setAngvel(

            {

                x:
                    0,

                y:
                    0,

                z:
                    0

            },

            true

        );


        // ====================================================
        // MOVER CUERPO FUERA DEL ESCENARIO
        // ====================================================

        const position =
            item.body.translation();


        item.body.setTranslation(

            {

                x:
                    position.x,

                y:
                    -100,

                z:
                    position.z

            },

            true

        );

    }


    return {

        health:
            item.health,

        maxHealth:
            item.maxHealth,

        destroyed:
            item.destroyed,

        valid:
            true

    };

}


// ============================================================
// RESET COMPLETO
// ============================================================

export function resetDynamicObjects() {

    for (
        const item of
        dynamicObjects
    ) {

        item.health =
            item.maxHealth;


        item.destroyed =
            false;


        item.mesh.visible =
            true;


        resetSingleObject(

            item,

            true

        );

    }


    console.log(
        '🔄 Objetos físicos reiniciados'
    );

}


// ============================================================
// OBTENER FIGURAS ACTIVAS
// ============================================================
//
// shooting.js y grenades.js usan esta función.
//
// Los objetos destruidos no deben recibir nuevos disparos,
// impulsos o explosiones.
//
// ============================================================

export function getDynamicObjects() {

    return dynamicObjects.filter(

        (
            item
        ) =>
            !item.destroyed &&
            item.mesh.visible

    );

}


// ============================================================
// INICIALIZAR OBJETOS
// ============================================================

export function initDynamicObjects(

    scene,

    getGroundHeight,

    options =
        {}

) {

    const world =
        getPhysicsWorld();


    if (
        !world
    ) {

        console.error(
            '❌ No existe el mundo Rapier.'
        );


        return [];

    }


    // ========================================================
    // LIMPIAR DATOS
    // ========================================================

    dynamicObjects.length =
        0;


    initialStates.length =
        0;


    usedPositions.length =
        0;


    randomSeed =
        123456789;


    // ========================================================
    // LÍMITES
    // ========================================================

    const minX =
        Number.isFinite(
            options.minX
        )
            ?
            options.minX
            :
            -20;


    const maxX =
        Number.isFinite(
            options.maxX
        )
            ?
            options.maxX
            :
            20;


    const minZ =
        Number.isFinite(
            options.minZ
        )
            ?
            options.minZ
            :
            -20;


    const maxZ =
        Number.isFinite(
            options.maxZ
        )
            ?
            options.maxZ
            :
            20;


    mapBounds.minX =
        minX;


    mapBounds.maxX =
        maxX;


    mapBounds.minZ =
        minZ;


    mapBounds.maxZ =
        maxZ;


    // ========================================================
    // OPCIONES NORMALIZADAS
    // ========================================================

    const normalizedOptions = {

        minX,

        maxX,

        minZ,

        maxZ,

        spawn:
            options.spawn ||
            null,

        columnPlatforms:
            Array.isArray(
                options.columnPlatforms
            )
                ?
                options.columnPlatforms
                :
                [],

        reservedPositions:
            Array.isArray(
                options.reservedPositions
            )
                ?
                options.reservedPositions
                :
                []

    };


    // ========================================================
    // GRUPO VISUAL
    // ========================================================

    objectsGroup =
        new THREE.Group();


    objectsGroup.name =
        'DynamicObjects';


    scene.add(
        objectsGroup
    );


    // ========================================================
    // FIGURAS DISTRIBUIDAS POR EL MAPA
    // ========================================================

    createFloorObjects(

        getGroundHeight,

        normalizedOptions

    );


    // ========================================================
    // FIGURAS SOBRE PLATAFORMAS
    // ========================================================

    createPlatformObjects(
        normalizedOptions
    );


    // ========================================================
    // TORRE DERRIBABLE
    // ========================================================

    createTower(

        getGroundHeight,

        normalizedOptions

    );


    console.log(
        '✅ Objetos dinámicos creados:',
        dynamicObjects.length
    );


    console.log(
        '🧱 CCD activado en todas las figuras'
    );


    console.log(
        `🚧 Velocidad horizontal máxima: ${MAX_HORIZONTAL_SPEED}`
    );


    console.log(
        `⬆️ Velocidad vertical máxima: ${MAX_VERTICAL_SPEED}`
    );


    return dynamicObjects;

}