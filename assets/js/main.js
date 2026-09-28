import * as THREE from 'three';

import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';

import {
    startGame,
    updateGame,
    getGameState,
    getScore,
    getObjectives,
    getRemainingTime,
    GAME_STATES
} from './game.js';

import {
    initPhysics,
    updatePhysics,
    createEnvironmentColliders,
    createCharacterPhysics,
    moveCharacter,
    setCharacterPhysicsPosition
} from './physics.js';

import {
    initDynamicObjects,
    updateDynamicObjects,
    resetDynamicObjects
} from './objects.js';

import {
    initGrenadeSystem,
    canThrowGrenade,
    launchGrenade,
    updateGrenades,
    resetGrenades
} from './grenades.js';

import {
    initObjectives,
    updateObjectives as updateObjectives3D,
    resetObjectives
} from './objectives.js';

import {
    initShootingSystem,
    shoot,
    updateShooting,
    resetShooting,
    setAimingMode,
    startReload
} from './shooting.js';

import {
    attachWeaponToCharacter
} from './weapon.js';

import {
    setupStartButton,
    updateGameStatus,
    updateScore,
    updateObjectives,
    updateTimer,
    resetUI
} from './ui.js';


// ============================================================
// OPERATION IMPACT
// MAIN.JS
// VERSION 1.0.6
// ============================================================


// ============================================================
// RUTAS
// ============================================================

const ENVIRONMENT_PATH =
    './assets/models/environment/warfacemap.glb';

const CHARACTER_PATH =
    './assets/models/character/Swat.glb';

const ANIMATION_PATHS = {

    idle:
        './assets/models/character/Idle.glb',

    walking:
        './assets/models/character/walking.glb',

    run:
        './assets/models/character/run.glb',

    throw:
        './assets/models/character/throw.glb'

};


// ============================================================
// CONFIGURACIÓN GENERAL
// ============================================================

const ENABLE_DYNAMIC_OBJECTS =
    true;

const ENVIRONMENT_TARGET_SIZE =
    45;


// ============================================================
// PERSONAJE
// ============================================================

const CHARACTER_HEIGHT =
    1.35;

const WALK_SPEED =
    2.7;

const RUN_SPEED =
    5.5;

const AIM_WALK_SPEED =
    2.15;

const ROTATION_SPEED =
    12;

const MODEL_FORWARD_OFFSET =
    0;


// ============================================================
// CÁMARA
// ============================================================

const NORMAL_CAMERA_ZOOM =
    1;

const AIM_CAMERA_ZOOM =
    1.48;

const CAMERA_ZOOM_SPEED =
    10;

const NORMAL_TARGET_HEIGHT =
    0.90;

const AIM_TARGET_HEIGHT =
    1.08;

const AIM_SHOULDER_OFFSET =
    0.82;


// ============================================================
// CÁMARA LIBRE
// ============================================================

const MOUSE_SENSITIVITY =
    0.0022;

const CAMERA_MIN_POLAR =
    Math.PI *
    0.05;

const CAMERA_MAX_POLAR =
    Math.PI *
    0.68;


// ============================================================
// RECOIL
// ============================================================

const RECOIL_PITCH =
    0.012;

const RECOIL_YAW =
    0.006;

const MAX_RECOIL_PITCH =
    0.045;

const MAX_RECOIL_YAW =
    0.018;

const RECOIL_RECOVERY =
    13;

const RECOIL_ZOOM =
    0.065;

const MAX_RECOIL_ZOOM =
    0.16;


// ============================================================
// SPAWN
// ============================================================

const FIXED_SPAWN = {

    x:
        -18.605,

    y:
        0.603,

    z:
        -0.321

};


// ============================================================
// GRANADA
// ============================================================

const GRENADE_RELEASE_TIME =
    0.33;


// ============================================================
// TERRENO
// ============================================================

const GROUND_RAY_HEIGHT =
    70;

const COVER_HEIGHT_THRESHOLD =
    0.90;


// ============================================================
// ESCENA
// ============================================================

const scene =
    new THREE.Scene();


scene.background =
    new THREE.Color(
        0x879eaa
    );


scene.fog =
    new THREE.Fog(
        0x879eaa,
        55,
        135
    );


// ============================================================
// CÁMARA
// ============================================================

const camera =
    new THREE.PerspectiveCamera(

        60,

        window.innerWidth /
        window.innerHeight,

        0.1,

        500

    );


camera.position.set(
    4.2,
    3,
    6.2
);


// ============================================================
// RENDERER
// ============================================================

const renderer =
    new THREE.WebGLRenderer({

        antialias:
            true

    });


renderer.setSize(
    window.innerWidth,
    window.innerHeight
);


renderer.setPixelRatio(

    Math.min(
        window.devicePixelRatio,
        2
    )

);


renderer.shadowMap.enabled =
    true;


renderer.shadowMap.type =
    THREE.PCFShadowMap;


renderer.outputColorSpace =
    THREE.SRGBColorSpace;


renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


renderer.toneMappingExposure =
    1.12;


// ============================================================
// CONTENEDOR
// ============================================================

const container =
    document.getElementById(
        'game-container'
    );


container.appendChild(
    renderer.domElement
);


// ============================================================
// ORBIT CONTROLS
// ============================================================

const controls =
    new OrbitControls(
        camera,
        renderer.domElement
    );


controls.enableDamping =
    true;


controls.dampingFactor =
    0.08;


controls.enablePan =
    false;


controls.enableZoom =
    true;


controls.enableRotate =
    false;


controls.minDistance =
    3.3;


controls.maxDistance =
    11;


controls.minPolarAngle =
    CAMERA_MIN_POLAR;


controls.maxPolarAngle =
    CAMERA_MAX_POLAR;


controls.mouseButtons.LEFT =
    null;


controls.mouseButtons.RIGHT =
    null;


controls.mouseButtons.MIDDLE =
    THREE.MOUSE.DOLLY;


controls.target.set(
    0,
    1,
    0
);


controls.update();


// ============================================================
// EVITAR MENÚ DERECHO
// ============================================================

renderer.domElement.addEventListener(

    'contextmenu',

    (event) => {

        event.preventDefault();

    }

);


// ============================================================
// ILUMINACIÓN
// ============================================================

const hemisphereLight =
    new THREE.HemisphereLight(

        0xdbeeff,

        0x45433c,

        2.4

    );


scene.add(
    hemisphereLight
);


const directionalLight =
    new THREE.DirectionalLight(

        0xffefd5,

        3.4

    );


directionalLight.position.set(
    30,
    45,
    20
);


directionalLight.castShadow =
    true;


directionalLight.shadow.mapSize.width =
    2048;


directionalLight.shadow.mapSize.height =
    2048;


directionalLight.shadow.camera.left =
    -55;


directionalLight.shadow.camera.right =
    55;


directionalLight.shadow.camera.top =
    55;


directionalLight.shadow.camera.bottom =
    -55;


directionalLight.shadow.camera.near =
    0.1;


directionalLight.shadow.camera.far =
    170;


directionalLight.shadow.bias =
    -0.0002;


scene.add(
    directionalLight
);


const fillLight =
    new THREE.DirectionalLight(

        0xaac7dd,

        1.1

    );


fillLight.position.set(
    -25,
    18,
    -20
);


scene.add(
    fillLight
);


// ============================================================
// LOADER
// ============================================================

const loader =
    new GLTFLoader();


// ============================================================
// ESCENARIO
// ============================================================

let environment =
    null;


const environmentBounds =
    new THREE.Box3();


const collisionMeshes =
    [];


const environmentMeshes =
    [];


// ============================================================
// PERSONAJE
// ============================================================

const characterRoot =
    new THREE.Group();


const characterVisual =
    new THREE.Group();


characterRoot.add(
    characterVisual
);


scene.add(
    characterRoot
);


let characterModel =
    null;


let mixer =
    null;


let characterLoaded =
    false;


let characterPhysicsCreated =
    false;


let isThrowing =
    false;


let isAiming =
    false;


let activeAction =
    null;


let activeActionName =
    '';


// ============================================================
// MOUSE
// ============================================================

let leftMouseDown =
    false;


let rightMouseDown =
    false;


// ============================================================
// RECOIL
// ============================================================

let recoilPitch =
    0;


let recoilYaw =
    0;


let recoilZoom =
    0;


// ============================================================
// THROW
// ============================================================

let throwElapsed =
    0;


let grenadeReleased =
    false;


// ============================================================
// SPAWN
// ============================================================

const currentSpawn =
    new THREE.Vector3();


// ============================================================
// ANIMACIONES
// ============================================================

const actions = {

    idle:
        null,

    walking:
        null,

    run:
        null,

    throw:
        null

};


// ============================================================
// TECLAS
// ============================================================

const keys = {

    w:
        false,

    a:
        false,

    s:
        false,

    d:
        false,

    shift:
        false

};


// ============================================================
// VECTORES
// ============================================================

const cameraForward =
    new THREE.Vector3();


const cameraRight =
    new THREE.Vector3();


const moveDirection =
    new THREE.Vector3();


const desiredTarget =
    new THREE.Vector3();


const targetDifference =
    new THREE.Vector3();


const aimRight =
    new THREE.Vector3();


const UP =
    new THREE.Vector3(
        0,
        1,
        0
    );


const cameraOrbitOffset =
    new THREE.Vector3();


const cameraOrbitSpherical =
    new THREE.Spherical();


const horizontalPhysicsMovement = {

    x:
        0,

    z:
        0

};


// ============================================================
// RAYCAST TERRENO
// ============================================================

const groundRaycaster =
    new THREE.Raycaster();


const groundRayOrigin =
    new THREE.Vector3();


const groundRayDirection =
    new THREE.Vector3(
        0,
        -1,
        0
    );


const groundNormal =
    new THREE.Vector3();


const normalMatrix =
    new THREE.Matrix3();


// ============================================================
// BOUNDING BOX
// ============================================================

const animatedCharacterBox =
    new THREE.Box3();


const temporaryBox =
    new THREE.Box3();


// ============================================================
// RELOJ
// ============================================================

const clock =
    new THREE.Clock();


// ============================================================
// CARGAR GLTF
// ============================================================

function loadGLTF(
    path
) {

    return new Promise(

        (
            resolve,
            reject
        ) => {

            loader.load(

                path,

                resolve,

                (progress) => {

                    if (
                        progress.total >
                        0
                    ) {

                        const percent =
                            (
                                progress.loaded /
                                progress.total
                            ) *
                            100;


                        console.log(
                            `📦 ${path}: ${percent.toFixed(0)}%`
                        );

                    }

                },

                reject

            );

        }

    );

}


// ============================================================
// CARGAR ESCENARIO
// ============================================================

async function loadEnvironment() {

    console.log(
        '🏙️ Cargando WarfaceMap...'
    );


    const gltf =
        await loadGLTF(
            ENVIRONMENT_PATH
        );


    environment =
        gltf.scene;


    scene.add(
        environment
    );


    collisionMeshes.length =
        0;


    environmentMeshes.length =
        0;


    environment.traverse(

        (child) => {

            if (
                !child.isMesh
            ) {

                return;

            }


            environmentMeshes.push(
                child
            );


            child.castShadow =
                true;


            child.receiveShadow =
                true;


            if (
                child.material
            ) {

                const materials =
                    Array.isArray(
                        child.material
                    )
                        ?
                        child.material
                        :
                        [
                            child.material
                        ];


                materials.forEach(

                    (material) => {

                        if (
                            material.map
                        ) {

                            material.map.colorSpace =
                                THREE.SRGBColorSpace;


                            material.map.needsUpdate =
                                true;

                        }


                        material.needsUpdate =
                            true;

                    }

                );

            }


            const name =
                (
                    child.name ||
                    ''
                )
                    .toLowerCase();


            if (
                name.includes(
                    'collision'
                ) ||
                name.includes(
                    'collider'
                )
            ) {

                collisionMeshes.push(
                    child
                );


                child.visible =
                    false;

            }

        }

    );


    normalizeEnvironment(
        environment
    );


    environment.updateMatrixWorld(
        true
    );


    environmentBounds.setFromObject(
        environment
    );


    const physicsMeshes =
        collisionMeshes.length >
        0
            ?
            collisionMeshes
            :
            environmentMeshes;


    const created =
        createEnvironmentColliders(
            physicsMeshes
        );


    console.log(
        `✅ Colliders creados: ${created}`
    );


    console.log(
        '✅ WarfaceMap cargado'
    );

}


// ============================================================
// NORMALIZAR ESCENARIO
// ============================================================

function normalizeEnvironment(
    model
) {

    model.scale.set(
        1,
        1,
        1
    );


    model.position.set(
        0,
        0,
        0
    );


    model.updateMatrixWorld(
        true
    );


    let box =
        new THREE.Box3()
            .setFromObject(
                model
            );


    const size =
        new THREE.Vector3();


    box.getSize(
        size
    );


    const largestDimension =
        Math.max(
            size.x,
            size.z
        );


    if (
        largestDimension >
        0
    ) {

        const scale =
            ENVIRONMENT_TARGET_SIZE /
            largestDimension;


        model.scale.setScalar(
            scale
        );

    }


    model.updateMatrixWorld(
        true
    );


    box.setFromObject(
        model
    );


    const center =
        new THREE.Vector3();


    box.getCenter(
        center
    );


    model.position.x -=
        center.x;


    model.position.z -=
        center.z;


    model.updateMatrixWorld(
        true
    );


    box.setFromObject(
        model
    );


    model.position.y -=
        box.min.y;


    model.updateMatrixWorld(
        true
    );

}


// ============================================================
// SUPERFICIES
// ============================================================

function getHorizontalSurfaces(
    x,
    z
) {

    if (
        !environment
    ) {

        return [];

    }


    environment.updateMatrixWorld(
        true
    );


    groundRayOrigin.set(
        x,
        GROUND_RAY_HEIGHT,
        z
    );


    groundRaycaster.set(
        groundRayOrigin,
        groundRayDirection
    );


    groundRaycaster.far =
        GROUND_RAY_HEIGHT *
        2;


    const intersections =
        groundRaycaster.intersectObject(
            environment,
            true
        );


    const surfaces =
        [];


    for (
        const intersection of
        intersections
    ) {

        const object =
            intersection.object;


        const name =
            (
                object.name ||
                ''
            )
                .toLowerCase();


        if (
            name.includes(
                'collision'
            ) ||
            name.includes(
                'collider'
            )
        ) {

            continue;

        }


        if (
            intersection.face
        ) {

            normalMatrix.getNormalMatrix(
                object.matrixWorld
            );


            groundNormal
                .copy(
                    intersection.face.normal
                )
                .applyMatrix3(
                    normalMatrix
                )
                .normalize();


            if (
                groundNormal.y <
                0.55
            ) {

                continue;

            }

        }


        const duplicate =
            surfaces.some(

                (surface) =>

                    Math.abs(
                        surface.y -
                        intersection.point.y
                    ) <
                    0.04

            );


        if (
            duplicate
        ) {

            continue;

        }


        surfaces.push({

            x:
                intersection.point.x,

            y:
                intersection.point.y,

            z:
                intersection.point.z,

            object

        });

    }


    surfaces.sort(
        (
            a,
            b
        ) =>
            a.y -
            b.y
    );


    return surfaces;

}


// ============================================================
// ALTURA PISO
// ============================================================

function getGroundHeight(
    x,
    z
) {

    const surfaces =
        getHorizontalSurfaces(
            x,
            z
        );


    if (
        surfaces.length ===
        0
    ) {

        return null;

    }


    const ground =
        surfaces[0];


    for (
        let i = 1;
        i <
        surfaces.length;
        i++
    ) {

        if (
            surfaces[i].y -
            ground.y >
            COVER_HEIGHT_THRESHOLD
        ) {

            return null;

        }

    }


    return ground.y;

}


// ============================================================
// ALTURA SUPERIOR
// ============================================================

function getTopSurfaceHeight(
    x,
    z
) {

    const surfaces =
        getHorizontalSurfaces(
            x,
            z
        );


    if (
        surfaces.length ===
        0
    ) {

        return null;

    }


    return surfaces[
        surfaces.length -
        1
    ].y;

}


// ============================================================
// ESTIMAR PISO
// ============================================================

function estimateFloorHeight() {

    const heights =
        [];


    const columns =
        16;


    const rows =
        16;


    for (
        let row = 0;
        row <= rows;
        row++
    ) {

        for (
            let column = 0;
            column <= columns;
            column++
        ) {

            const x =
                THREE.MathUtils.lerp(

                    environmentBounds.min.x,

                    environmentBounds.max.x,

                    column /
                    columns

                );


            const z =
                THREE.MathUtils.lerp(

                    environmentBounds.min.z,

                    environmentBounds.max.z,

                    row /
                    rows

                );


            const surfaces =
                getHorizontalSurfaces(
                    x,
                    z
                );


            if (
                surfaces.length >
                0
            ) {

                heights.push(
                    surfaces[0].y
                );

            }

        }

    }


    if (
        heights.length ===
        0
    ) {

        return 0;

    }


    heights.sort(
        (
            a,
            b
        ) =>
            a -
            b
    );


    const index =
        Math.floor(
            heights.length *
            0.25
        );


    return heights[
        Math.min(
            index,
            heights.length -
            1
        )
    ];

}


// ============================================================
// PLATAFORMAS
// ============================================================

function collectColumnPlatforms() {

    console.log(
        '🔎 Buscando plataformas elevadas...'
    );


    const floorHeight =
        estimateFloorHeight();


    const STEP =
        0.32;

    const MIN_ELEVATION =
        0.45;

    const MAX_ELEVATION =
        4.2;

    const FLAT_TOLERANCE =
        0.16;


    const minX =
        environmentBounds.min.x +
        0.3;


    const maxX =
        environmentBounds.max.x -
        0.3;


    const minZ =
        environmentBounds.min.z +
        0.3;


    const maxZ =
        environmentBounds.max.z -
        0.3;


    const columns =
        Math.max(

            1,

            Math.ceil(
                (
                    maxX -
                    minX
                ) /
                STEP
            )

        );


    const rows =
        Math.max(

            1,

            Math.ceil(
                (
                    maxZ -
                    minZ
                ) /
                STEP
            )

        );


    const elevatedPoints =
        new Map();


    for (
        let row = 0;
        row <= rows;
        row++
    ) {

        const z =
            THREE.MathUtils.lerp(
                minZ,
                maxZ,
                row /
                rows
            );


        for (
            let column = 0;
            column <= columns;
            column++
        ) {

            const x =
                THREE.MathUtils.lerp(
                    minX,
                    maxX,
                    column /
                    columns
                );


            const surfaces =
                getHorizontalSurfaces(
                    x,
                    z
                );


            if (
                surfaces.length ===
                0
            ) {

                continue;

            }


            const top =
                surfaces[
                    surfaces.length -
                    1
                ];


            const elevation =
                top.y -
                floorHeight;


            if (
                elevation <
                MIN_ELEVATION ||
                elevation >
                MAX_ELEVATION
            ) {

                continue;

            }


            const probe =
                0.16;


            const samples = [

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


            let valid =
                true;


            for (
                const [
                    offsetX,
                    offsetZ
                ] of samples
            ) {

                const nearbyY =
                    getTopSurfaceHeight(

                        x +
                        offsetX,

                        z +
                        offsetZ

                    );


                if (
                    !Number.isFinite(
                        nearbyY
                    ) ||
                    Math.abs(
                        nearbyY -
                        top.y
                    ) >
                    FLAT_TOLERANCE
                ) {

                    valid =
                        false;

                    break;

                }

            }


            if (
                !valid
            ) {

                continue;

            }


            elevatedPoints.set(

                `${column},${row}`,

                {

                    column,

                    row,

                    x,

                    y:
                        top.y,

                    z

                }

            );

        }

    }


    const visited =
        new Set();


    const platforms =
        [];


    const neighbors = [

        [-1, 0],

        [1, 0],

        [0, -1],

        [0, 1],

        [-1, -1],

        [1, -1],

        [-1, 1],

        [1, 1]

    ];


    for (
        const [
            key,
            startPoint
        ] of elevatedPoints
    ) {

        if (
            visited.has(
                key
            )
        ) {

            continue;

        }


        const queue = [
            startPoint
        ];


        const component =
            [];


        visited.add(
            key
        );


        while (
            queue.length >
            0
        ) {

            const point =
                queue.shift();


            component.push(
                point
            );


            for (
                const [
                    dx,
                    dz
                ] of neighbors
            ) {

                const nextColumn =
                    point.column +
                    dx;


                const nextRow =
                    point.row +
                    dz;


                const nextKey =
                    `${nextColumn},${nextRow}`;


                if (
                    visited.has(
                        nextKey
                    )
                ) {

                    continue;

                }


                const neighbor =
                    elevatedPoints.get(
                        nextKey
                    );


                if (
                    !neighbor
                ) {

                    continue;

                }


                if (
                    Math.abs(
                        neighbor.y -
                        point.y
                    ) >
                    0.20
                ) {

                    continue;

                }


                visited.add(
                    nextKey
                );


                queue.push(
                    neighbor
                );

            }

        }


        if (
            component.length <
            3
        ) {

            continue;

        }


        let componentMinX =
            Infinity;


        let componentMaxX =
            -Infinity;


        let componentMinZ =
            Infinity;


        let componentMaxZ =
            -Infinity;


        let averageY =
            0;


        component.forEach(

            (point) => {

                componentMinX =
                    Math.min(
                        componentMinX,
                        point.x
                    );


                componentMaxX =
                    Math.max(
                        componentMaxX,
                        point.x
                    );


                componentMinZ =
                    Math.min(
                        componentMinZ,
                        point.z
                    );


                componentMaxZ =
                    Math.max(
                        componentMaxZ,
                        point.z
                    );


                averageY +=
                    point.y;

            }

        );


        averageY /=
            component.length;


        const width =
            componentMaxX -
            componentMinX +
            STEP;


        const depth =
            componentMaxZ -
            componentMinZ +
            STEP;


        if (
            width >
            4 ||
            depth >
            4
        ) {

            continue;

        }


        if (
            width <
            0.50 ||
            depth <
            0.50
        ) {

            continue;

        }


        platforms.push({

            x:
                (
                    componentMinX +
                    componentMaxX
                ) /
                2,

            y:
                averageY,

            z:
                (
                    componentMinZ +
                    componentMaxZ
                ) /
                2,

            width,

            depth,

            height:
                averageY -
                floorHeight,

            area:
                width *
                depth

        });

    }


    platforms.sort(
        (
            a,
            b
        ) =>
            b.area -
            a.area
    );


    console.log(
        '🏛️ Plataformas detectadas:',
        platforms.length
    );


    return platforms;

}


// ============================================================
// SPAWN
// ============================================================

function placeCharacterAtSpawn() {

    currentSpawn.set(

        FIXED_SPAWN.x,

        FIXED_SPAWN.y,

        FIXED_SPAWN.z

    );


    characterRoot.position.copy(
        currentSpawn
    );

}


// ============================================================
// BOUNDING BOX PERSONAJE
// ============================================================

function computeAnimatedCharacterBox() {

    if (
        !characterModel
    ) {

        return false;

    }


    characterVisual.position.y =
        0;


    characterRoot.updateMatrixWorld(
        true
    );


    animatedCharacterBox.makeEmpty();


    let found =
        false;


    characterModel.traverse(

        (child) => {

            if (
                !child.isSkinnedMesh
            ) {

                return;

            }


            found =
                true;


            child.skeleton?.update();


            child.computeBoundingBox();


            if (
                !child.boundingBox
            ) {

                return;

            }


            temporaryBox
                .copy(
                    child.boundingBox
                )
                .applyMatrix4(
                    child.matrixWorld
                );


            animatedCharacterBox.union(
                temporaryBox
            );

        }

    );


    if (
        !found ||
        animatedCharacterBox.isEmpty()
    ) {

        animatedCharacterBox.setFromObject(
            characterModel
        );

    }


    return (
        !animatedCharacterBox.isEmpty()
    );

}


// ============================================================
// ALINEAR PERSONAJE
// ============================================================

function alignAnimatedCharacterToGround() {

    if (
        !characterModel ||
        !characterLoaded
    ) {

        return;

    }


    if (
        !computeAnimatedCharacterBox()
    ) {

        return;

    }


    const correction =
        characterRoot.position.y -
        animatedCharacterBox.min.y;


    characterVisual.position.y =
        correction;


    characterRoot.updateMatrixWorld(
        true
    );

}


// ============================================================
// CARGAR PERSONAJE
// ============================================================

async function loadCharacter() {

    console.log(
        '🪖 Cargando SWAT...'
    );


    const gltf =
        await loadGLTF(
            CHARACTER_PATH
        );


    characterModel =
        gltf.scene;


    characterVisual.add(
        characterModel
    );


    characterModel.traverse(

        (child) => {

            if (
                child.isMesh
            ) {

                child.castShadow =
                    true;


                child.receiveShadow =
                    true;

            }

        }

    );


    normalizeCharacter(
        characterModel
    );


    placeCharacterAtSpawn();


    createCharacterPhysics(
        characterRoot.position
    );


    characterPhysicsCreated =
        true;


    characterModel.rotation.y =
        MODEL_FORWARD_OFFSET;


    // ========================================================
    // ARMA 3D REAL
    // ========================================================

    attachWeaponToCharacter(
        characterModel
    );


    mixer =
        new THREE.AnimationMixer(
            characterModel
        );


    await loadAnimations();


    mixer.addEventListener(

        'finished',

        (event) => {

            if (
                event.action !==
                actions.throw
            ) {

                return;

            }


            if (
                !grenadeReleased
            ) {

                launchGrenade(
                    characterRoot
                );


                grenadeReleased =
                    true;

            }


            isThrowing =
                false;


            throwElapsed =
                0;


            actions.throw.stop();


            actions.throw.enabled =
                false;


            actions.throw.setEffectiveWeight(
                0
            );


            activeAction =
                null;


            activeActionName =
                '';


            fadeToAction(
                getMovementAnimation(),
                0.12
            );

        }

    );


    resetAllAnimationActions();


    fadeToAction(
        'idle',
        0
    );


    characterLoaded =
        true;


    mixer.update(
        0
    );


    alignAnimatedCharacterToGround();


    resetThirdPersonCamera();


    console.log(
        '✅ SWAT cargado'
    );

}


// ============================================================
// NORMALIZAR PERSONAJE
// ============================================================

function normalizeCharacter(
    model
) {

    model.scale.set(
        1,
        1,
        1
    );


    model.position.set(
        0,
        0,
        0
    );


    model.updateMatrixWorld(
        true
    );


    let box =
        new THREE.Box3()
            .setFromObject(
                model
            );


    const size =
        new THREE.Vector3();


    box.getSize(
        size
    );


    if (
        size.y >
        0
    ) {

        model.scale.setScalar(
            CHARACTER_HEIGHT /
            size.y
        );

    }


    model.updateMatrixWorld(
        true
    );


    box.setFromObject(
        model
    );


    const center =
        new THREE.Vector3();


    box.getCenter(
        center
    );


    model.position.x -=
        center.x;


    model.position.z -=
        center.z;


    model.updateMatrixWorld(
        true
    );


    box.setFromObject(
        model
    );


    model.position.y -=
        box.min.y;


    model.updateMatrixWorld(
        true
    );

}


// ============================================================
// ANIMACIONES
// ============================================================

async function loadAnimations() {

    const [
        idleGLTF,
        walkingGLTF,
        runGLTF,
        throwGLTF
    ] =
        await Promise.all([

            loadGLTF(
                ANIMATION_PATHS.idle
            ),

            loadGLTF(
                ANIMATION_PATHS.walking
            ),

            loadGLTF(
                ANIMATION_PATHS.run
            ),

            loadGLTF(
                ANIMATION_PATHS.throw
            )

        ]);


    actions.idle =
        mixer.clipAction(

            makeClipInPlace(
                getAnimationClip(
                    idleGLTF,
                    'idle'
                )
            )

        );


    actions.walking =
        mixer.clipAction(

            makeClipInPlace(
                getAnimationClip(
                    walkingGLTF,
                    'walking'
                )
            )

        );


    actions.run =
        mixer.clipAction(

            makeClipInPlace(
                getAnimationClip(
                    runGLTF,
                    'run'
                )
            )

        );


    actions.throw =
        mixer.clipAction(

            makeClipInPlace(
                getAnimationClip(
                    throwGLTF,
                    'throw'
                )
            )

        );


    actions.idle.setLoop(
        THREE.LoopRepeat
    );


    actions.walking.setLoop(
        THREE.LoopRepeat
    );


    actions.run.setLoop(
        THREE.LoopRepeat
    );


    actions.throw.setLoop(
        THREE.LoopOnce,
        1
    );


    actions.throw.clampWhenFinished =
        false;

}


// ============================================================
// OBTENER CLIP
// ============================================================

function getAnimationClip(
    gltf,
    name
) {

    if (
        !gltf.animations ||
        gltf.animations.length ===
        0
    ) {

        throw new Error(
            `${name}.glb no contiene animaciones`
        );

    }


    const clip =
        gltf.animations[0]
            .clone();


    clip.name =
        name;


    return clip;

}


// ============================================================
// ROOT MOTION
// ============================================================

function makeClipInPlace(
    originalClip
) {

    const clip =
        originalClip.clone();


    clip.tracks.forEach(

        (track) => {

            const trackName =
                track.name
                    .toLowerCase();


            if (
                !trackName.includes(
                    'hips.position'
                )
            ) {

                return;

            }


            const values =
                track.values;


            if (
                values.length <
                3
            ) {

                return;

            }


            const initialX =
                values[0];


            const initialZ =
                values[2];


            for (
                let i = 0;
                i <
                values.length;
                i += 3
            ) {

                values[i] =
                    initialX;


                values[i + 2] =
                    initialZ;

            }

        }

    );


    clip.resetDuration();


    return clip;

}


// ============================================================
// RESET ANIMACIONES
// ============================================================

function resetAllAnimationActions() {

    Object.values(
        actions
    ).forEach(

        (action) => {

            if (
                !action
            ) {

                return;

            }


            action.stop();


            action.enabled =
                true;


            action.setEffectiveWeight(
                0
            );


            action.setEffectiveTimeScale(
                1
            );

        }

    );


    activeAction =
        null;


    activeActionName =
        '';


    isThrowing =
        false;


    throwElapsed =
        0;


    grenadeReleased =
        false;

}


// ============================================================
// CAMBIAR ANIMACIÓN
// ============================================================

function fadeToAction(
    name,
    duration = 0.2
) {

    const nextAction =
        actions[name];


    if (
        !nextAction
    ) {

        return;

    }


    if (
        activeAction ===
            nextAction &&
        activeActionName ===
            name
    ) {

        return;

    }


    const previousAction =
        activeAction;


    nextAction.enabled =
        true;


    nextAction.reset();


    nextAction.setEffectiveTimeScale(
        1
    );


    nextAction.setEffectiveWeight(
        1
    );


    nextAction.play();


    if (
        previousAction &&
        previousAction !==
            nextAction
    ) {

        previousAction.fadeOut(
            duration
        );


        nextAction.fadeIn(
            duration
        );

    }


    activeAction =
        nextAction;


    activeActionName =
        name;

}


// ============================================================
// APUNTADO
// ============================================================

function setAiming(
    active
) {

    const canAim =
        active &&
        getGameState() ===
            GAME_STATES.PLAYING &&
        !isThrowing;


    isAiming =
        canAim;


    if (
        isAiming
    ) {

        keys.shift =
            false;

    }


    setAimingMode(
        isAiming
    );

}


// ============================================================
// RECOIL
// ============================================================

function triggerRecoil() {

    recoilPitch =
        Math.min(

            MAX_RECOIL_PITCH,

            recoilPitch +
            RECOIL_PITCH

        );


    recoilYaw +=
        THREE.MathUtils.randFloat(

            -RECOIL_YAW,

            RECOIL_YAW

        );


    recoilYaw =
        THREE.MathUtils.clamp(

            recoilYaw,

            -MAX_RECOIL_YAW,

            MAX_RECOIL_YAW

        );


    recoilZoom =
        Math.min(

            MAX_RECOIL_ZOOM,

            recoilZoom +
            RECOIL_ZOOM

        );

}


// ============================================================
// ACTUALIZAR RECOIL
// ============================================================

function updateCameraRecoil(
    delta
) {

    const recovery =
        1 -
        Math.exp(
            -RECOIL_RECOVERY *
            delta
        );


    recoilPitch =
        THREE.MathUtils.lerp(
            recoilPitch,
            0,
            recovery
        );


    recoilYaw =
        THREE.MathUtils.lerp(
            recoilYaw,
            0,
            recovery
        );


    recoilZoom =
        THREE.MathUtils.lerp(
            recoilZoom,
            0,
            recovery
        );


    if (
        !isAiming
    ) {

        return;

    }


    camera.rotateX(
        -recoilPitch
    );


    camera.rotateY(
        recoilYaw
    );

}


// ============================================================
// DISPARAR
// ============================================================

function tryShoot() {

    if (
        getGameState() !==
        GAME_STATES.PLAYING
    ) {

        return;

    }


    if (
        isThrowing ||
        !isAiming
    ) {

        return;

    }


    const fired =
        shoot(
            characterRoot
        );


    if (
        fired
    ) {

        triggerRecoil();

    }

}


// ============================================================
// LANZAR GRANADA
// ============================================================

function playThrow() {

    if (
        !characterLoaded ||
        !actions.throw ||
        isThrowing
    ) {

        return;

    }


    if (
        getGameState() !==
        GAME_STATES.PLAYING
    ) {

        return;

    }


    if (
        !canThrowGrenade()
    ) {

        return;

    }


    leftMouseDown =
        false;


    rightMouseDown =
        false;


    setAiming(
        false
    );


    isThrowing =
        true;


    throwElapsed =
        0;


    grenadeReleased =
        false;


    const previousAction =
        activeAction;


    const throwAction =
        actions.throw;


    throwAction.enabled =
        true;


    throwAction.setLoop(
        THREE.LoopOnce,
        1
    );


    throwAction.clampWhenFinished =
        false;


    throwAction.reset();


    throwAction.setEffectiveTimeScale(
        1
    );


    throwAction.setEffectiveWeight(
        1
    );


    throwAction.play();


    if (
        previousAction &&
        previousAction !==
            throwAction
    ) {

        previousAction.fadeOut(
            0.12
        );


        throwAction.fadeIn(
            0.12
        );

    }


    activeAction =
        throwAction;


    activeActionName =
        'throw';

}


// ============================================================
// MOVIMIENTO
// ============================================================

function isMoving() {

    return (
        keys.w ||
        keys.a ||
        keys.s ||
        keys.d
    );

}


function getMovementAnimation() {

    if (
        !isMoving()
    ) {

        return 'idle';

    }


    if (
        isAiming
    ) {

        return 'walking';

    }


    return keys.shift
        ?
        'run'
        :
        'walking';

}


// ============================================================
// ACTUALIZAR PERSONAJE
// ============================================================

function updateCharacter(
    delta
) {

    if (
        !characterLoaded
    ) {

        return;

    }


    if (
        mixer
    ) {

        mixer.update(
            delta
        );

    }


    if (
        getGameState() !==
        GAME_STATES.PLAYING
    ) {

        setAiming(
            false
        );


        leftMouseDown =
            false;


        rightMouseDown =
            false;


        alignAnimatedCharacterToGround();


        updateThirdPersonCamera(
            delta
        );


        return;

    }


    // ========================================================
    // LANZAMIENTO
    // ========================================================

    if (
        isThrowing
    ) {

        throwElapsed +=
            delta;


        if (
            !grenadeReleased &&
            throwElapsed >=
                GRENADE_RELEASE_TIME
        ) {

            launchGrenade(
                characterRoot
            );


            grenadeReleased =
                true;

        }


        horizontalPhysicsMovement.x =
            0;


        horizontalPhysicsMovement.z =
            0;


        syncCharacterFromPhysics(

            moveCharacter(

                horizontalPhysicsMovement,

                delta

            )

        );


        alignAnimatedCharacterToGround();


        updateThirdPersonCamera(
            delta
        );


        return;

    }


    // ========================================================
    // DIRECCIÓN CÁMARA
    // ========================================================

    moveDirection.set(
        0,
        0,
        0
    );


    camera.getWorldDirection(
        cameraForward
    );


    cameraForward.y =
        0;


    if (
        cameraForward.lengthSq() >
        0
    ) {

        cameraForward.normalize();

    }


    cameraRight.crossVectors(
        cameraForward,
        UP
    );


    if (
        cameraRight.lengthSq() >
        0
    ) {

        cameraRight.normalize();

    }


    // ========================================================
    // WASD
    // ========================================================

    if (
        keys.w
    ) {

        moveDirection.add(
            cameraForward
        );

    }


    if (
        keys.s
    ) {

        moveDirection.sub(
            cameraForward
        );

    }


    if (
        keys.d
    ) {

        moveDirection.add(
            cameraRight
        );

    }


    if (
        keys.a
    ) {

        moveDirection.sub(
            cameraRight
        );

    }


    const hasMovement =
        moveDirection.lengthSq() >
        0;


    if (
        hasMovement
    ) {

        moveDirection.normalize();

    }


    let speed =
        WALK_SPEED;


    if (
        isAiming
    ) {

        speed =
            AIM_WALK_SPEED;

    } else if (
        keys.shift
    ) {

        speed =
            RUN_SPEED;

    }


    horizontalPhysicsMovement.x =
        hasMovement
            ?
            moveDirection.x *
            speed *
            delta
            :
            0;


    horizontalPhysicsMovement.z =
        hasMovement
            ?
            moveDirection.z *
            speed *
            delta
            :
            0;


    const physicsPosition =
        moveCharacter(

            horizontalPhysicsMovement,

            delta

        );


    syncCharacterFromPhysics(
        physicsPosition
    );


    // ========================================================
    // ROTACIÓN
    // ========================================================

    if (
        isAiming
    ) {

        const aimAngle =
            Math.atan2(
                cameraForward.x,
                cameraForward.z
            );


        rotateCharacterTowards(
            aimAngle,
            delta
        );

    } else if (
        hasMovement
    ) {

        const targetAngle =
            Math.atan2(
                moveDirection.x,
                moveDirection.z
            );


        rotateCharacterTowards(
            targetAngle,
            delta
        );

    }


    const nextAnimation =
        getMovementAnimation();


    if (
        activeActionName !==
        nextAnimation
    ) {

        fadeToAction(
            nextAnimation,
            0.18
        );

    }


    alignAnimatedCharacterToGround();


    updateThirdPersonCamera(
        delta
    );

}


// ============================================================
// FÍSICA -> PERSONAJE
// ============================================================

function syncCharacterFromPhysics(
    position
) {

    if (
        !position
    ) {

        return;

    }


    characterRoot.position.set(

        position.x,

        position.y,

        position.z

    );

}


// ============================================================
// ROTAR PERSONAJE
// ============================================================

function rotateCharacterTowards(
    targetAngle,
    delta
) {

    let currentAngle =
        characterRoot.rotation.y;


    let difference =
        targetAngle -
        currentAngle;


    difference =
        Math.atan2(

            Math.sin(
                difference
            ),

            Math.cos(
                difference
            )

        );


    const maxRotation =
        ROTATION_SPEED *
        delta;


    if (
        Math.abs(
            difference
        ) <=
        maxRotation
    ) {

        currentAngle =
            targetAngle;

    } else {

        currentAngle +=
            Math.sign(
                difference
            ) *
            maxRotation;

    }


    characterRoot.rotation.y =
        currentAngle;

}


// ============================================================
// RESET CÁMARA
// ============================================================

function resetThirdPersonCamera() {

    recoilPitch =
        0;


    recoilYaw =
        0;


    recoilZoom =
        0;


    camera.zoom =
        NORMAL_CAMERA_ZOOM;


    camera.updateProjectionMatrix();


    desiredTarget.set(

        characterRoot.position.x,

        characterRoot.position.y +
        NORMAL_TARGET_HEIGHT,

        characterRoot.position.z

    );


    controls.target.copy(
        desiredTarget
    );


    camera.position.set(

        characterRoot.position.x +
        4.2,

        characterRoot.position.y +
        3,

        characterRoot.position.z +
        6.2

    );


    camera.lookAt(
        desiredTarget
    );


    controls.update();

}


// ============================================================
// CÁMARA TPS
// ============================================================

function updateThirdPersonCamera(
    delta
) {

    if (
        !characterLoaded
    ) {

        return;

    }


    camera.getWorldDirection(
        cameraForward
    );


    aimRight.crossVectors(
        cameraForward,
        UP
    );


    if (
        aimRight.lengthSq() >
        0
    ) {

        aimRight.normalize();

    }


    desiredTarget.set(

        characterRoot.position.x,

        characterRoot.position.y +
        (
            isAiming
                ?
                AIM_TARGET_HEIGHT
                :
                NORMAL_TARGET_HEIGHT
        ),

        characterRoot.position.z

    );


    if (
        isAiming
    ) {

        desiredTarget.addScaledVector(
            aimRight,
            AIM_SHOULDER_OFFSET
        );

    }


    targetDifference
        .copy(
            desiredTarget
        )
        .sub(
            controls.target
        );


    const followAmount =
        1 -
        Math.exp(
            -15 *
            delta
        );


    targetDifference.multiplyScalar(
        followAmount
    );


    camera.position.add(
        targetDifference
    );


    controls.target.add(
        targetDifference
    );


    let targetZoom =
        isAiming
            ?
            AIM_CAMERA_ZOOM
            :
            NORMAL_CAMERA_ZOOM;


    if (
        isAiming
    ) {

        targetZoom -=
            recoilZoom;

    }


    const zoomAmount =
        1 -
        Math.exp(
            -CAMERA_ZOOM_SPEED *
            delta
        );


    camera.zoom =
        THREE.MathUtils.lerp(

            camera.zoom,

            targetZoom,

            zoomAmount

        );


    camera.updateProjectionMatrix();

}


// ============================================================
// POINTER LOCK
// ============================================================

function isMouseLocked() {

    return (
        document.pointerLockElement ===
        renderer.domElement
    );

}


// ============================================================
// CAPTURAR MOUSE
// ============================================================

function requestMouseLock() {

    if (
        isMouseLocked()
    ) {

        return;

    }


    if (
        getGameState() !==
        GAME_STATES.PLAYING
    ) {

        return;

    }


    try {

        const request =
            renderer.domElement
                .requestPointerLock();


        if (
            request &&
            typeof request.catch ===
            'function'
        ) {

            request.catch(

                () => {

                    console.warn(
                        '⚠️ No se pudo capturar el mouse.'
                    );

                }

            );

        }

    } catch (
        error
    ) {

        console.warn(
            '⚠️ Pointer Lock no disponible:',
            error
        );

    }

}


// ============================================================
// ROTAR CÁMARA CON MOUSE
// ============================================================

function rotateCameraWithMouse(
    movementX,
    movementY
) {

    if (
        !characterLoaded
    ) {

        return;

    }


    if (
        getGameState() !==
        GAME_STATES.PLAYING
    ) {

        return;

    }


    cameraOrbitOffset
        .copy(
            camera.position
        )
        .sub(
            controls.target
        );


    if (
        cameraOrbitOffset.lengthSq() <=
        0.000001
    ) {

        return;

    }


    cameraOrbitSpherical
        .setFromVector3(
            cameraOrbitOffset
        );


    cameraOrbitSpherical.theta -=
        movementX *
        MOUSE_SENSITIVITY;


    cameraOrbitSpherical.phi -=
        movementY *
        MOUSE_SENSITIVITY;


    cameraOrbitSpherical.phi =
        THREE.MathUtils.clamp(

            cameraOrbitSpherical.phi,

            CAMERA_MIN_POLAR,

            CAMERA_MAX_POLAR

        );


    cameraOrbitSpherical.makeSafe();


    cameraOrbitOffset
        .setFromSpherical(
            cameraOrbitSpherical
        );


    camera.position
        .copy(
            controls.target
        )
        .add(
            cameraOrbitOffset
        );


    camera.lookAt(
        controls.target
    );

}


// ============================================================
// MOUSE MOVE
// ============================================================

document.addEventListener(

    'mousemove',

    (event) => {

        if (
            !isMouseLocked()
        ) {

            return;

        }


        rotateCameraWithMouse(

            event.movementX,

            event.movementY

        );

    }

);


// ============================================================
// POINTER LOCK CHANGE
// ============================================================

document.addEventListener(

    'pointerlockchange',

    () => {

        if (
            isMouseLocked()
        ) {

            console.log(
                '🔒 Mouse capturado'
            );


            return;

        }


        leftMouseDown =
            false;


        rightMouseDown =
            false;


        setAiming(
            false
        );


        console.log(
            '🖱️ Mouse liberado'
        );

    }

);


// ============================================================
// POINTER LOCK ERROR
// ============================================================

document.addEventListener(

    'pointerlockerror',

    () => {

        console.warn(
            '⚠️ Error al activar Pointer Lock'
        );

    }

);


// ============================================================
// TECLADO
// ============================================================

window.addEventListener(

    'keydown',

    (event) => {

        const key =
            event.key
                .toLowerCase();


        // ====================================================
        // R = RECARGAR
        // ====================================================

        if (
            key === 'r' &&
            !event.repeat
        ) {

            if (
                getGameState() ===
                    GAME_STATES.PLAYING &&
                !isThrowing
            ) {

                leftMouseDown =
                    false;


                startReload();

            }


            return;

        }


        // ====================================================
        // F = GRANADA
        // ====================================================

        if (
            key === 'f' &&
            !event.repeat
        ) {

            playThrow();


            return;

        }


        if (
            key === 'w'
        ) {

            keys.w =
                true;

        }


        if (
            key === 'a'
        ) {

            keys.a =
                true;

        }


        if (
            key === 's'
        ) {

            keys.s =
                true;

        }


        if (
            key === 'd'
        ) {

            keys.d =
                true;

        }


        if (
            key === 'shift' &&
            !isAiming
        ) {

            keys.shift =
                true;

        }

    }

);


// ============================================================
// KEYUP
// ============================================================

window.addEventListener(

    'keyup',

    (event) => {

        const key =
            event.key
                .toLowerCase();


        if (
            key === 'w'
        ) {

            keys.w =
                false;

        }


        if (
            key === 'a'
        ) {

            keys.a =
                false;

        }


        if (
            key === 's'
        ) {

            keys.s =
                false;

        }


        if (
            key === 'd'
        ) {

            keys.d =
                false;

        }


        if (
            key === 'shift'
        ) {

            keys.shift =
                false;

        }

    }

);


// ============================================================
// CLICK CANVAS
// ============================================================

renderer.domElement.addEventListener(

    'click',

    () => {

        if (
            getGameState() !==
            GAME_STATES.PLAYING
        ) {

            return;

        }


        if (
            !isMouseLocked()
        ) {

            requestMouseLock();

        }

    }

);


// ============================================================
// MOUSE DOWN
// ============================================================

renderer.domElement.addEventListener(

    'mousedown',

    (event) => {

        if (
            getGameState() !==
            GAME_STATES.PLAYING
        ) {

            return;

        }


        if (
            !isMouseLocked()
        ) {

            event.preventDefault();


            requestMouseLock();


            return;

        }


        // ====================================================
        // DERECHO = APUNTAR
        // ====================================================

        if (
            event.button ===
            2
        ) {

            event.preventDefault();


            rightMouseDown =
                true;


            if (
                isThrowing
            ) {

                return;

            }


            setAiming(
                true
            );


            return;

        }


        // ====================================================
        // IZQUIERDO = DISPARAR
        // ====================================================

        if (
            event.button ===
            0
        ) {

            event.preventDefault();


            leftMouseDown =
                true;


            tryShoot();

        }

    }

);


// ============================================================
// MOUSE UP
// ============================================================

window.addEventListener(

    'mouseup',

    (event) => {

        if (
            event.button ===
            0
        ) {

            leftMouseDown =
                false;

        }


        if (
            event.button ===
            2
        ) {

            rightMouseDown =
                false;


            leftMouseDown =
                false;


            setAiming(
                false
            );

        }

    }

);


// ============================================================
// BLUR
// ============================================================

window.addEventListener(

    'blur',

    () => {

        keys.w =
            false;


        keys.a =
            false;


        keys.s =
            false;


        keys.d =
            false;


        keys.shift =
            false;


        leftMouseDown =
            false;


        rightMouseDown =
            false;


        setAiming(
            false
        );

    }

);


// ============================================================
// HUD
// ============================================================

function updateUI() {

    const objectiveData =
        getObjectives();


    updateGameStatus(
        getGameState()
    );


    updateScore(
        getScore()
    );


    updateObjectives(

        objectiveData.destroyed,

        objectiveData.total

    );


    updateTimer(
        getRemainingTime()
    );

}


// ============================================================
// VERSIÓN
// ============================================================

function updateVersionLabel() {

    const version =
        document.querySelector(
            '.version'
        );


    if (
        version
    ) {

        version.textContent =
            'VERSION 1.0.6 · IMPACTOS Y GRANADAS';

    }

}


// ============================================================
// LOADING
// ============================================================

function setLoadingState(
    loading
) {

    const button =
        document.getElementById(
            'start-button'
        );


    if (
        !button
    ) {

        return;

    }


    button.disabled =
        loading;


    button.textContent =
        loading
            ?
            'CARGANDO...'
            :
            'INICIAR MISIÓN';

}


// ============================================================
// INICIALIZAR
// ============================================================

async function init() {

    console.log(
        '🎮 OPERATION IMPACT v1.0.6'
    );


    updateVersionLabel();


    setLoadingState(
        true
    );


    resetUI();


    try {

        // ====================================================
        // FÍSICA
        // ====================================================

        await initPhysics();


        // ====================================================
        // ESCENARIO
        // ====================================================

        await loadEnvironment();


        // ====================================================
        // PERSONAJE
        // ====================================================

        await loadCharacter();


        // ====================================================
        // GRANADAS
        //
        // IMPORTANTE:
        // ahora también pasamos camera.
        // ====================================================

        initGrenadeSystem(
            scene,
            camera
        );


        // ====================================================
        // DISPAROS
        // ====================================================

        initShootingSystem(

            scene,

            camera,

            environmentMeshes

        );


        // ====================================================
        // PLATAFORMAS
        // ====================================================

        const columnPlatforms =
            collectColumnPlatforms();


        // ====================================================
        // OBJETIVOS
        // ====================================================

        const objectivePositions =
            initObjectives(

                scene,

                getGroundHeight,

                {

                    minX:
                        environmentBounds.min.x,

                    maxX:
                        environmentBounds.max.x,

                    minZ:
                        environmentBounds.min.z,

                    maxZ:
                        environmentBounds.max.z,

                    spawn: {

                        x:
                            currentSpawn.x,

                        z:
                            currentSpawn.z

                    },

                    columnPlatforms

                }

            );


        // ====================================================
        // FIGURAS
        // ====================================================

        if (
            ENABLE_DYNAMIC_OBJECTS
        ) {

            initDynamicObjects(

                scene,

                getGroundHeight,

                {

                    minX:
                        environmentBounds.min.x,

                    maxX:
                        environmentBounds.max.x,

                    minZ:
                        environmentBounds.min.z,

                    maxZ:
                        environmentBounds.max.z,

                    spawn: {

                        x:
                            currentSpawn.x,

                        z:
                            currentSpawn.z

                    },

                    columnPlatforms,

                    reservedPositions:
                        objectivePositions

                }

            );

        }


        // ====================================================
        // START
        // ====================================================

        setupStartButton(

            () => {

                startGame();


                resetGrenades();


                resetShooting();


                resetObjectives();


                leftMouseDown =
                    false;


                rightMouseDown =
                    false;


                setAiming(
                    false
                );


                recoilPitch =
                    0;


                recoilYaw =
                    0;


                recoilZoom =
                    0;


                characterRoot.position.copy(
                    currentSpawn
                );


                characterVisual.position.y =
                    0;


                if (
                    characterPhysicsCreated
                ) {

                    setCharacterPhysicsPosition(
                        currentSpawn
                    );

                }


                characterRoot.rotation.y =
                    0;


                resetAllAnimationActions();


                fadeToAction(
                    'idle',
                    0
                );


                if (
                    mixer
                ) {

                    mixer.update(
                        0
                    );

                }


                alignAnimatedCharacterToGround();


                if (
                    ENABLE_DYNAMIC_OBJECTS
                ) {

                    resetDynamicObjects();

                }


                resetThirdPersonCamera();


                requestMouseLock();


                console.log(
                    '🚀 Misión iniciada'
                );


                console.log(
                    '🖱️ Mouse = Cámara'
                );


                console.log(
                    '🎯 Derecho = Apuntar'
                );


                console.log(
                    '🔫 Izquierdo = Disparar'
                );


                console.log(
                    '💣 F = Granada'
                );


                console.log(
                    '🔄 R = Recargar'
                );

            }

        );


        setLoadingState(
            false
        );


        console.log(
            '✅ OPERATION IMPACT v1.0.6 LISTO'
        );

    } catch (
        error
    ) {

        console.error(
            '❌ Error de inicialización:',
            error
        );


        const button =
            document.getElementById(
                'start-button'
            );


        if (
            button
        ) {

            button.disabled =
                true;


            button.textContent =
                'ERROR DE CARGA';

        }

    }

}


// ============================================================
// LOOP
// ============================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );


    // ========================================================
    // PERSONAJE
    // ========================================================

    updateCharacter(
        delta
    );


    // ========================================================
    // FÍSICA
    // ========================================================

    updatePhysics(
        delta
    );


    // ========================================================
    // FIGURAS
    // ========================================================

    if (
        ENABLE_DYNAMIC_OBJECTS
    ) {

        updateDynamicObjects();

    }


    // ========================================================
    // GRANADAS
    // ========================================================

    updateGrenades(
        delta
    );


    // ========================================================
    // DISPAROS
    // ========================================================

    updateShooting(
        delta
    );


    // ========================================================
    // FUEGO AUTOMÁTICO
    // ========================================================

    if (
        leftMouseDown &&
        rightMouseDown &&
        isAiming &&
        !isThrowing &&
        getGameState() ===
            GAME_STATES.PLAYING
    ) {

        tryShoot();

    }


    // ========================================================
    // OBJETIVOS
    // ========================================================

    updateObjectives3D(

        delta,

        performance.now() /
        1000

    );


    // ========================================================
    // CONTROLS
    // ========================================================

    controls.update();


    // ========================================================
    // RECOIL
    // ========================================================

    updateCameraRecoil(
        delta
    );


    // ========================================================
    // GAME
    // ========================================================

    updateGame(
        delta
    );


    // ========================================================
    // UI
    // ========================================================

    updateUI();


    // ========================================================
    // RENDER
    // ========================================================

    renderer.render(
        scene,
        camera
    );

}


// ============================================================
// RESIZE
// ============================================================

window.addEventListener(

    'resize',

    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(

            window.innerWidth,

            window.innerHeight

        );


        renderer.setPixelRatio(

            Math.min(
                window.devicePixelRatio,
                2
            )

        );

    }

);


// ============================================================
// INICIAR
// ============================================================

init();

animate();