import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';


// ============================================================
// MUNDO FÍSICO
// ============================================================

let physicsWorld = null;

let physicsReady = false;


// ============================================================
// PERSONAJE
// ============================================================

let characterBody = null;

let characterCollider = null;

let characterController = null;


// ============================================================
// COLLIDERS DEL ESCENARIO
// ============================================================

const environmentBodies = [];

const environmentColliders = [];


// ============================================================
// CONFIGURACIÓN
// ============================================================

const GRAVITY = -9.81;


// ============================================================
// CÁPSULA DEL PERSONAJE
// ============================================================
//
// Personaje visual:
// aproximadamente 1.35 unidades.
//
// Rapier define la cápsula mediante:
//
// halfHeight = parte cilíndrica / 2
// radius     = extremos redondeados
//
// Altura total:
//
// halfHeight * 2 + radius * 2
//
// 0.405 * 2 + 0.27 * 2 = 1.35
//
// ============================================================

const CHARACTER_RADIUS = 0.27;

const CHARACTER_HALF_HEIGHT = 0.405;

const CHARACTER_FOOT_OFFSET =
    CHARACTER_HALF_HEIGHT +
    CHARACTER_RADIUS;


// ============================================================
// MOVIMIENTO VERTICAL
// ============================================================

let verticalVelocity = 0;


// ============================================================
// TEMPORALES THREE.JS
// ============================================================

const tempVertex =
    new THREE.Vector3();


// ============================================================
// INICIALIZAR RAPIER
// ============================================================

export async function initPhysics() {

    if (
        physicsReady
    ) {

        return;

    }


    console.log(
        '⚙️ Inicializando Rapier...'
    );


    await RAPIER.init();


    // ========================================================
    // CREAR MUNDO
    // ========================================================

    physicsWorld =
        new RAPIER.World({
            x: 0,
            y: GRAVITY,
            z: 0
        });


    physicsReady =
        true;


    console.log(
        '✅ Rapier inicializado'
    );

}


// ============================================================
// OBTENER MUNDO
// ============================================================

export function getPhysicsWorld() {

    return physicsWorld;

}


// ============================================================
// ESTADO
// ============================================================

export function isPhysicsReady() {

    return physicsReady;

}


// ============================================================
// CREAR COLLIDER ESTÁTICO DESDE UNA MALLA THREE.JS
// ============================================================

export function createStaticMeshCollider(
    mesh
) {

    if (
        !physicsWorld ||
        !mesh ||
        !mesh.geometry
    ) {

        return null;

    }


    // ========================================================
    // MATRIZ GLOBAL
    // ========================================================

    mesh.updateWorldMatrix(
        true,
        false
    );


    const geometry =
        mesh.geometry;


    const positionAttribute =
        geometry.attributes.position;


    if (
        !positionAttribute
    ) {

        console.warn(
            '⚠️ Malla sin atributo position:',
            mesh.name
        );


        return null;

    }


    // ========================================================
    // VÉRTICES
    // ========================================================

    const vertices =
        new Float32Array(
            positionAttribute.count *
            3
        );


    for (
        let i = 0;
        i < positionAttribute.count;
        i++
    ) {

        tempVertex.fromBufferAttribute(
            positionAttribute,
            i
        );


        // Convertimos coordenadas locales
        // a coordenadas globales.
        tempVertex.applyMatrix4(
            mesh.matrixWorld
        );


        const index =
            i * 3;


        vertices[index] =
            tempVertex.x;


        vertices[index + 1] =
            tempVertex.y;


        vertices[index + 2] =
            tempVertex.z;

    }


    // ========================================================
    // ÍNDICES
    // ========================================================

    let indices;


    if (
        geometry.index
    ) {

        const originalIndices =
            geometry.index.array;


        indices =
            new Uint32Array(
                originalIndices.length
            );


        for (
            let i = 0;
            i < originalIndices.length;
            i++
        ) {

            indices[i] =
                originalIndices[i];

        }

    } else {

        indices =
            new Uint32Array(
                positionAttribute.count
            );


        for (
            let i = 0;
            i < positionAttribute.count;
            i++
        ) {

            indices[i] =
                i;

        }

    }


    // ========================================================
    // RIGID BODY FIJO
    // ========================================================

    const bodyDesc =
        RAPIER.RigidBodyDesc.fixed();


    const body =
        physicsWorld.createRigidBody(
            bodyDesc
        );


    // ========================================================
    // TRIMESH COLLIDER
    // ========================================================

    const colliderDesc =
        RAPIER.ColliderDesc.trimesh(
            vertices,
            indices
        );


    colliderDesc.setFriction(
        0.8
    );


    colliderDesc.setRestitution(
        0
    );


    const collider =
        physicsWorld.createCollider(
            colliderDesc,
            body
        );


    environmentBodies.push(
        body
    );


    environmentColliders.push(
        collider
    );


    console.log(
        `🧱 Collider: ${mesh.name || 'sin nombre'}`
    );


    return {
        body,
        collider
    };

}


// ============================================================
// CREAR COLLIDERS DEL ESCENARIO
// ============================================================

export function createEnvironmentColliders(
    meshes
) {

    if (
        !physicsWorld
    ) {

        console.error(
            '❌ No existe physicsWorld.'
        );


        return 0;

    }


    if (
        !Array.isArray(
            meshes
        ) ||
        meshes.length === 0
    ) {

        console.warn(
            '⚠️ No se encontraron mallas Collision.'
        );


        return 0;

    }


    let created =
        0;


    meshes.forEach(
        (mesh) => {

            const result =
                createStaticMeshCollider(
                    mesh
                );


            if (
                result
            ) {

                created++;

            }

        }
    );


    console.log(
        `✅ Colliders del escenario: ${created}`
    );


    return created;

}


// ============================================================
// CREAR PERSONAJE FÍSICO
// ============================================================

export function createCharacterPhysics(
    groundPosition
) {

    if (
        !physicsWorld
    ) {

        console.error(
            '❌ Rapier todavía no está inicializado.'
        );


        return;

    }


    // ========================================================
    // ELIMINAR PERSONAJE ANTERIOR
    // ========================================================

    if (
        characterBody
    ) {

        physicsWorld.removeRigidBody(
            characterBody
        );


        characterBody =
            null;


        characterCollider =
            null;

    }


    if (
        characterController
    ) {

        physicsWorld.removeCharacterController(
            characterController
        );


        characterController =
            null;

    }


    // ========================================================
    // POSICIÓN CENTRAL DE LA CÁPSULA
    // ========================================================

    const centerY =
        groundPosition.y +
        CHARACTER_FOOT_OFFSET;


    // ========================================================
    // RIGID BODY CINEMÁTICO
    // ========================================================

    const bodyDesc =
        RAPIER.RigidBodyDesc
            .kinematicPositionBased()
            .setTranslation(
                groundPosition.x,
                centerY,
                groundPosition.z
            );


    characterBody =
        physicsWorld.createRigidBody(
            bodyDesc
        );


    // ========================================================
    // COLLIDER CÁPSULA
    // ========================================================

    const colliderDesc =
        RAPIER.ColliderDesc.capsule(
            CHARACTER_HALF_HEIGHT,
            CHARACTER_RADIUS
        );


    colliderDesc.setFriction(
        0
    );


    colliderDesc.setRestitution(
        0
    );


    characterCollider =
        physicsWorld.createCollider(
            colliderDesc,
            characterBody
        );


    // ========================================================
    // CHARACTER CONTROLLER
    // ========================================================

    characterController =
        physicsWorld.createCharacterController(
            0.02
        );


    // ========================================================
    // SUBIR PEQUEÑOS ESCALONES
    // ========================================================

    characterController.enableAutostep(
        0.22,
        0.12,
        true
    );


    // ========================================================
    // PEGARSE AL SUELO
    // ========================================================

    characterController.enableSnapToGround(
        0.25
    );


    // ========================================================
    // PENDIENTES
    // ========================================================

    characterController.setMaxSlopeClimbAngle(
        THREE.MathUtils.degToRad(
            50
        )
    );


    characterController.setMinSlopeSlideAngle(
        THREE.MathUtils.degToRad(
            55
        )
    );


    // ========================================================
    // OBJETOS DINÁMICOS
    // ========================================================
    //
    // Nos servirá más adelante en v0.5.
    //

    characterController
        .setApplyImpulsesToDynamicBodies(
            true
        );


    verticalVelocity =
        0;


    console.log(
        '🧍 Personaje físico creado'
    );


    console.log(
        '📏 Capsule radius:',
        CHARACTER_RADIUS
    );


    console.log(
        '📏 Capsule halfHeight:',
        CHARACTER_HALF_HEIGHT
    );

}


// ============================================================
// REPOSICIONAR PERSONAJE
// ============================================================

export function setCharacterPhysicsPosition(
    groundPosition
) {

    if (
        !characterBody
    ) {

        return;

    }


    const position = {

        x:
            groundPosition.x,

        y:
            groundPosition.y +
            CHARACTER_FOOT_OFFSET,

        z:
            groundPosition.z

    };


    characterBody.setTranslation(
        position,
        true
    );


    characterBody
        .setNextKinematicTranslation(
            position
        );


    verticalVelocity =
        0;

}


// ============================================================
// MOVER PERSONAJE
// ============================================================
//
// horizontalMovement YA debe venir multiplicado
// por velocidad y delta.
//
// Ejemplo:
//
// {
//     x: direction.x * speed * delta,
//     z: direction.z * speed * delta
// }
//
// ============================================================

export function moveCharacter(
    horizontalMovement,
    delta
) {

    if (
        !characterBody ||
        !characterCollider ||
        !characterController
    ) {

        return null;

    }


    // ========================================================
    // GRAVEDAD
    // ========================================================

    verticalVelocity +=
        GRAVITY *
        delta;


    verticalVelocity =
        Math.max(
            verticalVelocity,
            -20
        );


    // ========================================================
    // MOVIMIENTO DESEADO
    // ========================================================

    const desiredMovement = {

        x:
            horizontalMovement.x,

        y:
            verticalVelocity *
            delta,

        z:
            horizontalMovement.z

    };


    // ========================================================
    // CHARACTER CONTROLLER
    // ========================================================

    characterController
        .computeColliderMovement(
            characterCollider,
            desiredMovement
        );


    // ========================================================
    // MOVIMIENTO PERMITIDO
    // ========================================================

    const correctedMovement =
        characterController
            .computedMovement();


    // ========================================================
    // POSICIÓN ACTUAL
    // ========================================================

    const current =
        characterBody.translation();


    // ========================================================
    // NUEVA POSICIÓN
    // ========================================================

    const next = {

        x:
            current.x +
            correctedMovement.x,

        y:
            current.y +
            correctedMovement.y,

        z:
            current.z +
            correctedMovement.z

    };


    // ========================================================
    // ACTUALIZAR BODY
    // ========================================================

    characterBody
        .setNextKinematicTranslation(
            next
        );


    // ========================================================
    // DETECTAR SUELO
    // ========================================================

    const grounded =
        characterController
            .computedGrounded();


    if (
        grounded &&
        verticalVelocity < 0
    ) {

        verticalVelocity =
            0;

    }


    // ========================================================
    // POSICIÓN VISUAL = PIES
    // ========================================================

    return {

        x:
            next.x,

        y:
            next.y -
            CHARACTER_FOOT_OFFSET,

        z:
            next.z,

        grounded

    };

}


// ============================================================
// OBTENER POSICIÓN DEL PERSONAJE
// ============================================================

export function getCharacterGroundPosition() {

    if (
        !characterBody
    ) {

        return null;

    }


    const position =
        characterBody.translation();


    return {

        x:
            position.x,

        y:
            position.y -
            CHARACTER_FOOT_OFFSET,

        z:
            position.z

    };

}


// ============================================================
// ACTUALIZAR MUNDO
// ============================================================

export function updatePhysics(
    delta
) {

    if (
        !physicsWorld
    ) {

        return;

    }


    physicsWorld.timestep =
        Math.min(
            delta,
            1 / 30
        );


    physicsWorld.step();

}


// ============================================================
// INFORMACIÓN
// ============================================================

export function getCharacterPhysicsInfo() {

    return {

        radius:
            CHARACTER_RADIUS,

        halfHeight:
            CHARACTER_HALF_HEIGHT,

        footOffset:
            CHARACTER_FOOT_OFFSET

    };

}