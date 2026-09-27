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
    setupStartButton,
    updateGameStatus,
    updateScore,
    updateObjectives,
    updateTimer,
    resetUI
} from './ui.js';


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
// CONFIGURACIÓN
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

const ROTATION_SPEED =
    12;

const MODEL_FORWARD_OFFSET =
    0;


// ============================================================
// SPAWN
// ============================================================

const FIXED_SPAWN = {
    x: -18.605,
    y: 0.603,
    z: -0.321
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


// Three 0.186 recomienda PCFShadowMap.
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
// CONTROLES
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


controls.minDistance =
    3.5;


controls.maxDistance =
    12;


controls.minPolarAngle =
    Math.PI *
    0.12;


controls.maxPolarAngle =
    Math.PI *
    0.48;


controls.target.set(
    0,
    1,
    0
);


controls.update();


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


let activeAction =
    null;


let activeActionName =
    '';


// ============================================================
// THROW
// ============================================================

let throwElapsed =
    0;


let grenadeReleased =
    false;


// ============================================================
// SPAWN ACTUAL
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


const UP =
    new THREE.Vector3(
        0,
        1,
        0
    );


const horizontalPhysicsMovement = {
    x: 0,
    z: 0
};


// ============================================================
// RAYCAST
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
// ESCENARIO
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
// NORMALIZAR MAPA
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
// PISO
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
// SUPERFICIE SUPERIOR
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
// PISO GENERAL
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


    return heights[
        Math.floor(
            heights.length *
            0.25
        )
    ];

}


// ============================================================
// DETECTAR PLATAFORMAS
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
                [probe, 0],
                [-probe, 0],
                [0, probe],
                [0, -probe]
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
                        x + offsetX,
                        z + offsetZ
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

                const nextKey =
                    `${
                        point.column +
                        dx
                    },${
                        point.row +
                        dz
                    }`;


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


    console.log(
        '📍 Spawn fijo:',
        currentSpawn
    );

}


// ============================================================
// BOUNDING BOX
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


            if (
                child.skeleton
            ) {

                child.skeleton.update();

            }


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


    return !animatedCharacterBox.isEmpty();

}


// ============================================================
// ALINEAR
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
// CLIP
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
// THROW
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


    throwAction.setEffectiveWeight(
        1
    );


    throwAction.setEffectiveTimeScale(
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

        alignAnimatedCharacterToGround();

        return;

    }


    // ========================================================
    // THROW
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


        updateThirdPersonCamera();


        return;

    }


    // ========================================================
    // DIRECCIÓN DE CÁMARA
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


    const speed =
        keys.shift
            ?
            RUN_SPEED
            :
            WALK_SPEED;


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


    if (
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


    updateThirdPersonCamera();

}


// ============================================================
// SINCRONIZAR
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
// ROTACIÓN
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
// CÁMARA
// ============================================================

function resetThirdPersonCamera() {

    desiredTarget.set(
        characterRoot.position.x,
        characterRoot.position.y +
            0.9,
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


function updateThirdPersonCamera() {

    if (
        !characterLoaded
    ) {

        return;

    }


    desiredTarget.set(
        characterRoot.position.x,
        characterRoot.position.y +
            0.9,
        characterRoot.position.z
    );


    targetDifference
        .copy(
            desiredTarget
        )
        .sub(
            controls.target
        );


    camera.position.add(
        targetDifference
    );


    controls.target.copy(
        desiredTarget
    );

}


// ============================================================
// TECLADO
// ============================================================

window.addEventListener(
    'keydown',

    (event) => {

        const key =
            event.key
                .toLowerCase();


        if (
            key ===
                'f' &&
            !event.repeat
        ) {

            playThrow();

            return;

        }


        if (
            key ===
            'w'
        ) {

            keys.w =
                true;

        }


        if (
            key ===
            'a'
        ) {

            keys.a =
                true;

        }


        if (
            key ===
            's'
        ) {

            keys.s =
                true;

        }


        if (
            key ===
            'd'
        ) {

            keys.d =
                true;

        }


        if (
            key ===
            'shift'
        ) {

            keys.shift =
                true;

        }

    }
);


window.addEventListener(
    'keyup',

    (event) => {

        const key =
            event.key
                .toLowerCase();


        if (
            key ===
            'w'
        ) {

            keys.w =
                false;

        }


        if (
            key ===
            'a'
        ) {

            keys.a =
                false;

        }


        if (
            key ===
            's'
        ) {

            keys.s =
                false;

        }


        if (
            key ===
            'd'
        ) {

            keys.d =
                false;

        }


        if (
            key ===
            'shift'
        ) {

            keys.shift =
                false;

        }

    }
);


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
            'VERSION 0.7 · NÚCLEOS DE ENERGÍA';

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
// INIT
// ============================================================

async function init() {

    console.log(
        '🎮 OPERATION IMPACT v0.7'
    );


    updateVersionLabel();


    setLoadingState(
        true
    );


    resetUI();


    try {

        // ====================================================
        // RAPIER
        // ====================================================

        await initPhysics();


        // ====================================================
        // MAPA
        // ====================================================

        await loadEnvironment();


        // ====================================================
        // PERSONAJE
        // ====================================================

        await loadCharacter();


        // ====================================================
        // GRANADAS
        // ====================================================

        initGrenadeSystem(
            scene
        );


        // ====================================================
        // PLATAFORMAS
        // ====================================================

        const columnPlatforms =
            collectColumnPlatforms();


        // ====================================================
        // NÚCLEOS
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
        // OBJETOS FÍSICOS
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

                    // Evitar colocar figuras sobre núcleos.
                    reservedPositions:
                        objectivePositions
                }

            );

        }


        // ====================================================
        // BOTÓN INICIO
        // ====================================================

        setupStartButton(
            () => {

                // =============================================
                // JUEGO
                // =============================================

                startGame();


                // =============================================
                // GRANADAS
                // =============================================

                resetGrenades();


                // =============================================
                // OBJETIVOS
                // =============================================

                resetObjectives();


                // =============================================
                // PERSONAJE
                // =============================================

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


                // =============================================
                // ANIMACIONES
                // =============================================

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


                // =============================================
                // OBJETOS FÍSICOS
                // =============================================

                if (
                    ENABLE_DYNAMIC_OBJECTS
                ) {

                    resetDynamicObjects();

                }


                // =============================================
                // CÁMARA
                // =============================================

                resetThirdPersonCamera();


                console.log(
                    '🚀 Misión iniciada'
                );


                console.log(
                    '🎯 Objetivo: destruir los 8 núcleos'
                );

            }
        );


        setLoadingState(
            false
        );


        console.log(
            '✅ OPERATION IMPACT v0.7 LISTO'
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
    // OBJETOS
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
    // NÚCLEOS
    // ========================================================

    updateObjectives3D(
        delta,
        performance.now() /
        1000
    );


    // ========================================================
    // CÁMARA
    // ========================================================

    controls.update();


    // ========================================================
    // LÓGICA DEL JUEGO
    // ========================================================

    updateGame(
        delta
    );


    // ========================================================
    // HUD
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
// INICIO
// ============================================================

init();

animate();