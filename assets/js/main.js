import * as THREE from 'three';

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

const scene =
    new THREE.Scene();

scene.background =
    new THREE.Color(
        0x080c11
    );

scene.fog =
    new THREE.Fog(
        0x080c11,
        15,
        45
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
        1000
    );

camera.position.set(
    7,
    6,
    10
);

camera.lookAt(
    0,
    1,
    0
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

renderer.shadowMap.enabled =
    true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
    THREE.SRGBColorSpace;


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
// LUZ AMBIENTAL
// ============================================================

const ambientLight =
    new THREE.AmbientLight(
        0xffffff,
        1.8
    );

scene.add(
    ambientLight
);


// ============================================================
// LUZ DIRECCIONAL
// ============================================================

const directionalLight =
    new THREE.DirectionalLight(
        0xffffff,
        3
    );

directionalLight.position.set(
    8,
    12,
    6
);

directionalLight.castShadow =
    true;

scene.add(
    directionalLight
);


// ============================================================
// PISO DE PRUEBA
// ============================================================

const floorGeometry =
    new THREE.PlaneGeometry(
        30,
        30
    );

const floorMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x161d24,
        roughness: 0.9,
        metalness: 0.1
    });

const floor =
    new THREE.Mesh(
        floorGeometry,
        floorMaterial
    );

floor.rotation.x =
    -Math.PI / 2;

floor.receiveShadow =
    true;

scene.add(
    floor
);


// ============================================================
// CUADRÍCULA
// ============================================================

const grid =
    new THREE.GridHelper(
        30,
        30,
        0x35424e,
        0x1b252e
    );

grid.position.y =
    0.01;

scene.add(
    grid
);


// ============================================================
// OBJETO DE PRUEBA
// ============================================================

const cubeGeometry =
    new THREE.BoxGeometry(
        2,
        2,
        2
    );

const cubeMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x8d99a3,
        roughness: 0.45,
        metalness: 0.35
    });

const cube =
    new THREE.Mesh(
        cubeGeometry,
        cubeMaterial
    );

cube.position.set(
    0,
    1,
    0
);

cube.castShadow =
    true;

cube.receiveShadow =
    true;

scene.add(
    cube
);


// ============================================================
// CÍRCULO DECORATIVO
// ============================================================

const ringGeometry =
    new THREE.RingGeometry(
        2.8,
        3,
        64
    );

const ringMaterial =
    new THREE.MeshBasicMaterial({
        color: 0x657481,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35
    });

const ring =
    new THREE.Mesh(
        ringGeometry,
        ringMaterial
    );

ring.rotation.x =
    -Math.PI / 2;

ring.position.y =
    0.02;

scene.add(
    ring
);


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

    await initPhysics();

    resetUI();

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
// ACTUALIZACIÓN DE INTERFAZ
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
// ANIMACIÓN
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


    // --------------------------------------------
    // ANIMACIÓN TEMPORAL DEL CUBO
    // --------------------------------------------

    cube.rotation.y +=
        delta * 0.5;

    cube.rotation.x +=
        delta * 0.15;


    // --------------------------------------------
    // JUEGO
    // --------------------------------------------

    updateGame(
        delta
    );


    // --------------------------------------------
    // FÍSICA
    // --------------------------------------------

    updatePhysics(
        delta
    );


    // --------------------------------------------
    // HUD
    // --------------------------------------------

    updateUI();


    // --------------------------------------------
    // RENDER
    // --------------------------------------------

    renderer.render(
        scene,
        camera
    );

}


// ============================================================
// REDIMENSIONAR
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