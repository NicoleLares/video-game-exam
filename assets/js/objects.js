import * as THREE from 'three';

import RAPIER from '@dimforge/rapier3d-compat';

import {
    getPhysicsWorld
} from './physics.js';


// ============================================================
// CONFIGURACIÓN
// ============================================================

// Cantidad de objetos distribuidos por el escenario.
const FLOOR_OBJECT_COUNT =
    18;


// ============================================================
// PLATAFORMAS
// ============================================================

const MAX_COLUMN_PLATFORMS =
    6;

const OBJECTS_PER_PLATFORM =
    5;

const COLUMN_MIN_DISTANCE =
    1.5;


// ============================================================
// DISTRIBUCIÓN
// ============================================================

const GRID_COLUMNS =
    24;

const GRID_ROWS =
    34;

const EDGE_MARGIN =
    1.0;

const SPAWN_SAFE_DISTANCE =
    3.0;

const MIN_OBJECT_DISTANCE =
    2.1;

const MAX_LOCAL_HEIGHT_DIFFERENCE =
    0.28;

const CHECK_RADIUS =
    0.50;


// ============================================================
// OBJETOS
// ============================================================

const dynamicObjects =
    [];

const initialStates =
    [];

const usedPositions =
    [];

let objectsGroup =
    null;


// ============================================================
// MATERIALES OBJETOS DEL SUELO
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
            0.2
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
            0.6,

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
            0.05
    });


// ============================================================
// MATERIALES DE PLATAFORMAS
// ============================================================

const columnSphereMaterial =
    new THREE.MeshStandardMaterial({
        color:
            0x00bcd4,

        emissive:
            0x003b44,

        emissiveIntensity:
            1.2,

        roughness:
            0.3,

        metalness:
            0.35
    });


const columnBoxMaterial =
    new THREE.MeshStandardMaterial({
        color:
            0xffc107,

        emissive:
            0x442500,

        emissiveIntensity:
            0.9,

        roughness:
            0.4,

        metalness:
            0.25
    });


const columnCylinderMaterial =
    new THREE.MeshStandardMaterial({
        color:
            0xe53935,

        emissive:
            0x330000,

        emissiveIntensity:
            0.7,

        roughness:
            0.5,

        metalness:
            0.2
    });


const columnConeMaterial =
    new THREE.MeshStandardMaterial({
        color:
            0xff8f00,

        emissive:
            0x331900,

        emissiveIntensity:
            0.5,

        roughness:
            0.55,

        metalness:
            0.1
    });


// ============================================================
// INICIALIZAR
// ============================================================

export function initDynamicObjects(
    scene,
    getGroundHeight,
    options
) {

    const world =
        getPhysicsWorld();


    if (
        !world
    ) {

        console.error(
            '❌ Mundo Rapier no disponible.'
        );

        return;

    }


    if (
        !options
    ) {

        console.error(
            '❌ Faltan opciones del escenario.'
        );

        return;

    }


    // ========================================================
    // GRUPO
    // ========================================================

    objectsGroup =
        new THREE.Group();


    objectsGroup.name =
        'DynamicObjects';


    scene.add(
        objectsGroup
    );


    dynamicObjects.length =
        0;


    initialStates.length =
        0;


    usedPositions.length =
        0;


    // ========================================================
    // LÍMITES
    // ========================================================

    const bounds = {
        minX:
            options.minX +
            EDGE_MARGIN,

        maxX:
            options.maxX -
            EDGE_MARGIN,

        minZ:
            options.minZ +
            EDGE_MARGIN,

        maxZ:
            options.maxZ -
            EDGE_MARGIN
    };


    const spawn =
        options.spawn || {
            x: 0,
            z: 0
        };


    // ========================================================
    // BUSCAR SUELO
    // ========================================================

    const candidates =
        collectWalkablePositions(
            bounds,
            spawn,
            getGroundHeight
        );


    console.log(
        '🗺️ Puntos transitables:',
        candidates.length
    );


    // ========================================================
    // OBJETOS DEL SUELO
    // ========================================================

    const selected =
        selectDistributedPositions(
            candidates,
            spawn,
            FLOOR_OBJECT_COUNT
        );


    const objectTypes = [
        'box',
        'cone',
        'sphere',
        'cylinder',
        'box',
        'sphere',
        'cone',
        'cylinder'
    ];


    selected.forEach(
        (
            position,
            index
        ) => {

            const type =
                objectTypes[
                    index %
                    objectTypes.length
                ];


            createObjectByType(
                type,
                position
            );


            usedPositions.push({
                x:
                    position.x,

                z:
                    position.z
            });

        }
    );


    // ========================================================
    // GRUPOS SOBRE PLATAFORMAS
    // ========================================================

    createObjectsOnColumns(
        options.columnPlatforms ||
        [],
        spawn
    );


    // ========================================================
    // TORRE DERRIBABLE
    // ========================================================

    createTowerFromCandidates(
        candidates,
        spawn,
        getGroundHeight
    );


    console.log(
        '✅ Total de objetos físicos:',
        dynamicObjects.length
    );

}


// ============================================================
// BUSCAR PUNTOS TRANSITABLES
// ============================================================

function collectWalkablePositions(
    bounds,
    spawn,
    getGroundHeight
) {

    const result =
        [];


    for (
        let row = 0;
        row <= GRID_ROWS;
        row++
    ) {

        const z =
            THREE.MathUtils.lerp(
                bounds.minZ,
                bounds.maxZ,
                row /
                GRID_ROWS
            );


        for (
            let column = 0;
            column <= GRID_COLUMNS;
            column++
        ) {

            const x =
                THREE.MathUtils.lerp(
                    bounds.minX,
                    bounds.maxX,
                    column /
                    GRID_COLUMNS
                );


            const spawnDistance =
                Math.hypot(
                    x -
                        spawn.x,
                    z -
                        spawn.z
                );


            if (
                spawnDistance <
                SPAWN_SAFE_DISTANCE
            ) {

                continue;

            }


            const position =
                validateWalkablePoint(
                    x,
                    z,
                    getGroundHeight
                );


            if (
                position
            ) {

                result.push(
                    position
                );

            }

        }

    }


    return result;

}


// ============================================================
// VALIDAR PUNTO
// ============================================================

function validateWalkablePoint(
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


    const samples = [
        [
            CHECK_RADIUS,
            0
        ],
        [
            -CHECK_RADIUS,
            0
        ],
        [
            0,
            CHECK_RADIUS
        ],
        [
            0,
            -CHECK_RADIUS
        ]
    ];


    for (
        const [
            offsetX,
            offsetZ
        ]
        of samples
    ) {

        const y =
            getGroundHeight(
                x +
                    offsetX,
                z +
                    offsetZ
            );


        if (
            !Number.isFinite(
                y
            )
        ) {

            return null;

        }


        if (
            Math.abs(
                y -
                center
            ) >
            MAX_LOCAL_HEIGHT_DIFFERENCE
        ) {

            return null;

        }

    }


    return {
        x,
        y:
            center,
        z
    };

}


// ============================================================
// DISTRIBUIR POSICIONES
// ============================================================

function selectDistributedPositions(
    candidates,
    spawn,
    count
) {

    if (
        candidates.length ===
        0
    ) {

        return [];

    }


    const selected =
        [];


    const available =
        [
            ...candidates
        ];


    // ========================================================
    // PRIMER PUNTO LEJOS DEL SPAWN
    // ========================================================

    available.sort(
        (
            a,
            b
        ) => {

            const distanceA =
                Math.hypot(
                    a.x -
                        spawn.x,
                    a.z -
                        spawn.z
                );


            const distanceB =
                Math.hypot(
                    b.x -
                        spawn.x,
                    b.z -
                        spawn.z
                );


            return (
                distanceB -
                distanceA
            );

        }
    );


    selected.push(
        available.shift()
    );


    // ========================================================
    // SIGUIENTES
    // ========================================================

    while (
        selected.length <
            count &&
        available.length >
            0
    ) {

        let bestIndex =
            -1;


        let bestScore =
            -Infinity;


        for (
            let i = 0;
            i <
            available.length;
            i++
        ) {

            const candidate =
                available[i];


            let nearest =
                Infinity;


            for (
                const chosen
                of selected
            ) {

                const distance =
                    Math.hypot(
                        candidate.x -
                            chosen.x,
                        candidate.z -
                            chosen.z
                    );


                nearest =
                    Math.min(
                        nearest,
                        distance
                    );

            }


            if (
                nearest <
                MIN_OBJECT_DISTANCE
            ) {

                continue;

            }


            const spawnDistance =
                Math.hypot(
                    candidate.x -
                        spawn.x,
                    candidate.z -
                        spawn.z
                );


            const score =
                nearest +
                spawnDistance *
                0.08;


            if (
                score >
                bestScore
            ) {

                bestScore =
                    score;


                bestIndex =
                    i;

            }

        }


        if (
            bestIndex ===
            -1
        ) {

            break;

        }


        selected.push(
            available[
                bestIndex
            ]
        );


        available.splice(
            bestIndex,
            1
        );

    }


    return selected;

}


// ============================================================
// OBJETOS EN PLATAFORMAS
// ============================================================

function createObjectsOnColumns(
    platforms,
    spawn
) {

    if (
        platforms.length ===
        0
    ) {

        console.warn(
            '⚠️ No se detectaron plataformas.'
        );

        return;

    }


    // ========================================================
    // FILTRAR
    // ========================================================

    const available =
        platforms.filter(
            (platform) => {

                const distance =
                    Math.hypot(
                        platform.x -
                            spawn.x,
                        platform.z -
                            spawn.z
                    );


                if (
                    distance <
                    2.5
                ) {

                    return false;

                }


                if (
                    platform.width <
                        0.55 ||
                    platform.depth <
                        0.55
                ) {

                    return false;

                }


                return true;

            }
        );


    // ========================================================
    // PRIORIZAR PLATAFORMAS MEDIANAS
    // ========================================================

    available.sort(
        (
            a,
            b
        ) => {

            const targetArea =
                1.5;


            const areaA =
                a.area ??
                (
                    a.width *
                    a.depth
                );


            const areaB =
                b.area ??
                (
                    b.width *
                    b.depth
                );


            return (
                Math.abs(
                    areaA -
                    targetArea
                ) -
                Math.abs(
                    areaB -
                    targetArea
                )
            );

        }
    );


    // ========================================================
    // SELECCIÓN
    // ========================================================

    const selected =
        [];


    for (
        const platform
        of available
    ) {

        const tooClose =
            selected.some(
                (other) =>

                    Math.hypot(
                        platform.x -
                            other.x,
                        platform.z -
                            other.z
                    ) <
                    COLUMN_MIN_DISTANCE
            );


        if (
            tooClose
        ) {

            continue;

        }


        selected.push(
            platform
        );


        if (
            selected.length >=
            MAX_COLUMN_PLATFORMS
        ) {

            break;

        }

    }


    // ========================================================
    // CREAR GRUPOS
    // ========================================================

    selected.forEach(
        (
            platform,
            index
        ) => {

            createColumnCluster(
                platform,
                index
            );


            usedPositions.push({
                x:
                    platform.x,

                z:
                    platform.z
            });

        }
    );


    console.log(
        '🏛️ Plataformas utilizadas:',
        selected.length
    );

}


// ============================================================
// GRUPO DE OBJETOS GRANDES
// ============================================================

function createColumnCluster(
    platform,
    groupIndex
) {

    console.log(
        `📦 Creando grupo grande ${groupIndex + 1}`,
        platform
    );


    // ========================================================
    // ÁREA SEGURA
    // ========================================================

    const safeWidth =
        Math.max(
            0.55,
            platform.width *
            0.68
        );


    const safeDepth =
        Math.max(
            0.55,
            platform.depth *
            0.68
        );


    // ========================================================
    // SEPARACIÓN MAYOR
    // ========================================================

    const offsetX =
        Math.min(
            safeWidth *
            0.42,
            0.58
        );


    const offsetZ =
        Math.min(
            safeDepth *
            0.42,
            0.58
        );


    // ========================================================
    // POSICIONES
    // ========================================================

    const positions = [
        {
            x:
                platform.x -
                offsetX,

            z:
                platform.z -
                offsetZ
        },

        {
            x:
                platform.x +
                offsetX,

            z:
                platform.z -
                offsetZ
        },

        {
            x:
                platform.x,

            z:
                platform.z
        },

        {
            x:
                platform.x -
                offsetX,

            z:
                platform.z +
                offsetZ
        },

        {
            x:
                platform.x +
                offsetX,

            z:
                platform.z +
                offsetZ
        }
    ];


    // ========================================================
    // TIPOS
    // ========================================================

    const layouts = [
        [
            'box',
            'sphere',
            'cylinder',
            'cone',
            'box'
        ],

        [
            'sphere',
            'box',
            'cone',
            'cylinder',
            'sphere'
        ],

        [
            'cylinder',
            'cone',
            'box',
            'sphere',
            'box'
        ],

        [
            'cone',
            'sphere',
            'cylinder',
            'box',
            'sphere'
        ]
    ];


    const types =
        layouts[
            groupIndex %
            layouts.length
        ];


    // ========================================================
    // CANTIDAD SEGÚN TAMAÑO
    // ========================================================

    const area =
        platform.width *
        platform.depth;


    let amount =
        OBJECTS_PER_PLATFORM;


    if (
        area <
        0.85
    ) {

        amount =
            2;

    } else if (
        area <
        1.20
    ) {

        amount =
            3;

    } else if (
        area <
        1.55
    ) {

        amount =
            4;

    }


    // ========================================================
    // CREAR
    // ========================================================

    for (
        let i = 0;
        i <
        amount;
        i++
    ) {

        createPlatformObject(
            types[i],
            positions[i].x,
            platform.y,
            positions[i].z
        );

    }


    console.log(
        `✅ ${amount} objetos GRANDES sobre plataforma ${groupIndex + 1}`
    );

}


// ============================================================
// OBJETOS GRANDES SOBRE PLATAFORMAS
// ============================================================

function createPlatformObject(
    type,
    x,
    groundY,
    z
) {

    switch (
        type
    ) {

        // ====================================================
        // CAJA
        // ====================================================

        case 'box':

            createBox({
                x,
                z,

                width:
                    0.65,

                height:
                    0.65,

                depth:
                    0.65,

                groundY,

                material:
                    columnBoxMaterial
            });

            break;


        // ====================================================
        // ESFERA
        // ====================================================

        case 'sphere':

            createSphere({
                x,
                z,

                radius:
                    0.38,

                groundY,

                material:
                    columnSphereMaterial
            });

            break;


        // ====================================================
        // BARRIL
        // ====================================================

        case 'cylinder':

            createCylinder({
                x,
                z,

                radius:
                    0.31,

                height:
                    0.75,

                groundY,

                material:
                    columnCylinderMaterial
            });

            break;


        // ====================================================
        // CONO
        // ====================================================

        case 'cone':

            createCone({
                x,
                z,

                radius:
                    0.32,

                height:
                    0.72,

                groundY,

                material:
                    columnConeMaterial
            });

            break;

    }

}


// ============================================================
// OBJETOS GRANDES DEL PISO
// ============================================================

function createObjectByType(
    type,
    position
) {

    switch (
        type
    ) {

        // ====================================================
        // CAJA
        // ====================================================

        case 'box':

            createBox({
                x:
                    position.x,

                z:
                    position.z,

                width:
                    0.85,

                height:
                    0.85,

                depth:
                    0.85,

                groundY:
                    position.y
            });

            break;


        // ====================================================
        // ESFERA
        // ====================================================

        case 'sphere':

            createSphere({
                x:
                    position.x,

                z:
                    position.z,

                radius:
                    0.46,

                groundY:
                    position.y
            });

            break;


        // ====================================================
        // BARRIL
        // ====================================================

        case 'cylinder':

            createCylinder({
                x:
                    position.x,

                z:
                    position.z,

                radius:
                    0.40,

                height:
                    1.05,

                groundY:
                    position.y
            });

            break;


        // ====================================================
        // CONO
        // ====================================================

        case 'cone':

            createCone({
                x:
                    position.x,

                z:
                    position.z,

                radius:
                    0.42,

                height:
                    1.00,

                groundY:
                    position.y
            });

            break;

    }

}


// ============================================================
// REGISTRAR OBJETO
// ============================================================

function registerDynamicObject(
    mesh,
    body
) {

    dynamicObjects.push({
        mesh,
        body
    });


    const translation =
        body.translation();


    const rotation =
        body.rotation();


    initialStates.push({
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

}


// ============================================================
// CAJA
// ============================================================

function createBox({
    x,
    z,
    width,
    height,
    depth,
    groundY,
    material = boxMaterial
}) {

    const world =
        getPhysicsWorld();


    const y =
        groundY +
        height /
        2 +
        0.025;


    const mesh =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),

            material

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
        world.createRigidBody(

            RAPIER
                .RigidBodyDesc
                .dynamic()
                .setTranslation(
                    x,
                    y,
                    z
                )

        );


    const collider =
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


    collider.setDensity(
        1.2
    );


    collider.setFriction(
        0.8
    );


    collider.setRestitution(
        0.05
    );


    world.createCollider(
        collider,
        body
    );


    registerDynamicObject(
        mesh,
        body
    );

}


// ============================================================
// ESFERA
// ============================================================

function createSphere({
    x,
    z,
    radius,
    groundY,
    material = sphereMaterial
}) {

    const world =
        getPhysicsWorld();


    const y =
        groundY +
        radius +
        0.025;


    const mesh =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                radius,
                24,
                16
            ),

            material

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
        world.createRigidBody(

            RAPIER
                .RigidBodyDesc
                .dynamic()
                .setTranslation(
                    x,
                    y,
                    z
                )

        );


    const collider =
        RAPIER
            .ColliderDesc
            .ball(
                radius
            );


    collider.setDensity(
        0.8
    );


    collider.setFriction(
        0.45
    );


    collider.setRestitution(
        0.50
    );


    world.createCollider(
        collider,
        body
    );


    registerDynamicObject(
        mesh,
        body
    );

}


// ============================================================
// CILINDRO
// ============================================================

function createCylinder({
    x,
    z,
    radius,
    height,
    groundY,
    material = cylinderMaterial
}) {

    const world =
        getPhysicsWorld();


    const y =
        groundY +
        height /
        2 +
        0.025;


    const mesh =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                radius,
                radius,
                height,
                24
            ),

            material

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
        world.createRigidBody(

            RAPIER
                .RigidBodyDesc
                .dynamic()
                .setTranslation(
                    x,
                    y,
                    z
                )

        );


    const collider =
        RAPIER
            .ColliderDesc
            .cylinder(
                height /
                    2,
                radius
            );


    collider.setDensity(
        1.4
    );


    collider.setFriction(
        0.7
    );


    collider.setRestitution(
        0.12
    );


    world.createCollider(
        collider,
        body
    );


    registerDynamicObject(
        mesh,
        body
    );

}


// ============================================================
// CONO
// ============================================================

function createCone({
    x,
    z,
    radius,
    height,
    groundY,
    material = coneMaterial
}) {

    const world =
        getPhysicsWorld();


    const y =
        groundY +
        height /
        2 +
        0.025;


    const mesh =
        new THREE.Mesh(

            new THREE.ConeGeometry(
                radius,
                height,
                24
            ),

            material

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
        world.createRigidBody(

            RAPIER
                .RigidBodyDesc
                .dynamic()
                .setTranslation(
                    x,
                    y,
                    z
                )

        );


    const collider =
        RAPIER
            .ColliderDesc
            .cone(
                height /
                    2,
                radius
            );


    collider.setDensity(
        0.8
    );


    collider.setFriction(
        0.75
    );


    collider.setRestitution(
        0.1
    );


    world.createCollider(
        collider,
        body
    );


    registerDynamicObject(
        mesh,
        body
    );

}


// ============================================================
// TORRE DERRIBABLE
// ============================================================

function createTowerFromCandidates(
    candidates,
    spawn,
    getGroundHeight
) {

    let best =
        null;


    let bestScore =
        -Infinity;


    for (
        const candidate
        of candidates
    ) {

        const spawnDistance =
            Math.hypot(
                candidate.x -
                    spawn.x,
                candidate.z -
                    spawn.z
            );


        if (
            spawnDistance <
            5
        ) {

            continue;

        }


        const objectDistance =
            getNearestUsedDistance(
                candidate
            );


        if (
            objectDistance <
            3.0
        ) {

            continue;

        }


        if (
            !validateTowerArea(
                candidate.x,
                candidate.z,
                getGroundHeight
            )
        ) {

            continue;

        }


        const score =
            spawnDistance +
            objectDistance;


        if (
            score >
            bestScore
        ) {

            bestScore =
                score;


            best =
                candidate;

        }

    }


    if (
        !best
    ) {

        console.warn(
            '⚠️ No se encontró lugar para la torre.'
        );

        return;

    }


    createTower(
        best.x,
        best.y,
        best.z
    );

}


// ============================================================
// VALIDAR TORRE
// ============================================================

function validateTowerArea(
    x,
    z,
    getGroundHeight
) {

    const radius =
        1.0;


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

        return false;

    }


    const samples = [
        [radius, 0],
        [-radius, 0],
        [0, radius],
        [0, -radius],
        [radius, radius],
        [-radius, radius],
        [radius, -radius],
        [-radius, -radius]
    ];


    for (
        const [
            offsetX,
            offsetZ
        ]
        of samples
    ) {

        const y =
            getGroundHeight(
                x +
                    offsetX,
                z +
                    offsetZ
            );


        if (
            !Number.isFinite(
                y
            )
        ) {

            return false;

        }


        if (
            Math.abs(
                y -
                center
            ) >
            0.20
        ) {

            return false;

        }

    }


    return true;

}


// ============================================================
// DISTANCIA
// ============================================================

function getNearestUsedDistance(
    candidate
) {

    if (
        usedPositions.length ===
        0
    ) {

        return Infinity;

    }


    let nearest =
        Infinity;


    for (
        const position
        of usedPositions
    ) {

        const distance =
            Math.hypot(
                candidate.x -
                    position.x,
                candidate.z -
                    position.z
            );


        nearest =
            Math.min(
                nearest,
                distance
            );

    }


    return nearest;

}


// ============================================================
// CREAR TORRE
// ============================================================

function createTower(
    startX,
    groundY,
    startZ
) {

    // Bloques también un poco más grandes.
    const width =
        0.62;

    const height =
        0.44;

    const depth =
        0.58;

    const rows =
        4;


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
                startX +
                (
                    column -
                    (
                        count -
                        1
                    ) /
                    2
                ) *
                0.68;


            const y =
                groundY +
                height /
                2 +
                row *
                (
                    height +
                    0.02
                );


            createTowerBlock({
                x,
                y,
                z:
                    startZ,
                width,
                height,
                depth
            });

        }

    }

}


// ============================================================
// BLOQUE DE TORRE
// ============================================================

function createTowerBlock({
    x,
    y,
    z,
    width,
    height,
    depth
}) {

    const world =
        getPhysicsWorld();


    const mesh =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),

            towerMaterial

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
        world.createRigidBody(

            RAPIER
                .RigidBodyDesc
                .dynamic()
                .setTranslation(
                    x,
                    y,
                    z
                )

        );


    const collider =
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


    collider.setDensity(
        1.1
    );


    collider.setFriction(
        0.85
    );


    collider.setRestitution(
        0.02
    );


    world.createCollider(
        collider,
        body
    );


    registerDynamicObject(
        mesh,
        body
    );

}


// ============================================================
// ACTUALIZAR OBJETOS
// ============================================================

export function updateDynamicObjects() {

    dynamicObjects.forEach(
        ({
            mesh,
            body
        }) => {

            const position =
                body.translation();


            const rotation =
                body.rotation();


            mesh.position.set(
                position.x,
                position.y,
                position.z
            );


            mesh.quaternion.set(
                rotation.x,
                rotation.y,
                rotation.z,
                rotation.w
            );

        }
    );

}


// ============================================================
// REINICIAR OBJETOS
// ============================================================

export function resetDynamicObjects() {

    initialStates.forEach(
        ({
            body,
            position,
            rotation
        }) => {

            body.setTranslation(
                position,
                true
            );


            body.setRotation(
                rotation,
                true
            );


            body.setLinvel(
                {
                    x: 0,
                    y: 0,
                    z: 0
                },
                true
            );


            body.setAngvel(
                {
                    x: 0,
                    y: 0,
                    z: 0
                },
                true
            );

        }
    );


    console.log(
        '🔄 Objetos reiniciados'
    );

}


// ============================================================
// OBTENER OBJETOS
// ============================================================

export function getDynamicObjects() {

    return dynamicObjects;

}