import * as THREE from 'three';

import RAPIER from '@dimforge/rapier3d-compat';

import {
    getPhysicsWorld
} from './physics.js';


// ============================================================
// OPERATION IMPACT
// OBJECTS.JS
// FIGURAS PESADAS + VIDA + DESTRUCCIÓN
// ============================================================


// ============================================================
// VIDA
// ============================================================

const DEFAULT_OBJECT_HEALTH =
    100;


// ============================================================
// PESO / DENSIDAD
// ============================================================
//
// Valores mayores = objetos más pesados.
//
// Antes estaban aproximadamente entre 0.8 y 1.5.
// Ahora son bastante más pesados.
//

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
//
// Evita que los objetos sigan deslizándose
// o girando durante demasiado tiempo.
//

const LINEAR_DAMPING =
    0.65;

const ANGULAR_DAMPING =
    0.90;


// ============================================================
// OBJETOS DINÁMICOS
// ============================================================

const dynamicObjects =
    [];


// ============================================================
// GRUPO VISUAL
// ============================================================

let objectsGroup =
    null;


// ============================================================
// ESTADOS INICIALES
// ============================================================

const initialStates =
    [];


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
// CREAR BODY DINÁMICO PESADO
// ============================================================

function createHeavyRigidBody(
    world,
    x,
    y,
    z
) {

    const bodyDesc =
        RAPIER.RigidBodyDesc
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


    const body =
        world.createRigidBody(
            bodyDesc
        );


    return body;

}


// ============================================================
// INICIALIZAR
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

        return;

    }


    // ========================================================
    // LIMPIAR ARRAYS
    // ========================================================

    dynamicObjects.length =
        0;


    initialStates.length =
        0;


    // ========================================================
    // GRUPO
    // ========================================================

    if (
        objectsGroup &&
        objectsGroup.parent
    ) {

        objectsGroup.parent.remove(
            objectsGroup
        );

    }


    objectsGroup =
        new THREE.Group();


    objectsGroup.name =
        'DynamicObjects';


    scene.add(
        objectsGroup
    );


    // ========================================================
    // CAJAS
    // ========================================================

    createBox({

        x:
            -2.5,

        z:
            7.0,

        width:
            0.65,

        height:
            0.65,

        depth:
            0.65,

        groundY:
            getGroundHeight(
                -2.5,
                7.0
            )

    });


    createBox({

        x:
            -1.5,

        z:
            6.5,

        width:
            0.8,

        height:
            0.55,

        depth:
            0.7,

        groundY:
            getGroundHeight(
                -1.5,
                6.5
            )

    });


    // ========================================================
    // ESFERAS
    // ========================================================

    createSphere({

        x:
            2.4,

        z:
            7.2,

        radius:
            0.4,

        groundY:
            getGroundHeight(
                2.4,
                7.2
            )

    });


    createSphere({

        x:
            3.2,

        z:
            6.2,

        radius:
            0.3,

        groundY:
            getGroundHeight(
                3.2,
                6.2
            )

    });


    // ========================================================
    // CILINDROS
    // ========================================================

    createCylinder({

        x:
            3.0,

        z:
            9.0,

        radius:
            0.35,

        height:
            0.9,

        groundY:
            getGroundHeight(
                3.0,
                9.0
            )

    });


    createCylinder({

        x:
            4.0,

        z:
            8.0,

        radius:
            0.3,

        height:
            0.8,

        groundY:
            getGroundHeight(
                4.0,
                8.0
            )

    });


    // ========================================================
    // CONOS
    // ========================================================

    createCone({

        x:
            -3.5,

        z:
            9.0,

        radius:
            0.35,

        height:
            0.8,

        groundY:
            getGroundHeight(
                -3.5,
                9.0
            )

    });


    createCone({

        x:
            -4.0,

        z:
            7.5,

        radius:
            0.3,

        height:
            0.7,

        groundY:
            getGroundHeight(
                -4.0,
                7.5
            )

    });


    // ========================================================
    // TORRE DERRIBABLE
    // ========================================================

    createTower(
        getGroundHeight
    );


    console.log(
        '✅ Objetos dinámicos pesados creados:',
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

}


// ============================================================
// REGISTRAR OBJETO
// ============================================================

function registerDynamicObject(
    mesh,
    body,
    type = 'object'
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


    // ========================================================
    // GUARDAR POSICIÓN ORIGINAL
    // ========================================================

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

    groundY,

    material =
    boxMaterial

}) {

    const world =
        getPhysicsWorld();


    if (
        !world
    ) {

        return null;

    }


    const safeGround =
        Number.isFinite(
            groundY
        )
            ?
            groundY
            :
            0;


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

            material.clone()
        );


    mesh.castShadow =
        true;


    mesh.receiveShadow =
        true;


    const y =
        safeGround +
        height / 2 +
        0.05;


    mesh.position.set(
        x,
        y,
        z
    );


    objectsGroup.add(
        mesh
    );


    // ========================================================
    // RAPIER BODY
    // ========================================================

    const body =
        createHeavyRigidBody(
            world,
            x,
            y,
            z
        );


    // ========================================================
    // COLLIDER
    // ========================================================

    const colliderDesc =
        RAPIER.ColliderDesc.cuboid(

            width / 2,

            height / 2,

            depth / 2

        );


    colliderDesc.setDensity(
        BOX_DENSITY
    );


    colliderDesc.setFriction(
        0.90
    );


    colliderDesc.setRestitution(
        0.03
    );


    world.createCollider(
        colliderDesc,
        body
    );


    // ========================================================
    // REGISTRAR
    // ========================================================

    return registerDynamicObject(
        mesh,
        body,
        'box'
    );

}


// ============================================================
// CREAR ESFERA
// ============================================================

function createSphere({

    x,
    z,

    radius,

    groundY

}) {

    const world =
        getPhysicsWorld();


    if (
        !world
    ) {

        return null;

    }


    const safeGround =
        Number.isFinite(
            groundY
        )
            ?
            groundY
            :
            0;


    // ========================================================
    // THREE.JS
    // ========================================================

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
        safeGround +
        radius +
        0.1;


    mesh.position.set(
        x,
        y,
        z
    );


    objectsGroup.add(
        mesh
    );


    // ========================================================
    // BODY
    // ========================================================

    const body =
        createHeavyRigidBody(
            world,
            x,
            y,
            z
        );


    // ========================================================
    // COLLIDER
    // ========================================================

    const colliderDesc =
        RAPIER.ColliderDesc.ball(
            radius
        );


    colliderDesc.setDensity(
        SPHERE_DENSITY
    );


    // Más fricción para que no rueden eternamente.
    colliderDesc.setFriction(
        0.65
    );


    // Antes rebotaban mucho.
    // Ahora se sienten más pesadas.
    colliderDesc.setRestitution(
        0.18
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

    groundY

}) {

    const world =
        getPhysicsWorld();


    if (
        !world
    ) {

        return null;

    }


    const safeGround =
        Number.isFinite(
            groundY
        )
            ?
            groundY
            :
            0;


    // ========================================================
    // THREE.JS
    // ========================================================

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
        safeGround +
        height / 2 +
        0.05;


    mesh.position.set(
        x,
        y,
        z
    );


    objectsGroup.add(
        mesh
    );


    // ========================================================
    // BODY
    // ========================================================

    const body =
        createHeavyRigidBody(
            world,
            x,
            y,
            z
        );


    // ========================================================
    // COLLIDER
    // ========================================================

    const colliderDesc =
        RAPIER.ColliderDesc.cylinder(
            height / 2,
            radius
        );


    colliderDesc.setDensity(
        CYLINDER_DENSITY
    );


    colliderDesc.setFriction(
        0.85
    );


    colliderDesc.setRestitution(
        0.06
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

    groundY

}) {

    const world =
        getPhysicsWorld();


    if (
        !world
    ) {

        return null;

    }


    const safeGround =
        Number.isFinite(
            groundY
        )
            ?
            groundY
            :
            0;


    // ========================================================
    // THREE.JS
    // ========================================================

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
        safeGround +
        height / 2 +
        0.05;


    mesh.position.set(
        x,
        y,
        z
    );


    objectsGroup.add(
        mesh
    );


    // ========================================================
    // BODY
    // ========================================================

    const body =
        createHeavyRigidBody(
            world,
            x,
            y,
            z
        );


    // ========================================================
    // COLLIDER
    // ========================================================

    const colliderDesc =
        RAPIER.ColliderDesc.cone(
            height / 2,
            radius
        );


    colliderDesc.setDensity(
        CONE_DENSITY
    );


    colliderDesc.setFriction(
        0.85
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
        'cone'
    );

}


// ============================================================
// TORRE DERRIBABLE
// ============================================================

function createTower(
    getGroundHeight
) {

    const startX =
        0.8;


    const startZ =
        4.0;


    const ground =
        getGroundHeight(
            startX,
            startZ
        );


    const safeGround =
        Number.isFinite(
            ground
        )
            ?
            ground
            :
            0;


    const width =
        0.55;


    const height =
        0.38;


    const depth =
        0.55;


    const rows =
        4;


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
                0.6;


            const y =
                safeGround +
                height / 2 +
                row *
                (
                    height +
                    0.015
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


    if (
        !world
    ) {

        return null;

    }


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

            towerMaterial.clone()
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
    // BODY
    // ========================================================

    const body =
        createHeavyRigidBody(
            world,
            x,
            y,
            z
        );


    // ========================================================
    // COLLIDER
    // ========================================================

    const colliderDesc =
        RAPIER.ColliderDesc.cuboid(

            width / 2,

            height / 2,

            depth / 2

        );


    colliderDesc.setDensity(
        TOWER_DENSITY
    );


    colliderDesc.setFriction(
        0.95
    );


    colliderDesc.setRestitution(
        0.01
    );


    world.createCollider(
        colliderDesc,
        body
    );


    return registerDynamicObject(
        mesh,
        body,
        'tower'
    );

}


// ============================================================
// BUSCAR OBJETO POR MESH
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
    // YA ES EL OBJETO REGISTRADO
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

    return dynamicObjects.find(
        (object) =>
            object.mesh ===
            target
    ) || null;

}


// ============================================================
// HACER DAÑO
// ============================================================

export function damageDynamicObject(
    target,
    damage = 0
) {

    const object =
        findDynamicObject(
            target
        );


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
    // RESTAR VIDA
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
        `📦 Vida objeto: ${object.health}/${object.maxHealth}`
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
    // OCULTAR MODELO
    // ========================================================

    object.mesh.visible =
        false;


    // ========================================================
    // DETENER CUERPO
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
    // SACAR COLLIDER DEL MAPA
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
// ACTUALIZAR THREE.JS
// ============================================================

export function updateDynamicObjects() {

    dynamicObjects.forEach(
        (object) => {

            const {
                mesh,
                body,
                destroyed
            } =
                object;


            if (
                destroyed
            ) {

                return;

            }


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
            object,
            body,
            position,
            rotation
        }) => {

            // =================================================
            // VIDA
            // =================================================

            object.health =
                object.maxHealth;


            object.destroyed =
                false;


            // =================================================
            // VISIBILIDAD
            // =================================================

            object.mesh.visible =
                true;


            // =================================================
            // POSICIÓN
            // =================================================

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


            // =================================================
            // ROTACIÓN
            // =================================================

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


            // =================================================
            // VELOCIDAD
            // =================================================

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


            // =================================================
            // ROTACIÓN FÍSICA
            // =================================================

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


            // =================================================
            // SINCRONIZAR THREE
            // =================================================

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
    );


    console.log(
        '🔄 Objetos físicos reiniciados'
    );

}


// ============================================================
// OBTENER OBJETOS
// ============================================================

export function getDynamicObjects() {

    return dynamicObjects.filter(
        (object) =>
            !object.destroyed
    );

}