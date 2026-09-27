import * as THREE from 'three';

import RAPIER from '@dimforge/rapier3d-compat';

import {
    getPhysicsWorld
} from './physics.js';


// ============================================================
// OPERATION IMPACT
// OBJECTS.JS
//
// FIGURAS DINÁMICAS
// FIGURAS PESADAS
// OBJETOS DESTRUCTIBLES
// FIGURAS EN PLATAFORMAS
// TORRE DERRIBABLE
// ============================================================


// ============================================================
// VIDA
// ============================================================

const DEFAULT_OBJECT_HEALTH =
    100;


// ============================================================
// CANTIDAD DE FIGURAS
// ============================================================

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
// DENSIDAD
// ============================================================
//
// Más alto = más pesado.
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
// AMORTIGUACIÓN
// ============================================================

const LINEAR_DAMPING =
    0.65;

const ANGULAR_DAMPING =
    0.90;


// ============================================================
// OBJETOS
// ============================================================

const dynamicObjects =
    [];

const initialStates =
    [];

let objectsGroup =
    null;


// ============================================================
// POSICIONES UTILIZADAS
// ============================================================

const usedPositions =
    [];


// ============================================================
// RANDOM DETERMINISTA
// ============================================================
//
// Sirve para que las figuras aparezcan en los mismos lugares
// cada vez que recargues la página.
//
// ============================================================

let randomSeed =
    123456789;


function resetRandomSeed() {

    randomSeed =
        123456789;

}


function seededRandom() {

    randomSeed =
        (
            1664525 *
            randomSeed +
            1013904223
        ) >>> 0;


    return (
        randomSeed /
        4294967296
    );

}


function randomRange(
    min,
    max
) {

    return THREE.MathUtils.lerp(
        min,
        max,
        seededRandom()
    );

}


// ============================================================
// MATERIALES
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
            0.78,

        metalness:
            0.04

    });


// ============================================================
// CREAR BODY PESADO
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
// NORMALIZAR POSICIÓN
// ============================================================

function normalizePosition(
    position
) {

    if (
        !position
    ) {

        return null;

    }


    if (
        !Number.isFinite(
            position.x
        ) ||
        !Number.isFinite(
            position.z
        )
    ) {

        return null;

    }


    return {

        x:
            position.x,

        z:
            position.z

    };

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
// POSICIÓN SEGURA
// ============================================================

function isPositionSafe(
    x,
    z,
    spawn,
    reservedPositions
) {

    // ========================================================
    // SPAWN
    // ========================================================

    const normalizedSpawn =
        normalizePosition(
            spawn
        );


    if (
        normalizedSpawn
    ) {

        const spawnDistance =
            distance2D(
                x,
                z,
                normalizedSpawn.x,
                normalizedSpawn.z
            );


        if (
            spawnDistance <
            SPAWN_SAFE_DISTANCE
        ) {

            return false;

        }

    }


    // ========================================================
    // NÚCLEOS / POSICIONES RESERVADAS
    // ========================================================

    for (
        const reserved of
        reservedPositions
    ) {

        const position =
            normalizePosition(
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

function registerUsedPosition(
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
    type =
        'object'
) {

    const objectData = {

        mesh,

        body,

        type,

        health:
            DEFAULT_OBJECT_HEALTH,

        maxHealth:
            DEFAULT_OBJECT_HEALTH,

        destroyed:
            false

    };


    dynamicObjects.push(
        objectData
    );


    const translation =
        body.translation();


    const rotation =
        body.rotation();


    initialStates.push({

        object:
            objectData,

        body,

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


    return objectData;

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


    // ========================================================
    // THREE
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

            material.clone()

        );


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    const y =
        baseY +
        height / 2 +
        0.04;


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

                width / 2,

                height / 2,

                depth / 2

            );


    colliderDesc.setDensity(
        type ===
            'tower'
            ?
            TOWER_DENSITY
            :
            BOX_DENSITY
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


    const geometry =
        new THREE.SphereGeometry(
            radius,
            24,
            16
        );


    const mesh =
        new THREE.Mesh(

            geometry,

            sphereMaterial.clone()

        );


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    const y =
        baseY +
        radius +
        0.04;


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

            cylinderMaterial.clone()

        );


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    const y =
        baseY +
        height / 2 +
        0.04;


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
                height / 2,
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


    const geometry =
        new THREE.ConeGeometry(
            radius,
            height,
            24
        );


    const mesh =
        new THREE.Mesh(

            geometry,

            coneMaterial.clone()

        );


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    const y =
        baseY +
        height / 2 +
        0.04;


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
                height / 2,
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
// CREAR FIGURA SEGÚN TIPO
// ============================================================

function createObjectByType(
    type,
    x,
    z,
    baseY
) {

    switch (
        type
    ) {

        // ====================================================
        // CAJA
        // ====================================================

        case 'box':

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

                baseY

            });


        // ====================================================
        // ESFERA
        // ====================================================

        case 'sphere':

            return createSphere({

                x,
                z,

                radius:
                    randomRange(
                        0.28,
                        0.43
                    ),

                baseY

            });


        // ====================================================
        // CILINDRO
        // ====================================================

        case 'cylinder':

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

                baseY

            });


        // ====================================================
        // CONO
        // ====================================================

        case 'cone':

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

                baseY

            });


        default:

            return null;

    }

}


// ============================================================
// CREAR FIGURAS DEL PISO
// ============================================================

function createFloorObjects(
    getGroundHeight,
    options
) {

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


    const spawn =
        options.spawn ||
        null;


    const reservedPositions =
        Array.isArray(
            options.reservedPositions
        )
            ?
            options.reservedPositions
            :
            [];


    const margin =
        2.0;


    const usableMinX =
        minX +
        margin;


    const usableMaxX =
        maxX -
        margin;


    const usableMinZ =
        minZ +
        margin;


    const usableMaxZ =
        maxZ -
        margin;


    const types = [
        'box',
        'sphere',
        'cylinder',
        'cone'
    ];


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
                usableMinX,
                usableMaxX
            );


        const z =
            randomRange(
                usableMinZ,
                usableMaxZ
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


        // ====================================================
        // POSICIÓN INVÁLIDA
        // ====================================================

        if (
            !Number.isFinite(
                groundY
            )
        ) {

            continue;

        }


        const type =
            types[
                created %
                types.length
            ];


        const object =
            createObjectByType(
                type,
                x,
                z,
                groundY
            );


        if (
            !object
        ) {

            continue;

        }


        registerUsedPosition(
            x,
            z
        );


        created++;

    }


    console.log(
        `📦 Figuras en piso: ${created}`
    );

}


// ============================================================
// FIGURAS SOBRE PLATAFORMAS
// ============================================================

function createPlatformObjects(
    options
) {

    const platforms =
        Array.isArray(
            options.columnPlatforms
        )
            ?
            options.columnPlatforms
            :
            [];


    const reservedPositions =
        Array.isArray(
            options.reservedPositions
        )
            ?
            options.reservedPositions
            :
            [];


    const spawn =
        options.spawn ||
        null;


    if (
        platforms.length ===
        0
    ) {

        console.log(
            'ℹ️ No hay plataformas disponibles para figuras.'
        );


        return;

    }


    // ========================================================
    // FILTRAR PLATAFORMAS ÚTILES
    // ========================================================

    const validPlatforms =
        platforms.filter(
            (platform) =>

                Number.isFinite(
                    platform.x
                ) &&

                Number.isFinite(
                    platform.y
                ) &&

                Number.isFinite(
                    platform.z
                ) &&

                platform.width >=
                    0.75 &&

                platform.depth >=
                    0.75

        );


    let groupsCreated =
        0;


    for (
        const platform of
        validPlatforms
    ) {

        if (
            groupsCreated >=
            PLATFORM_GROUP_COUNT
        ) {

            break;

        }


        // ====================================================
        // NO PONER FIGURAS CERCA DE NÚCLEOS
        // ====================================================

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


        const offsetX =
            Math.min(
                platform.width *
                0.22,
                0.52
            );


        const offsetZ =
            Math.min(
                platform.depth *
                0.20,
                0.48
            );


        // ====================================================
        // FIGURA CENTRAL
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
        // FIGURA IZQUIERDA
        // ====================================================

        createCylinder({

            x:
                platform.x -
                offsetX,

            z:
                platform.z +
                offsetZ,

            radius:
                0.23,

            height:
                0.65,

            baseY:
                platform.y

        });


        // ====================================================
        // FIGURA DERECHA
        // ====================================================

        createCone({

            x:
                platform.x +
                offsetX,

            z:
                platform.z -
                offsetZ,

            radius:
                0.24,

            height:
                0.62,

            baseY:
                platform.y

        });


        registerUsedPosition(
            platform.x,
            platform.z
        );


        groupsCreated++;

    }


    console.log(
        `🏛️ Grupos sobre plataformas: ${groupsCreated}`
    );

}


// ============================================================
// COMPROBAR ZONA PLANA PARA TORRE
// ============================================================

function getFlatTowerGround(
    x,
    z,
    getGroundHeight
) {

    const center =
        getGroundHeight(
            x,
            z
        );


    if (
        !Number.isFinite(
            center
        )
    ) {

        return null;

    }


    const probes = [

        [
            0.65,
            0
        ],

        [
            -0.65,
            0
        ],

        [
            0,
            0.65
        ],

        [
            0,
            -0.65
        ]

    ];


    for (
        const [
            dx,
            dz
        ] of probes
    ) {

        const height =
            getGroundHeight(
                x +
                dx,
                z +
                dz
            );


        if (
            !Number.isFinite(
                height
            )
        ) {

            return null;

        }


        if (
            Math.abs(
                height -
                center
            ) >
            0.16
        ) {

            return null;

        }

    }


    return center;

}


// ============================================================
// BUSCAR POSICIÓN PARA TORRE
// ============================================================

function findTowerPosition(
    getGroundHeight,
    options
) {

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


    const reservedPositions =
        Array.isArray(
            options.reservedPositions
        )
            ?
            options.reservedPositions
            :
            [];


    const spawn =
        options.spawn ||
        null;


    // ========================================================
    // CANDIDATOS PREDECIBLES
    // ========================================================

    const candidates = [

        [
            0.64,
            0.32
        ],

        [
            0.38,
            0.30
        ],

        [
            0.68,
            0.68
        ],

        [
            0.32,
            0.68
        ],

        [
            0.52,
            0.72
        ],

        [
            0.52,
            0.26
        ]

    ];


    for (
        const [
            rx,
            rz
        ] of candidates
    ) {

        const x =
            THREE.MathUtils.lerp(
                minX,
                maxX,
                rx
            );


        const z =
            THREE.MathUtils.lerp(
                minZ,
                maxZ,
                rz
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
            getFlatTowerGround(
                x,
                z,
                getGroundHeight
            );


        if (
            !Number.isFinite(
                groundY
            )
        ) {

            continue;

        }


        return {
            x,
            z,
            groundY
        };

    }


    // ========================================================
    // BÚSQUEDA ALEATORIA DE RESPALDO
    // ========================================================

    for (
        let attempt = 0;
        attempt < 100;
        attempt++
    ) {

        const x =
            randomRange(
                minX + 2,
                maxX - 2
            );


        const z =
            randomRange(
                minZ + 2,
                maxZ - 2
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
            getFlatTowerGround(
                x,
                z,
                getGroundHeight
            );


        if (
            !Number.isFinite(
                groundY
            )
        ) {

            continue;

        }


        return {
            x,
            z,
            groundY
        };

    }


    return null;

}


// ============================================================
// CREAR TORRE DERRIBABLE
// ============================================================

function createTower(
    getGroundHeight,
    options
) {

    const towerPosition =
        findTowerPosition(
            getGroundHeight,
            options
        );


    if (
        !towerPosition
    ) {

        console.warn(
            '⚠️ No se encontró una zona válida para la torre.'
        );


        return;

    }


    const startX =
        towerPosition.x;


    const startZ =
        towerPosition.z;


    const groundY =
        towerPosition.groundY;


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


    let blocks =
        0;


    // ========================================================
    // TORRE 4 + 3 + 2 + 1
    // ========================================================

    for (
        let row = 0;
        row < rows;
        row++
    ) {

        const count =
            rows -
            row;


        for (
            let column = 0;
            column < count;
            column++
        ) {

            const x =
                startX +
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
                groundY +
                row *
                (
                    height +
                    verticalSpacing
                );


            createBox({

                x,

                z:
                    startZ,

                width,

                height,

                depth,

                baseY,

                material:
                    towerMaterial,

                type:
                    'tower'

            });


            blocks++;

        }

    }


    registerUsedPosition(
        startX,
        startZ
    );


    console.log(
        `🧱 Torre creada: ${blocks} bloques`
    );

}


// ============================================================
// INICIALIZAR OBJETOS
// ============================================================

export function initDynamicObjects(
    scene,
    getGroundHeight,
    options = {}
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


    console.log(
        '📦 Creando objetos dinámicos...'
    );


    // ========================================================
    // REINICIAR DATOS
    // ========================================================

    dynamicObjects.length =
        0;


    initialStates.length =
        0;


    usedPositions.length =
        0;


    resetRandomSeed();


    // ========================================================
    // GRUPO THREE.JS
    // ========================================================

    objectsGroup =
        new THREE.Group();


    objectsGroup.name =
        'DynamicObjects';


    scene.add(
        objectsGroup
    );


    // ========================================================
    // 18 FIGURAS DISTRIBUIDAS EN EL PISO
    // ========================================================

    createFloorObjects(
        getGroundHeight,
        options
    );


    // ========================================================
    // FIGURAS SOBRE PLATAFORMAS
    // ========================================================

    createPlatformObjects(
        options
    );


    // ========================================================
    // TORRE
    // ========================================================

    createTower(
        getGroundHeight,
        options
    );


    console.log(
        '✅ Objetos dinámicos creados:',
        dynamicObjects.length
    );


    console.log(
        '⚖️ Densidades:',
        {
            caja:
                BOX_DENSITY,

            esfera:
                SPHERE_DENSITY,

            cilindro:
                CYLINDER_DENSITY,

            cono:
                CONE_DENSITY,

            torre:
                TOWER_DENSITY
        }
    );


    return dynamicObjects;

}


// ============================================================
// BUSCAR OBJETO
// ============================================================

function findDynamicObject(
    target
) {

    if (
        !target
    ) {

        return null;

    }


    // ========================================================
    // YA ES EL OBJETO
    // ========================================================

    if (
        target.mesh &&
        target.body
    ) {

        return target;

    }


    // ========================================================
    // BUSCAR POR MESH
    // ========================================================

    return (
        dynamicObjects.find(
            (object) =>
                object.mesh ===
                target
        ) ||
        null
    );

}


// ============================================================
// HACER DAÑO
// ============================================================

export function damageDynamicObject(
    target,
    damage =
        0
) {

    const object =
        findDynamicObject(
            target
        );


    // ========================================================
    // NO ENCONTRADO
    // ========================================================

    if (
        !object
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


    // ========================================================
    // YA DESTRUIDO
    // ========================================================

    if (
        object.destroyed
    ) {

        return {

            health:
                0,

            maxHealth:
                object.maxHealth,

            destroyed:
                true,

            valid:
                true

        };

    }


    // ========================================================
    // DAÑO
    // ========================================================

    object.health =
        Math.max(

            0,

            object.health -
            Math.max(
                0,
                damage
            )

        );


    console.log(
        `🎯 ${object.type} · HP ${object.health}/${object.maxHealth}`
    );


    // ========================================================
    // DESTRUIR
    // ========================================================

    if (
        object.health <=
        0
    ) {

        destroyDynamicObject(
            object
        );

    }


    return {

        health:
            object.health,

        maxHealth:
            object.maxHealth,

        destroyed:
            object.destroyed,

        valid:
            true

    };

}


// ============================================================
// DESTRUIR OBJETO
// ============================================================

function destroyDynamicObject(
    object
) {

    if (
        !object ||
        object.destroyed
    ) {

        return;

    }


    object.destroyed =
        true;


    object.health =
        0;


    // ========================================================
    // OCULTAR
    // ========================================================

    object.mesh.visible =
        false;


    // ========================================================
    // DETENER VELOCIDAD
    // ========================================================

    object.body.setLinvel(

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


    object.body.setAngvel(

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


    // ========================================================
    // MOVER CUERPO FUERA DEL MAPA
    // ========================================================

    object.body.setTranslation(

        {
            x:
                0,

            y:
                -100,

            z:
                0
        },

        true

    );


    console.log(
        '💥 FIGURA DESTRUIDA'
    );

}


// ============================================================
// ACTUALIZAR OBJETOS
// ============================================================

export function updateDynamicObjects() {

    for (
        const object of
        dynamicObjects
    ) {

        if (
            object.destroyed
        ) {

            continue;

        }


        const position =
            object.body.translation();


        const rotation =
            object.body.rotation();


        object.mesh.position.set(
            position.x,
            position.y,
            position.z
        );


        object.mesh.quaternion.set(
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w
        );

    }

}


// ============================================================
// REINICIAR OBJETOS
// ============================================================

export function resetDynamicObjects() {

    for (
        const state of
        initialStates
    ) {

        const {
            object,
            body,
            position,
            rotation
        } =
            state;


        // ====================================================
        // VIDA
        // ====================================================

        object.health =
            object.maxHealth;


        object.destroyed =
            false;


        // ====================================================
        // VISIBILIDAD
        // ====================================================

        object.mesh.visible =
            true;


        // ====================================================
        // POSICIÓN
        // ====================================================

        body.setTranslation(

            {
                x:
                    position.x,

                y:
                    position.y,

                z:
                    position.z
            },

            true

        );


        // ====================================================
        // ROTACIÓN
        // ====================================================

        body.setRotation(

            {
                x:
                    rotation.x,

                y:
                    rotation.y,

                z:
                    rotation.z,

                w:
                    rotation.w
            },

            true

        );


        // ====================================================
        // VELOCIDAD LINEAL
        // ====================================================

        body.setLinvel(

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
        // VELOCIDAD ANGULAR
        // ====================================================

        body.setAngvel(

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
        // THREE.JS
        // ====================================================

        object.mesh.position.set(
            position.x,
            position.y,
            position.z
        );


        object.mesh.quaternion.set(
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w
        );

    }


    console.log(
        '🔄 Objetos dinámicos reiniciados'
    );

}


// ============================================================
// OBTENER OBJETOS ACTIVOS
// ============================================================

export function getDynamicObjects() {

    return dynamicObjects.filter(
        (object) =>
            !object.destroyed
    );

}