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
    getObjectives
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
// ESCENA
// ============================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(
    0x87a5b5
);

scene.fog = new THREE.Fog(
    0x87a5b5,
    45,
    110
);


// ============================================================
// CÁMARA
// ============================================================

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);

camera.position.set(
    18,
    16,
    22
);


// ============================================================
// RENDERER
// ============================================================

const renderer = new THREE.WebGLRenderer({
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

controls.enableDamping = true;

controls.dampingFactor = 0.07;

controls.enablePan = false;

controls.minDistance = 5;

controls.maxDistance = 55;

controls.minPolarAngle =
    Math.PI * 0.08;

controls.maxPolarAngle =
    Math.PI * 0.48;

controls.target.set(
    0,
    2,
    0
);

controls.update();


// ============================================================
// LUZ HEMISFÉRICA
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
// LUZ DIRECCIONAL PRINCIPAL
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
// VARIABLES DEL ESCENARIO
// ============================================================

let environment = null;

const collisionMeshes = [];


// ============================================================
// GLTF LOADER
// ============================================================

const loader =
    new GLTFLoader();


// ============================================================
// CARGAR ESCENARIO
// ============================================================

function loadEnvironment() {

    console.log(
        '🏙️ Cargando escenario...'
    );

    loader.load(

        './assets/models/environment/scene.gltf',

        (gltf) => {

            environment =
                gltf.scene;

            scene.add(
                environment
            );


            // ====================================================
            // RECORRER OBJETOS DEL ESCENARIO
            // ====================================================

            environment.traverse(
                (child) => {

                    if (!child.isMesh) {
                        return;
                    }


                    // ------------------------------------------------
                    // SOMBRAS
                    // ------------------------------------------------

                    child.castShadow =
                        true;

                    child.receiveShadow =
                        true;


                    // ------------------------------------------------
                    // MATERIALES Y TEXTURAS
                    // ------------------------------------------------

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


                    // ------------------------------------------------
                    // DETECTAR MALLAS DE COLISIÓN
                    // ------------------------------------------------

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

                        // No queremos ver las mallas de colisión
                        child.visible =
                            false;

                        console.log(
                            '🧱 Collider encontrado:',
                            child.name
                        );

                    }

                }
            );


            // ====================================================
            // AJUSTAR TAMAÑO Y POSICIÓN
            // ====================================================

            normalizeEnvironment(
                environment
            );


            // ====================================================
            // INFORMACIÓN
            // ====================================================

            console.log(
                '✅ Escenario cargado correctamente'
            );

            console.log(
                '🧱 Mallas de colisión encontradas:',
                collisionMeshes.length
            );

        },


        // ========================================================
        // PROGRESO DE CARGA
        // ========================================================

        (progress) => {

            if (
                progress.total > 0
            ) {

                const percentage =
                    (
                        progress.loaded /
                        progress.total
                    ) * 100;

                console.log(
                    `📦 Escenario: ${percentage.toFixed(1)}%`
                );

            }

        },


        // ========================================================
        // ERROR
        // ========================================================

        (error) => {

            console.error(
                '❌ Error cargando el escenario:',
                error
            );

            console.error(
                'Verifica scene.gltf, scene.bin y la carpeta textures.'
            );

        }

    );

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


    // ------------------------------------------------------------
    // OBTENER TAMAÑO ORIGINAL
    // ------------------------------------------------------------

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
        '📏 Tamaño original:',
        size
    );


    // ------------------------------------------------------------
    // CALCULAR ESCALA
    // ------------------------------------------------------------

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
            '🔍 Escala aplicada:',
            scale
        );

    }


    // ------------------------------------------------------------
    // ACTUALIZAR MATRICES
    // ------------------------------------------------------------

    model.updateMatrixWorld(
        true
    );


    // ------------------------------------------------------------
    // RECALCULAR CAJA
    // ------------------------------------------------------------

    box =
        new THREE.Box3()
            .setFromObject(
                model
            );


    // ------------------------------------------------------------
    // OBTENER CENTRO
    // ------------------------------------------------------------

    const center =
        new THREE.Vector3();

    box.getCenter(
        center
    );


    // ------------------------------------------------------------
    // CENTRAR EN X Y Z
    // ------------------------------------------------------------

    model.position.x -=
        center.x;

    model.position.z -=
        center.z;


    // ------------------------------------------------------------
    // ACTUALIZAR MATRICES
    // ------------------------------------------------------------

    model.updateMatrixWorld(
        true
    );


    // ------------------------------------------------------------
    // APOYAR ESCENARIO SOBRE Y = 0
    // ------------------------------------------------------------

    box =
        new THREE.Box3()
            .setFromObject(
                model
            );

    model.position.y -=
        box.min.y;


    // ------------------------------------------------------------
    // ACTUALIZAR MATRICES
    // ------------------------------------------------------------

    model.updateMatrixWorld(
        true
    );


    // ------------------------------------------------------------
    // TAMAÑO FINAL
    // ------------------------------------------------------------

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
        '📐 Tamaño final:',
        finalSize
    );


    // ------------------------------------------------------------
    // AJUSTAR OBJETIVO DE LA CÁMARA
    // ------------------------------------------------------------

    controls.target.set(
        0,
        Math.max(
            1.5,
            finalSize.y * 0.25
        ),
        0
    );


    // ------------------------------------------------------------
    // POSICIONAR CÁMARA
    // ------------------------------------------------------------

    camera.position.set(
        finalSize.x * 0.45,
        Math.max(
            10,
            finalSize.y * 2.2
        ),
        finalSize.z * 0.55
    );


    // ------------------------------------------------------------
    // MIRAR HACIA EL CENTRO
    // ------------------------------------------------------------

    camera.lookAt(
        controls.target
    );

    controls.update();

}


// ============================================================
// RELOJ
// ============================================================

const clock =
    new THREE.Clock();


// ============================================================
// INICIALIZACIÓN
// ============================================================

async function init() {

    console.log(
        '🎮 Operation Impact'
    );

    console.log(
        '✅ Three.js cargado correctamente'
    );


    // ------------------------------------------------------------
    // FÍSICA
    // ------------------------------------------------------------

    await initPhysics();


    // ------------------------------------------------------------
    // INTERFAZ
    // ------------------------------------------------------------

    resetUI();


    // ------------------------------------------------------------
    // CARGAR ESCENARIO
    // ------------------------------------------------------------

    loadEnvironment();


    // ------------------------------------------------------------
    // BOTÓN DE INICIO
    // ------------------------------------------------------------

    setupStartButton(
        () => {

            startGame();

            console.log(
                '🚀 Partida iniciada'
            );

        }
    );

}


// ============================================================
// ACTUALIZAR HUD
// ============================================================

function updateUI() {

    const objectives =
        getObjectives();


    // ------------------------------------------------------------
    // ESTADO
    // ------------------------------------------------------------

    updateGameStatus(
        getGameState()
    );


    // ------------------------------------------------------------
    // PUNTUACIÓN
    // ------------------------------------------------------------

    updateScore(
        getScore()
    );


    // ------------------------------------------------------------
    // OBJETIVOS
    // ------------------------------------------------------------

    updateObjectives(
        objectives.destroyed,
        objectives.total
    );

}


// ============================================================
// GAME LOOP
// ============================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    // ------------------------------------------------------------
    // DELTA TIME
    // ------------------------------------------------------------

    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );


    // ------------------------------------------------------------
    // CÁMARA
    // ------------------------------------------------------------

    controls.update();


    // ------------------------------------------------------------
    // JUEGO
    // ------------------------------------------------------------

    updateGame(
        delta
    );


    // ------------------------------------------------------------
    // FÍSICA
    // ------------------------------------------------------------

    updatePhysics(
        delta
    );


    // ------------------------------------------------------------
    // INTERFAZ
    // ------------------------------------------------------------

    updateUI();


    // ------------------------------------------------------------
    // RENDER
    // ------------------------------------------------------------

    renderer.render(
        scene,
        camera
    );

}


// ============================================================
// REDIMENSIONAR VENTANA
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
// INICIAR APLICACIÓN
// ============================================================

init();

animate();