import * as THREE from 'three';

import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';


// ============================================================
// OPERATION IMPACT
// WEAPON.JS
// VERSION 1.1.0
//
// ARMA 3D REAL
// CONECTADA A RIGHTHAND
// ============================================================


// ============================================================
// RUTA DEL MODELO
// ============================================================

const WEAPON_MODEL_PATH =
    './assets/models/props/weapon.glb';


// ============================================================
// CONFIGURACIÓN DEL ARMA
// ============================================================
//
// Estos son los valores que podremos modificar después
// para acomodar visualmente el rifle.
//
// ============================================================

const TARGET_WEAPON_LENGTH =
    0.72;


// ============================================================
// POSICIÓN RESPECTO A LA MANO DERECHA
// ============================================================
//
// X = izquierda / derecha
// Y = arriba / abajo
// Z = adelante / atrás
//
// ============================================================

const WEAPON_POSITION =
    new THREE.Vector3(
        0.00,
        0.10,
        0.16
    );


// ============================================================
// ROTACIÓN DEL ANCLA
// ============================================================

const WEAPON_ROTATION =
    new THREE.Euler(
        0,
        0,
        0
    );


// ============================================================
// ROTACIÓN INTERNA DEL MODELO
// ============================================================
//
// weapon.glb necesita esta corrección para quedar
// aproximadamente horizontal.
//
// ============================================================

const MODEL_ROTATION =
    new THREE.Euler(
        0,
        Math.PI / 2,
        0
    );


// ============================================================
// ESTADO
// ============================================================

let weaponAnchor =
    null;

let weaponRoot =
    null;

let weaponModel =
    null;

let muzzlePoint =
    null;

let rightHandBone =
    null;

let weaponLoaded =
    false;

let loadRequestId =
    0;


// ============================================================
// LOADER
// ============================================================

const loader =
    new GLTFLoader();


// ============================================================
// OBJETOS TEMPORALES
// ============================================================

const tempWorldScale =
    new THREE.Vector3();

const tempQuaternion =
    new THREE.Quaternion();

const tempBox =
    new THREE.Box3();

const tempSize =
    new THREE.Vector3();

const tempCenter =
    new THREE.Vector3();


// ============================================================
// BUSCAR MANO DERECHA
// ============================================================

function findRightHand(
    character
) {

    // ========================================================
    // NOMBRE MIXAMO
    // ========================================================

    let hand =
        character.getObjectByName(
            'mixamorig:RightHand'
        );


    if (
        hand
    ) {

        return hand;

    }


    // ========================================================
    // NOMBRE ALTERNATIVO
    // ========================================================

    hand =
        character.getObjectByName(
            'RightHand'
        );


    if (
        hand
    ) {

        return hand;

    }


    // ========================================================
    // BÚSQUEDA AUTOMÁTICA
    // ========================================================

    character.traverse(
        (child) => {

            if (
                hand ||
                !child.isBone
            ) {

                return;

            }


            const normalizedName =
                (
                    child.name ||
                    ''
                )
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9]/g,
                        ''
                    );


            if (
                normalizedName.includes(
                    'righthand'
                )
            ) {

                hand =
                    child;

            }

        }
    );


    return hand;

}


// ============================================================
// COMPENSAR ESCALA DEL PERSONAJE
// ============================================================
//
// El SWAT se escala dentro de main.js.
//
// Si agregamos el rifle directamente al hueso,
// heredaría esa escala.
//
// Con esto hacemos que weapon.glb mantenga su tamaño.
//
// ============================================================

function compensateBoneScale(
    bone,
    anchor
) {

    bone.updateWorldMatrix(
        true,
        false
    );


    bone.getWorldScale(
        tempWorldScale
    );


    const scaleX =
        Math.abs(
            tempWorldScale.x
        ) >
        0.00001
            ?
            1 /
            Math.abs(
                tempWorldScale.x
            )
            :
            1;


    const scaleY =
        Math.abs(
            tempWorldScale.y
        ) >
        0.00001
            ?
            1 /
            Math.abs(
                tempWorldScale.y
            )
            :
            1;


    const scaleZ =
        Math.abs(
            tempWorldScale.z
        ) >
        0.00001
            ?
            1 /
            Math.abs(
                tempWorldScale.z
            )
            :
            1;


    anchor.scale.set(
        scaleX,
        scaleY,
        scaleZ
    );

}


// ============================================================
// CONFIGURAR MATERIAL
// ============================================================

function configureMaterial(
    material
) {

    if (
        !material
    ) {

        return;

    }


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


// ============================================================
// CONFIGURAR MATERIALES Y SOMBRAS
// ============================================================

function configureWeaponMaterials(
    root
) {

    root.traverse(
        (child) => {

            if (
                !child.isMesh
            ) {

                return;

            }


            child.castShadow =
                true;


            child.receiveShadow =
                true;


            if (
                Array.isArray(
                    child.material
                )
            ) {

                child.material.forEach(
                    configureMaterial
                );

            } else {

                configureMaterial(
                    child.material
                );

            }

        }
    );

}


// ============================================================
// NORMALIZAR TAMAÑO DEL ARMA
// ============================================================

function normalizeWeaponScale(
    root
) {

    // ========================================================
    // ROTACIÓN BASE DEL GLB
    // ========================================================

    root.rotation.copy(
        MODEL_ROTATION
    );


    root.updateMatrixWorld(
        true
    );


    // ========================================================
    // CALCULAR TAMAÑO ORIGINAL
    // ========================================================

    tempBox.setFromObject(
        root
    );


    tempBox.getSize(
        tempSize
    );


    const largestDimension =
        Math.max(
            tempSize.x,
            tempSize.y,
            tempSize.z
        );


    if (
        largestDimension <=
        0
    ) {

        console.warn(
            '⚠️ No se pudo medir weapon.glb'
        );


        return;

    }


    // ========================================================
    // ESCALA AUTOMÁTICA
    // ========================================================

    const scale =
        TARGET_WEAPON_LENGTH /
        largestDimension;


    root.scale.setScalar(
        scale
    );


    root.updateMatrixWorld(
        true
    );


    console.log(
        '📏 Tamaño original weapon.glb:',
        largestDimension.toFixed(
            3
        )
    );


    console.log(
        '📐 Escala aplicada:',
        scale.toFixed(
            3
        )
    );

}


// ============================================================
// CREAR PUNTO DEL CAÑÓN
// ============================================================
//
// Todavía no modifica shooting.js.
//
// Este punto queda preparado para posteriormente
// hacer que el fogonazo y el proyectil nazcan
// desde la boca del arma.
//
// ============================================================

function createMuzzlePoint() {

    if (
        !weaponModel ||
        !weaponRoot
    ) {

        return;

    }


    weaponModel.updateWorldMatrix(
        true,
        true
    );


    // ========================================================
    // BOUNDING BOX DEL MODELO
    // ========================================================

    tempBox.setFromObject(
        weaponModel
    );


    tempBox.getCenter(
        tempCenter
    );


    // ========================================================
    // EXTREMO DEL ARMA
    // ========================================================
    //
    // Después de MODEL_ROTATION asumimos que
    // el frente del rifle está en -Z.
    //
    // ========================================================

    const muzzleWorldPosition =
        new THREE.Vector3(

            tempCenter.x,

            tempCenter.y,

            tempBox.min.z

        );


    // ========================================================
    // CONVERTIR A ESPACIO LOCAL
    // ========================================================

    weaponRoot.worldToLocal(
        muzzleWorldPosition
    );


    muzzlePoint =
        new THREE.Object3D();


    muzzlePoint.name =
        'WeaponMuzzle';


    muzzlePoint.position.copy(
        muzzleWorldPosition
    );


    weaponRoot.add(
        muzzlePoint
    );


    console.log(
        '🔥 WeaponMuzzle creado'
    );

}


// ============================================================
// CARGAR MODELO 3D
// ============================================================

function loadWeaponModel(
    requestId
) {

    console.log(
        '🔫 Cargando weapon.glb...'
    );


    loader.load(

        WEAPON_MODEL_PATH,


        // ====================================================
        // ÉXITO
        // ====================================================

        (gltf) => {

            // =================================================
            // EVITAR CARGAS ANTIGUAS
            // =================================================

            if (
                requestId !==
                loadRequestId
            ) {

                return;

            }


            if (
                !weaponRoot
            ) {

                return;

            }


            // =================================================
            // MODELO
            // =================================================

            weaponModel =
                gltf.scene;


            weaponModel.name =
                'WeaponGLB';


            weaponModel.position.set(
                0,
                0,
                0
            );


            // =================================================
            // MATERIALES
            // =================================================

            configureWeaponMaterials(
                weaponModel
            );


            // =================================================
            // TAMAÑO Y ORIENTACIÓN
            // =================================================

            normalizeWeaponScale(
                weaponModel
            );


            // =================================================
            // AÑADIR AL ROOT
            // =================================================

            weaponRoot.add(
                weaponModel
            );


            weaponRoot.updateMatrixWorld(
                true
            );


            // =================================================
            // CREAR MUZZLE
            // =================================================

            createMuzzlePoint();


            weaponLoaded =
                true;


            console.log(
                '✅ weapon.glb cargado correctamente'
            );


            console.log(
                '✅ Rifle unido a RightHand'
            );

        },


        // ====================================================
        // PROGRESO
        // ====================================================

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
                    `🔫 weapon.glb: ${percent.toFixed(0)}%`
                );

            }

        },


        // ====================================================
        // ERROR
        // ====================================================

        (error) => {

            console.error(
                '❌ Error cargando weapon.glb:',
                error
            );

        }

    );

}


// ============================================================
// CONECTAR ARMA AL PERSONAJE
// ============================================================

export function attachWeaponToCharacter(
    character
) {

    if (
        !character
    ) {

        console.warn(
            '⚠️ No se recibió personaje para colocar el arma.'
        );


        return null;

    }


    // ========================================================
    // LIMPIAR ARMA ANTERIOR
    // ========================================================

    detachWeapon();


    // ========================================================
    // NUEVA SOLICITUD
    // ========================================================

    loadRequestId++;


    const requestId =
        loadRequestId;


    // ========================================================
    // BUSCAR MANO
    // ========================================================

    rightHandBone =
        findRightHand(
            character
        );


    if (
        !rightHandBone
    ) {

        console.error(
            '❌ No se encontró mixamorig:RightHand.'
        );


        return null;

    }


    console.log(
        `🦴 Mano encontrada: ${rightHandBone.name}`
    );


    // ========================================================
    // ANCLA
    // ========================================================

    weaponAnchor =
        new THREE.Group();


    weaponAnchor.name =
        'SWATWeaponAnchor';


    // ========================================================
    // POSICIÓN
    // ========================================================

    weaponAnchor.position.copy(
        WEAPON_POSITION
    );


    // ========================================================
    // ROTACIÓN
    // ========================================================

    weaponAnchor.rotation.copy(
        WEAPON_ROTATION
    );


    // ========================================================
    // CONECTAR A MANO DERECHA
    // ========================================================

    rightHandBone.add(
        weaponAnchor
    );


    // ========================================================
    // COMPENSAR ESCALA
    // ========================================================

    compensateBoneScale(
        rightHandBone,
        weaponAnchor
    );


    // ========================================================
    // ROOT
    // ========================================================

    weaponRoot =
        new THREE.Group();


    weaponRoot.name =
        'SWATWeaponRoot';


    weaponRoot.position.set(
        0,
        0,
        0
    );


    weaponRoot.rotation.set(
        0,
        0,
        0
    );


    weaponAnchor.add(
        weaponRoot
    );


    // ========================================================
    // CARGAR MODELO
    // ========================================================

    loadWeaponModel(
        requestId
    );


    console.log(
        '🔗 WeaponAnchor conectado a RightHand'
    );


    return weaponRoot;

}


// ============================================================
// MOSTRAR / OCULTAR
// ============================================================

export function setWeaponVisible(
    visible
) {

    if (
        weaponAnchor
    ) {

        weaponAnchor.visible =
            Boolean(
                visible
            );

    }

}


// ============================================================
// SABER SI EXISTE
// ============================================================

export function hasWeapon() {

    return Boolean(
        weaponRoot &&
        weaponLoaded
    );

}


// ============================================================
// SABER SI CARGÓ
// ============================================================

export function isWeaponLoaded() {

    return weaponLoaded;

}


// ============================================================
// OBTENER ROOT DEL ARMA
// ============================================================

export function getWeaponObject() {

    return weaponRoot;

}


// ============================================================
// OBTENER MODELO
// ============================================================

export function getWeaponModel() {

    return weaponModel;

}


// ============================================================
// OBTENER MANO DERECHA
// ============================================================

export function getWeaponHandBone() {

    return rightHandBone;

}


// ============================================================
// POSICIÓN MUNDIAL DEL CAÑÓN
// ============================================================

export function getWeaponMuzzleWorldPosition(
    target =
        new THREE.Vector3()
) {

    if (
        !muzzlePoint
    ) {

        return null;

    }


    muzzlePoint.updateWorldMatrix(
        true,
        false
    );


    muzzlePoint.getWorldPosition(
        target
    );


    return target;

}


// ============================================================
// DIRECCIÓN MUNDIAL DEL CAÑÓN
// ============================================================

export function getWeaponMuzzleDirection(
    target =
        new THREE.Vector3()
) {

    if (
        !muzzlePoint
    ) {

        return null;

    }


    muzzlePoint.getWorldQuaternion(
        tempQuaternion
    );


    // ========================================================
    // FRENTE DEL ARMA = -Z
    // ========================================================

    target.set(
        0,
        0,
        -1
    );


    target.applyQuaternion(
        tempQuaternion
    );


    target.normalize();


    return target;

}


// ============================================================
// ELIMINAR ARMA
// ============================================================

export function detachWeapon() {

    // ========================================================
    // INVALIDAR CARGA PENDIENTE
    // ========================================================

    loadRequestId++;


    // ========================================================
    // ELIMINAR ANCLA
    // ========================================================

    if (
        weaponAnchor &&
        weaponAnchor.parent
    ) {

        weaponAnchor.parent.remove(
            weaponAnchor
        );

    }


    weaponAnchor =
        null;


    weaponRoot =
        null;


    weaponModel =
        null;


    muzzlePoint =
        null;


    rightHandBone =
        null;


    weaponLoaded =
        false;

}