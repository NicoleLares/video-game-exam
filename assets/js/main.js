import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
    updatePhysics
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
    idle: './assets/models/character/Idle.glb',
    walking: './assets/models/character/walking.glb',
    run: './assets/models/character/run.glb',
    throw: './assets/models/character/throw.glb'
};


// ============================================================
// CONFIGURACIÓN DEL PERSONAJE
// ============================================================

const CHARACTER_HEIGHT = 1.35;

const WALK_SPEED = 2.7;
const RUN_SPEED = 5.5;

const ROTATION_SPEED = 12;


// ============================================================
// ORIENTACIÓN DEL MODELO
// ============================================================
//
// 0 porque con Math.PI el SWAT visualmente
// caminaba de espaldas.
//

const MODEL_FORWARD_OFFSET = 0;


// ============================================================
// CORRECCIÓN DE BRAZOS EN IDLE
// ============================================================
//
// El Idle.glb anima directamente:
//
// mixamorig:LeftArm
// mixamorig:RightArm
//
// y deja los brazos demasiado levantados.
//
// Esta corrección SOLO se aplica durante Idle.
//

const IDLE_ARM_DROP_DEGREES = 75;

const IDLE_ARM_BLEND_SPEED = 12;


// ============================================================
// CONFIGURACIÓN DEL SUELO
// ============================================================

const GROUND_RAY_HEIGHT = 40;
const GROUND_OFFSET = 0.02;


// ============================================================
// POSICIÓN INICIAL
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
        antialias: true
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

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.1;


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

controls.enableDamping = true;
controls.dampingFactor = 0.08;

controls.enablePan = false;
controls.enableZoom = true;

controls.minDistance = 2.2;
controls.maxDistance = 6;

controls.minPolarAngle =
    Math.PI * 0.12;

controls.maxPolarAngle =
    Math.PI * 0.47;

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

directionalLight.castShadow = true;

directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;

directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 150;

directionalLight.shadow.bias = -0.0002;

scene.add(
    directionalLight
);


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

let environment = null;

const collisionMeshes = [];


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


let characterModel = null;

let mixer = null;

let characterLoaded = false;

let isThrowing = false;

let activeAction = null;

let activeActionName = '';


// ============================================================
// HUESOS DE LOS BRAZOS
// ============================================================

let leftArmBone = null;
let rightArmBone = null;


// Correcciones finales.
const leftArmCorrection =
    new THREE.Quaternion();

const rightArmCorrection =
    new THREE.Quaternion();


// Correcciones temporales para blending.
const leftArmBlendQuaternion =
    new THREE.Quaternion();

const rightArmBlendQuaternion =
    new THREE.Quaternion();


// Quaternion identidad.
const identityQuaternion =
    new THREE.Quaternion();


// Eje local Z.
const armCorrectionAxis =
    new THREE.Vector3(
        0,
        0,
        1
    );


// Cantidad actual de corrección.
let idleArmBlend = 0;


// ============================================================
// ANIMACIONES
// ============================================================

const actions = {
    idle: null,
    walking: null,
    run: null,
    throw: null
};


// ============================================================
// TECLADO
// ============================================================

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false
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

const UP =
    new THREE.Vector3(
        0,
        1,
        0
    );


// ============================================================
// RAYCASTER DEL SUELO
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
// BOUNDING BOX DEL PERSONAJE ANIMADO
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
// CARGAR GLTF COMO PROMESA
// ============================================================

function loadGLTF(path) {

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
                        progress.total > 0
                    ) {

                        const percent =
                            (
                                progress.loaded /
                                progress.total
                            ) * 100;

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


        environment.traverse(
            (child) => {

                if (
                    !child.isMesh
                ) {

                    return;

                }


                // ====================================================
                // SOMBRAS
                // ====================================================

                child.castShadow = true;
                child.receiveShadow = true;


                // ====================================================
                // MATERIALES
                // ====================================================

                if (
                    child.material
                ) {

                    const materials =
                        Array.isArray(
                            child.material
                        )
                            ? child.material
                            : [child.material];


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


                // ====================================================
                // MALLAS DE COLISIÓN
                // ====================================================

                const objectName =
                    child.name
                        .toLowerCase();


                if (
                    objectName.includes(
                        'collision'
                    )
                ) {

                    collisionMeshes.push(
                        child
                    );


                    child.visible =
                        false;


                    console.log(
                        '🧱 Collider detectado:',
                        child.name
                    );

                }

            }
        );


        normalizeEnvironment(
            environment
        );


        console.log(
            '✅ Escenario cargado'
        );


        console.log(
            '🧱 Mallas de colisión:',
            collisionMeshes.length
        );

    } catch (error) {

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


    const largestDimension =
        Math.max(
            size.x,
            size.z
        );


    const targetSize =
        45;


    if (
        largestDimension > 0
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
// BUSCAR HUESOS DE LOS BRAZOS
// ============================================================

function findArmBones() {

    leftArmBone = null;
    rightArmBone = null;


    characterModel.traverse(
        (object) => {

            if (
                !object.isBone ||
                !object.name
            ) {

                return;

            }


            const name =
                object.name
                    .toLowerCase();


            if (
                name ===
                'mixamorig:leftarm' ||
                name.endsWith(
                    ':leftarm'
                )
            ) {

                leftArmBone =
                    object;

            }


            if (
                name ===
                'mixamorig:rightarm' ||
                name.endsWith(
                    ':rightarm'
                )
            ) {

                rightArmBone =
                    object;

            }

        }
    );


    console.log(
        '🦴 LeftArm:',
        leftArmBone
            ? leftArmBone.name
            : 'NO ENCONTRADO'
    );


    console.log(
        '🦴 RightArm:',
        rightArmBone
            ? rightArmBone.name
            : 'NO ENCONTRADO'
    );


    // ========================================================
    // CREAR CORRECCIONES
    // ========================================================

    const angle =
        THREE.MathUtils.degToRad(
            IDLE_ARM_DROP_DEGREES
        );


    // Brazo izquierdo baja en -Z.
    leftArmCorrection.setFromAxisAngle(
        armCorrectionAxis,
        -angle
    );


    // Brazo derecho baja en +Z.
    rightArmCorrection.setFromAxisAngle(
        armCorrectionAxis,
        angle
    );

}


// ============================================================
// CORREGIR BRAZOS DURANTE IDLE
// ============================================================

function applyIdleArmCorrection(
    delta,
    immediate = false
) {

    if (
        !leftArmBone &&
        !rightArmBone
    ) {

        return;

    }


    // ========================================================
    // SOLO EN IDLE
    // ========================================================

    const shouldCorrect =
        activeActionName === 'idle' &&
        !isThrowing;


    const targetBlend =
        shouldCorrect
            ? 1
            : 0;


    // ========================================================
    // TRANSICIÓN SUAVE
    // ========================================================

    if (
        immediate
    ) {

        idleArmBlend =
            targetBlend;

    } else {

        const interpolation =
            1 -
            Math.exp(
                -IDLE_ARM_BLEND_SPEED *
                delta
            );


        idleArmBlend =
            THREE.MathUtils.lerp(
                idleArmBlend,
                targetBlend,
                interpolation
            );

    }


    if (
        idleArmBlend <
        0.001
    ) {

        idleArmBlend =
            0;

        return;

    }


    // ========================================================
    // LEFT ARM
    // ========================================================

    if (
        leftArmBone
    ) {

        leftArmBlendQuaternion
            .copy(
                identityQuaternion
            )
            .slerp(
                leftArmCorrection,
                idleArmBlend
            );


        leftArmBone.quaternion.multiply(
            leftArmBlendQuaternion
        );

    }


    // ========================================================
    // RIGHT ARM
    // ========================================================

    if (
        rightArmBone
    ) {

        rightArmBlendQuaternion
            .copy(
                identityQuaternion
            )
            .slerp(
                rightArmCorrection,
                idleArmBlend
            );


        rightArmBone.quaternion.multiply(
            rightArmBlendQuaternion
        );

    }

}


// ============================================================
// DETECTAR EL SUELO
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
        intersections.length === 0
    ) {

        return false;

    }


    const groundHit =
        intersections.find(
            (intersection) => {

                const object =
                    intersection.object;


                const objectName =
                    object.name
                        .toLowerCase();


                // ====================================================
                // IGNORAR COLLISION
                // ====================================================

                if (
                    objectName.includes(
                        'collision'
                    )
                ) {

                    return false;

                }


                // ====================================================
                // IGNORAR PAREDES
                // ====================================================

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
// CALCULAR BOUNDING BOX DE LA POSE ACTUAL
// ============================================================

function computeAnimatedCharacterBox() {

    if (
        !characterModel
    ) {

        return false;

    }


    // ========================================================
    // QUITAR COMPENSACIÓN PREVIA
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
        (child) => {

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


    // ========================================================
    // FALLBACK
    // ========================================================

    if (
        !foundSkinnedMesh ||
        animatedCharacterBox.isEmpty()
    ) {

        animatedCharacterBox.setFromObject(
            characterModel
        );

    }


    return !animatedCharacterBox.isEmpty();

}


// ============================================================
// ALINEAR POSE AL SUELO
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


        // ====================================================
        // NORMALIZAR MODELO
        // ====================================================

        normalizeCharacter(
            characterModel
        );


        // ====================================================
        // ENCONTRAR BRAZOS
        // ====================================================

        findArmBones();


        // ====================================================
        // POSICIÓN
        // ====================================================

        characterRoot.position.copy(
            PLAYER_SPAWN
        );


        placeCharacterOnGround();


        // ====================================================
        // ORIENTACIÓN
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
        // FIN DE THROW
        // ====================================================

        mixer.addEventListener(
            'finished',
            (event) => {

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


        // ====================================================
        // IDLE INICIAL
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


        // Corrección inmediata de brazos.
        idleArmBlend = 1;


        applyIdleArmCorrection(
            0,
            true
        );


        placeCharacterOnGround();


        alignAnimatedCharacterToGround();


        resetThirdPersonCamera();


        console.log(
            '✅ SWAT cargado'
        );


        console.log(
            '✅ Idle / Walking / Run / Throw cargados'
        );


        console.log(
            '📍 Altura inicial:',
            characterRoot.position.y
        );

    } catch (error) {

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
    // ESCALA
    // ========================================================

    if (
        size.y > 0
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
    // CENTRAR X/Z
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
    ] = await Promise.all([

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
    // ELIMINAR ROOT MOTION X/Z
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
        gltf.animations.length === 0
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
//
// Solamente X y Z.
//
// Y queda intacto.
//

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
                values.length < 3
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


                // Y no se modifica.


                values[i + 2] =
                    initialZ;

            }

        }
    );


    clip.resetDuration();


    return clip;

}


// ============================================================
// REINICIAR TODAS LAS ANIMACIONES
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


    idleArmBlend =
        0;

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
        activeAction === nextAction &&
        activeActionName === name
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
        previousAction !== nextAction
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


    throwAction.setEffectiveTimeScale(
        1
    );


    throwAction.setEffectiveWeight(
        1
    );


    throwAction.play();


    if (
        previousAction &&
        previousAction !== throwAction
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
// ¿SE ESTÁ MOVIENDO?
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
// ANIMACIÓN SEGÚN MOVIMIENTO
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
    // ACTUALIZAR MIXER
    // ========================================================

    if (
        mixer
    ) {

        mixer.update(
            delta
        );

    }


    // ========================================================
    // CORREGIR BRAZOS DESPUÉS DEL MIXER
    // ========================================================
    //
    // Es importante hacerlo después de mixer.update(),
    // porque AnimationMixer primero coloca los huesos
    // según Idle.glb.
    //

    applyIdleArmCorrection(
        delta
    );


    // ========================================================
    // NO ESTAMOS JUGANDO
    // ========================================================

    if (
        getGameState() !==
        GAME_STATES.PLAYING
    ) {

        placeCharacterOnGround();


        alignAnimatedCharacterToGround();


        return;

    }


    // ========================================================
    // THROW
    // ========================================================

    if (
        isThrowing
    ) {

        placeCharacterOnGround();


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
        cameraForward.lengthSq() > 0
    ) {

        cameraForward.normalize();

    }


    cameraRight
        .crossVectors(
            cameraForward,
            UP
        );


    if (
        cameraRight.lengthSq() > 0
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

    if (
        moveDirection.lengthSq() > 0
    ) {

        moveDirection.normalize();


        const speed =
            keys.shift
                ? RUN_SPEED
                : WALK_SPEED;


        const previousPosition =
            characterRoot.position.clone();


        characterRoot.position.addScaledVector(
            moveDirection,
            speed * delta
        );


        // ====================================================
        // ALTURA DEL SUELO
        // ====================================================

        const foundGround =
            placeCharacterOnGround();


        if (
            !foundGround
        ) {

            characterRoot.position.copy(
                previousPosition
            );

        }


        // ====================================================
        // ROTACIÓN
        // ====================================================

        const targetAngle =
            Math.atan2(
                moveDirection.x,
                moveDirection.z
            );


        rotateCharacterTowards(
            targetAngle,
            delta
        );

    } else {

        placeCharacterOnGround();

    }


    // ========================================================
    // CAMBIAR ANIMACIÓN
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
    // ALINEAR PIES
    // ========================================================

    alignAnimatedCharacterToGround();


    // ========================================================
    // CÁMARA
    // ========================================================

    updateThirdPersonCamera();

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
    (event) => {

        const key =
            event.key
                .toLowerCase();


        // ====================================================
        // F = THROW
        // ====================================================

        if (
            key === 'f' &&
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
    (event) => {

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
            'VERSION 0.3 · PERSONAJE Y ANIMACIONES';

    }

}


// ============================================================
// ESTADO DE CARGA
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
// INICIALIZACIÓN
// ============================================================

async function init() {

    console.log(
        '🎮 OPERATION IMPACT v0.3'
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
        // BOTÓN INICIAR
        // ====================================================

        setupStartButton(
            () => {

                startGame();


                // =================================================
                // POSICIÓN
                // =================================================

                characterRoot.position.copy(
                    PLAYER_SPAWN
                );


                characterVisual.position.y =
                    0;


                placeCharacterOnGround();


                // =================================================
                // ROTACIÓN
                // =================================================

                characterRoot.rotation.y =
                    0;


                // =================================================
                // REINICIAR ANIMACIONES
                // =================================================

                resetAllAnimationActions();


                fadeToAction(
                    'idle',
                    0
                );


                // =================================================
                // ACTUALIZAR MIXER
                // =================================================

                if (
                    mixer
                ) {

                    mixer.update(
                        0
                    );

                }


                // =================================================
                // BRAZOS EN IDLE
                // =================================================

                idleArmBlend =
                    1;


                applyIdleArmCorrection(
                    0,
                    true
                );


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
                    '📍 Posición inicial:',
                    characterRoot.position
                );

            }
        );


        setLoadingState(
            false
        );


        console.log(
            '✅ OPERATION IMPACT LISTO'
        );

    } catch (error) {

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
    // FÍSICA
    // ========================================================

    updatePhysics(
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