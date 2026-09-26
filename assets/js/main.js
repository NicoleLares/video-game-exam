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
    setupStartButton,
    updateGameStatus,
    updateScore,
    updateObjectives,
    resetUI
} from './ui.js';


// ============================================================
// RUTAS
// ============================================================

const ENVIRONMENT_PATH =
    './assets/models/environment/scene.gltf';

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
// CONFIGURACIÓN DEL PERSONAJE
// ============================================================

const CHARACTER_HEIGHT =
    1.35;

const WALK_SPEED =
    2.7;

const RUN_SPEED =
    5.5;

const ROTATION_SPEED =
    12;


// ============================================================
// ORIENTACIÓN
// ============================================================

const MODEL_FORWARD_OFFSET =
    0;


// ============================================================
// RAYCASTER INICIAL
// ============================================================
//
// Ahora Rapier controla el suelo durante el juego.
//
// Este Raycaster SOLO lo usaremos para conocer
// la altura inicial donde aparece el personaje.
//
// ============================================================

const GROUND_RAY_HEIGHT =
    40;

const GROUND_OFFSET =
    0.02;


// ============================================================
// SPAWN
// ============================================================

const PLAYER_SPAWN =
    new THREE.Vector3(
        0,
        0,
        10
    );


// ============================================================
// ESCENA
// ============================================================

const scene =
    new THREE.Scene();

scene.background =
    new THREE.Color(
        0x87a5b5
    );

scene.fog =
    new THREE.Fog(
        0x87a5b5,
        45,
        110
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
    2.4,
    2.1,
    3.4
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
    THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure =
    1.1;


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

controls.minDistance =
    2.2;

controls.maxDistance =
    6;

controls.minPolarAngle =
    Math.PI *
    0.12;

controls.maxPolarAngle =
    Math.PI *
    0.47;

controls.target.set(
    0,
    1.1,
    0
);

controls.update();


// ============================================================
// ILUMINACIÓN
// ============================================================

const hemisphereLight =
    new THREE.HemisphereLight(
        0xdbeeff,
        0x4b4b3d,
        2.3
    );

scene.add(
    hemisphereLight
);


// ============================================================
// LUZ PRINCIPAL
// ============================================================

const directionalLight =
    new THREE.DirectionalLight(
        0xfff1d4,
        3.5
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
    -50;

directionalLight.shadow.camera.right =
    50;

directionalLight.shadow.camera.top =
    50;

directionalLight.shadow.camera.bottom =
    -50;

directionalLight.shadow.camera.near =
    0.1;

directionalLight.shadow.camera.far =
    150;

directionalLight.shadow.bias =
    -0.0002;

scene.add(
    directionalLight
);


// ============================================================
// LUZ SECUNDARIA
// ============================================================

const fillLight =
    new THREE.DirectionalLight(
        0xaac7dd,
        1
    );

fillLight.position.set(
    -25,
    15,
    -20
);

scene.add(
    fillLight
);


// ============================================================
// GLTF LOADER
// ============================================================

const loader =
    new GLTFLoader();


// ============================================================
// ESCENARIO
// ============================================================

let environment =
    null;


// ============================================================
// MALLAS FÍSICAS
// ============================================================

const collisionMeshes =
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
// TECLADO
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
// VECTORES AUXILIARES
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

const horizontalPhysicsMovement = {

    x:
        0,

    z:
        0

};

const UP =
    new THREE.Vector3(
        0,
        1,
        0
    );


// ============================================================
// RAYCASTER
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
// PERSONAJE ANIMADO
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

                (
                    progress
                ) => {

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
        '🏙️ Cargando escenario...'
    );


    try {

        const gltf =
            await loadGLTF(
                ENVIRONMENT_PATH
            );


        environment =
            gltf.scene;


        scene.add(
            environment
        );


        // ====================================================
        // CONFIGURAR MALLAS
        // ====================================================

        environment.traverse(

            (
                child
            ) => {

                if (
                    !child.isMesh
                ) {

                    return;

                }


                // =================================================
                // SOMBRAS
                // =================================================

                child.castShadow =
                    true;

                child.receiveShadow =
                    true;


                // =================================================
                // TEXTURAS
                // =================================================

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

                        (
                            material
                        ) => {

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


                // =================================================
                // COLLISION MESHES
                // =================================================

                const name =
                    child.name
                        .toLowerCase();


                if (
                    name.includes(
                        'collision'
                    )
                ) {

                    collisionMeshes.push(
                        child
                    );


                    // No mostrar geometría de colisión.
                    child.visible =
                        false;


                    console.log(
                        '🧱 Collision mesh:',
                        child.name
                    );

                }

            }

        );


        // ====================================================
        // NORMALIZAR ESCENARIO
        // ====================================================

        normalizeEnvironment(
            environment
        );


        // ====================================================
        // ACTUALIZAR MATRICES
        // ====================================================

        environment.updateMatrixWorld(
            true
        );


        // ====================================================
        // CREAR COLLIDERS RAPIER
        // ====================================================

        const created =
            createEnvironmentColliders(
                collisionMeshes
            );


        if (
            created ===
            0
        ) {

            console.warn(
                '⚠️ El escenario no proporcionó Collision meshes para Rapier.'
            );

        }


        console.log(
            '✅ Escenario cargado'
        );


        console.log(
            '🧱 Collision meshes:',
            collisionMeshes.length
        );

    } catch (
    error
    ) {

        console.error(
            '❌ Error cargando escenario:',
            error
        );


        throw error;

    }

}


// ============================================================
// NORMALIZAR ESCENARIO
// ============================================================

function normalizeEnvironment(
    model
) {

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


    console.log(
        '📏 Tamaño original escenario:',
        size
    );


    // ========================================================
    // ESCALAR
    // ========================================================

    const largestDimension =
        Math.max(
            size.x,
            size.z
        );


    const targetSize =
        45;


    if (
        largestDimension >
        0
    ) {

        const scale =
            targetSize /
            largestDimension;


        model.scale.setScalar(
            scale
        );


        console.log(
            '🔍 Escala escenario:',
            scale
        );

    }


    // ========================================================
    // CENTRAR
    // ========================================================

    model.updateMatrixWorld(
        true
    );


    box =
        new THREE.Box3()
            .setFromObject(
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


    // ========================================================
    // BASE EN Y = 0
    // ========================================================

    model.updateMatrixWorld(
        true
    );


    box =
        new THREE.Box3()
            .setFromObject(
                model
            );


    model.position.y -=
        box.min.y;


    model.updateMatrixWorld(
        true
    );


    // ========================================================
    // TAMAÑO FINAL
    // ========================================================

    const finalBox =
        new THREE.Box3()
            .setFromObject(
                model
            );


    const finalSize =
        new THREE.Vector3();


    finalBox.getSize(
        finalSize
    );


    console.log(
        '📐 Tamaño final escenario:',
        finalSize
    );

}


// ============================================================
// BUSCAR ALTURA INICIAL DEL SUELO
// ============================================================
//
// Este sistema ya NO controla el movimiento.
//
// Solo se usa cuando:
// - carga el personaje
// - reiniciamos la partida
//
// ============================================================

function placeCharacterOnGround() {

    if (
        !environment
    ) {

        return false;

    }


    environment.updateMatrixWorld(
        true
    );


    groundRayOrigin.set(

        characterRoot.position.x,

        characterRoot.position.y +
        GROUND_RAY_HEIGHT,

        characterRoot.position.z

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


    if (
        intersections.length ===
        0
    ) {

        return false;

    }


    const groundHit =
        intersections.find(

            (
                intersection
            ) => {

                const object =
                    intersection.object;


                const name =
                    object.name
                        .toLowerCase();


                // =================================================
                // IGNORAR MALLAS COLLISION
                // =================================================

                if (
                    name.includes(
                        'collision'
                    )
                ) {

                    return false;

                }


                // =================================================
                // IGNORAR PAREDES
                // =================================================

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
                        0.35
                    ) {

                        return false;

                    }

                }


                return true;

            }

        );


    if (
        !groundHit
    ) {

        return false;

    }


    characterRoot.position.y =
        groundHit.point.y +
        GROUND_OFFSET;


    return true;

}


// ============================================================
// CALCULAR CAJA DEL PERSONAJE
// ============================================================

function computeAnimatedCharacterBox() {

    if (
        !characterModel
    ) {

        return false;

    }


    // ========================================================
    // QUITAR COMPENSACIÓN ANTERIOR
    // ========================================================

    characterVisual.position.y =
        0;


    characterRoot.updateMatrixWorld(
        true
    );


    animatedCharacterBox.makeEmpty();


    let foundSkinnedMesh =
        false;


    characterModel.traverse(

        (
            child
        ) => {

            if (
                !child.isSkinnedMesh
            ) {

                return;

            }


            foundSkinnedMesh =
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
        !foundSkinnedMesh ||
        animatedCharacterBox.isEmpty()
    ) {

        animatedCharacterBox
            .setFromObject(
                characterModel
            );

    }


    return !animatedCharacterBox.isEmpty();

}


// ============================================================
// ALINEAR PERSONAJE VISUAL CON LA CÁPSULA
// ============================================================

function alignAnimatedCharacterToGround() {

    if (
        !characterModel ||
        !characterLoaded
    ) {

        return;

    }


    const validBox =
        computeAnimatedCharacterBox();


    if (
        !validBox
    ) {

        return;

    }


    const groundY =
        characterRoot.position.y;


    const visualBottomY =
        animatedCharacterBox.min.y;


    const correction =
        groundY -
        visualBottomY;


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


    try {

        const gltf =
            await loadGLTF(
                CHARACTER_PATH
            );


        characterModel =
            gltf.scene;


        characterVisual.add(
            characterModel
        );


        // ====================================================
        // SOMBRAS
        // ====================================================

        characterModel.traverse(

            (
                child
            ) => {

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


        // ====================================================
        // NORMALIZAR
        // ====================================================

        normalizeCharacter(
            characterModel
        );


        // ====================================================
        // POSICIÓN INICIAL
        // ====================================================

        characterRoot.position.copy(
            PLAYER_SPAWN
        );


        // ====================================================
        // DETECTAR CALLE
        // ====================================================

        placeCharacterOnGround();


        // ====================================================
        // CREAR CÁPSULA RAPIER
        // ====================================================

        createCharacterPhysics(
            characterRoot.position
        );


        characterPhysicsCreated =
            true;


        // ====================================================
        // ORIENTACIÓN VISUAL
        // ====================================================

        characterModel.rotation.y =
            MODEL_FORWARD_OFFSET;


        // ====================================================
        // MIXER
        // ====================================================

        mixer =
            new THREE.AnimationMixer(
                characterModel
            );


        // ====================================================
        // ANIMACIONES
        // ====================================================

        await loadAnimations();


        // ====================================================
        // TERMINA THROW
        // ====================================================

        mixer.addEventListener(

            'finished',

            (
                event
            ) => {

                if (
                    event.action !==
                    actions.throw
                ) {

                    return;

                }


                isThrowing =
                    false;


                actions.throw.stop();


                actions.throw.enabled =
                    false;


                actions.throw
                    .setEffectiveWeight(
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


        // ====================================================
        // IDLE
        // ====================================================

        resetAllAnimationActions();


        fadeToAction(
            'idle',
            0
        );


        characterLoaded =
            true;


        if (
            mixer
        ) {

            mixer.update(
                0
            );

        }


        alignAnimatedCharacterToGround();


        resetThirdPersonCamera();


        console.log(
            '✅ SWAT cargado'
        );


        console.log(
            '⚙️ Física del SWAT activa'
        );

    } catch (
    error
    ) {

        console.error(
            '❌ Error cargando personaje:',
            error
        );


        throw error;

    }

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


    console.log(
        '🧍 Tamaño original SWAT:',
        size
    );


    // ========================================================
    // ESCALAR
    // ========================================================

    if (
        size.y >
        0
    ) {

        const scale =
            CHARACTER_HEIGHT /
            size.y;


        model.scale.setScalar(
            scale
        );


        console.log(
            '🧍 Escala SWAT:',
            scale
        );

    }


    // ========================================================
    // CENTRAR
    // ========================================================

    model.updateMatrixWorld(
        true
    );


    box =
        new THREE.Box3()
            .setFromObject(
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


    // ========================================================
    // PIES EN Y = 0
    // ========================================================

    model.updateMatrixWorld(
        true
    );


    box =
        new THREE.Box3()
            .setFromObject(
                model
            );


    model.position.y -=
        box.min.y;


    model.updateMatrixWorld(
        true
    );


    const finalBox =
        new THREE.Box3()
            .setFromObject(
                model
            );


    const finalSize =
        new THREE.Vector3();


    finalBox.getSize(
        finalSize
    );


    console.log(
        '🧍 Tamaño final SWAT:',
        finalSize
    );

}


// ============================================================
// CARGAR ANIMACIONES
// ============================================================

async function loadAnimations() {

    console.log(
        '🎞️ Cargando animaciones...'
    );


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


    // ========================================================
    // CLIPS
    // ========================================================

    const idleClip =
        getAnimationClip(
            idleGLTF,
            'idle'
        );


    const walkingClip =
        getAnimationClip(
            walkingGLTF,
            'walking'
        );


    const runClip =
        getAnimationClip(
            runGLTF,
            'run'
        );


    const throwClip =
        getAnimationClip(
            throwGLTF,
            'throw'
        );


    // ========================================================
    // ROOT MOTION
    // ========================================================

    const idleInPlace =
        makeClipInPlace(
            idleClip
        );


    const walkingInPlace =
        makeClipInPlace(
            walkingClip
        );


    const runInPlace =
        makeClipInPlace(
            runClip
        );


    const throwInPlace =
        makeClipInPlace(
            throwClip
        );


    // ========================================================
    // ACTIONS
    // ========================================================

    actions.idle =
        mixer.clipAction(
            idleInPlace
        );


    actions.walking =
        mixer.clipAction(
            walkingInPlace
        );


    actions.run =
        mixer.clipAction(
            runInPlace
        );


    actions.throw =
        mixer.clipAction(
            throwInPlace
        );


    // ========================================================
    // LOOPS
    // ========================================================

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


    console.log(
        `🎞️ Idle: ${idleInPlace.duration.toFixed(2)}s`
    );


    console.log(
        `🎞️ Walking: ${walkingInPlace.duration.toFixed(2)}s`
    );


    console.log(
        `🎞️ Run: ${runInPlace.duration.toFixed(2)}s`
    );


    console.log(
        `🎞️ Throw: ${throwInPlace.duration.toFixed(2)}s`
    );

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
            `${name}.glb no contiene animaciones.`
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
// ELIMINAR ROOT MOTION X/Z
// ============================================================

function makeClipInPlace(
    originalClip
) {

    const clip =
        originalClip.clone();


    clip.tracks.forEach(

        (
            track
        ) => {

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
                i < values.length;
                i += 3
            ) {

                values[i] =
                    initialX;


                // Y se conserva.


                values[i + 2] =
                    initialZ;

            }

        }

    );


    clip.resetDuration();


    return clip;

}


// ============================================================
// REINICIAR ANIMACIONES
// ============================================================

function resetAllAnimationActions() {

    Object.values(
        actions
    ).forEach(

        (
            action
        ) => {

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


    nextAction
        .setEffectiveTimeScale(
            1
        );


    nextAction
        .setEffectiveWeight(
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

    } else {

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


    isThrowing =
        true;


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


    throwAction
        .setEffectiveTimeScale(
            1
        );


    throwAction
        .setEffectiveWeight(
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


    console.log(
        '💥 THROW'
    );

}


// ============================================================
// MOVIMIENTO ACTIVO
// ============================================================

function isMoving() {

    return (

        keys.w ||
        keys.a ||
        keys.s ||
        keys.d

    );

}


// ============================================================
// ANIMACIÓN DE MOVIMIENTO
// ============================================================

function getMovementAnimation() {

    if (
        !isMoving()
    ) {

        return 'idle';

    }


    if (
        keys.shift
    ) {

        return 'run';

    }


    return 'walking';

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


    // ========================================================
    // ANIMACIONES
    // ========================================================

    if (
        mixer
    ) {

        mixer.update(
            delta
        );

    }


    // ========================================================
    // NO JUGANDO
    // ========================================================

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

        horizontalPhysicsMovement.x =
            0;


        horizontalPhysicsMovement.z =
            0;


        const physicsPosition =
            moveCharacter(
                horizontalPhysicsMovement,
                delta
            );


        syncCharacterFromPhysics(
            physicsPosition
        );


        alignAnimatedCharacterToGround();


        updateThirdPersonCamera();


        return;

    }


    // ========================================================
    // DIRECCIÓN
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


    cameraRight
        .crossVectors(
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
    // W
    // ========================================================

    if (
        keys.w
    ) {

        moveDirection.add(
            cameraForward
        );

    }


    // ========================================================
    // S
    // ========================================================

    if (
        keys.s
    ) {

        moveDirection.sub(
            cameraForward
        );

    }


    // ========================================================
    // D
    // ========================================================

    if (
        keys.d
    ) {

        moveDirection.add(
            cameraRight
        );

    }


    // ========================================================
    // A
    // ========================================================

    if (
        keys.a
    ) {

        moveDirection.sub(
            cameraRight
        );

    }


    // ========================================================
    // MOVIMIENTO
    // ========================================================

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


    // ========================================================
    // RAPIER DECIDE EL MOVIMIENTO
    // ========================================================

    const physicsPosition =
        moveCharacter(
            horizontalPhysicsMovement,
            delta
        );


    // ========================================================
    // SINCRONIZAR THREE.JS
    // ========================================================

    syncCharacterFromPhysics(
        physicsPosition
    );


    // ========================================================
    // ROTACIÓN
    // ========================================================

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


    // ========================================================
    // ANIMACIÓN
    // ========================================================

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


    // ========================================================
    // CORRECCIÓN VISUAL
    // ========================================================

    alignAnimatedCharacterToGround();


    // ========================================================
    // CÁMARA
    // ========================================================

    updateThirdPersonCamera();

}


// ============================================================
// SINCRONIZAR THREE CON RAPIER
// ============================================================

function syncCharacterFromPhysics(
    physicsPosition
) {

    if (
        !physicsPosition
    ) {

        return;

    }


    characterRoot.position.set(

        physicsPosition.x,

        physicsPosition.y,

        physicsPosition.z

    );

}


// ============================================================
// ROTACIÓN SUAVE
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
// CÁMARA INICIAL
// ============================================================

function resetThirdPersonCamera() {

    desiredTarget.set(

        characterRoot.position.x,

        characterRoot.position.y +
        0.95,

        characterRoot.position.z

    );


    controls.target.copy(
        desiredTarget
    );


    camera.position.set(

        characterRoot.position.x +
        2.4,

        characterRoot.position.y +
        2.0,

        characterRoot.position.z +
        3.4

    );


    camera.lookAt(
        desiredTarget
    );


    controls.update();

}


// ============================================================
// CÁMARA DE SEGUIMIENTO
// ============================================================

function updateThirdPersonCamera() {

    if (
        !characterLoaded
    ) {

        return;

    }


    desiredTarget.set(

        characterRoot.position.x,

        characterRoot.position.y +
        0.95,

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
// KEYDOWN
// ============================================================

window.addEventListener(

    'keydown',

    (
        event
    ) => {

        const key =
            event.key
                .toLowerCase();


        // ====================================================
        // THROW
        // ====================================================

        if (
            key ===
            'f' &&
            !event.repeat
        ) {

            playThrow();


            return;

        }


        switch (
        key
        ) {

            case 'w':

                keys.w =
                    true;

                break;


            case 'a':

                keys.a =
                    true;

                break;


            case 's':

                keys.s =
                    true;

                break;


            case 'd':

                keys.d =
                    true;

                break;


            case 'shift':

                keys.shift =
                    true;

                break;

        }

    }

);


// ============================================================
// KEYUP
// ============================================================

window.addEventListener(

    'keyup',

    (
        event
    ) => {

        const key =
            event.key
                .toLowerCase();


        switch (
        key
        ) {

            case 'w':

                keys.w =
                    false;

                break;


            case 'a':

                keys.a =
                    false;

                break;


            case 's':

                keys.s =
                    false;

                break;


            case 'd':

                keys.d =
                    false;

                break;


            case 'shift':

                keys.shift =
                    false;

                break;

        }

    }

);


// ============================================================
// PÉRDIDA DE FOCO
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

    }

);


// ============================================================
// HUD
// ============================================================

function updateUI() {

    const objectives =
        getObjectives();


    updateGameStatus(
        getGameState()
    );


    updateScore(
        getScore()
    );


    updateObjectives(

        objectives.destroyed,

        objectives.total

    );

}


// ============================================================
// VERSIÓN
// ============================================================

function updateVersionLabel() {

    const label =
        document.querySelector(
            '.version'
        );


    if (
        label
    ) {

        label.textContent =
            'VERSION 0.4 · FÍSICA Y COLISIONES';

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


    if (
        loading
    ) {

        button.disabled =
            true;


        button.textContent =
            'CARGANDO...';

    } else {

        button.disabled =
            false;


        button.textContent =
            'INICIAR MISIÓN';

    }

}


// ============================================================
// INICIALIZAR
// ============================================================

async function init() {

    console.log(
        '🎮 OPERATION IMPACT v0.4'
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
        // ESCENARIO + COLLIDERS
        // ====================================================

        await loadEnvironment();


        // ====================================================
        // PERSONAJE + CÁPSULA
        // ====================================================

        await loadCharacter();


        // ====================================================
        // BOTÓN
        // ====================================================

        setupStartButton(

            () => {

                startGame();


                // =================================================
                // POSICIÓN VISUAL
                // =================================================

                characterRoot.position.copy(
                    PLAYER_SPAWN
                );


                characterVisual.position.y =
                    0;


                // =================================================
                // OBTENER ALTURA DE LA CALLE
                // =================================================

                placeCharacterOnGround();


                // =================================================
                // REPOSICIONAR CÁPSULA
                // =================================================

                if (
                    characterPhysicsCreated
                ) {

                    setCharacterPhysicsPosition(
                        characterRoot.position
                    );

                }


                // =================================================
                // ROTACIÓN
                // =================================================

                characterRoot.rotation.y =
                    0;


                // =================================================
                // ANIMACIONES
                // =================================================

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


                // =================================================
                // PIES
                // =================================================

                alignAnimatedCharacterToGround();


                // =================================================
                // CÁMARA
                // =================================================

                resetThirdPersonCamera();


                console.log(
                    '🚀 Misión iniciada'
                );


                console.log(
                    '⚙️ Character Controller activo'
                );

            }

        );


        setLoadingState(
            false
        );


        console.log(
            '✅ OPERATION IMPACT v0.4 LISTO'
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
// GAME LOOP
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
    // RAPIER
    // ========================================================

    updatePhysics(
        delta
    );


    // ========================================================
    // CÁMARA
    // ========================================================

    controls.update();


    // ========================================================
    // JUEGO
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
// INICIAR
// ============================================================

init();

animate();