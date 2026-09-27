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
// ESCENARIO
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

const CHARACTER_RADIUS = 0.27;

const CHARACTER_HALF_HEIGHT = 0.405;

const CHARACTER_FOOT_OFFSET =
    CHARACTER_HALF_HEIGHT +
    CHARACTER_RADIUS;


// ============================================================
// GRAVEDAD DEL PERSONAJE
// ============================================================

let verticalVelocity = 0;


// ============================================================
// TEMPORALES
// ============================================================

const tempVertex =
    new THREE.Vector3();


// ============================================================
// INICIALIZAR RAPIER
// ============================================================

export async function initPhysics() {

    if (physicsReady) {
        return;
    }

    console.log(
        '⚙️ Inicializando Rapier...'
    );

    await RAPIER.init();

    physicsWorld =
        new RAPIER.World({
            x: 0,
            y: GRAVITY,
            z: 0
        });

    physicsReady = true;

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
// CREAR COLLIDER ESTÁTICO
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

    mesh.updateWorldMatrix(
        true,
        false
    );

    const geometry =
        mesh.geometry;

    const positionAttribute =
        geometry.attributes.position;

    if (!positionAttribute) {

        console.warn(
            '⚠️ Malla sin posiciones:',
            mesh.name
        );

        return null;
    }


    // ========================================================
    // VÉRTICES
    // ========================================================

    const vertices =
        new Float32Array(
            positionAttribute.count * 3
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


    if (geometry.index) {

        const original =
            geometry.index.array;

        indices =
            new Uint32Array(
                original.length
            );

        for (
            let i = 0;
            i < original.length;
            i++
        ) {

            indices[i] =
                original[i];

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
    // BODY ESTÁTICO
    // ========================================================

    const bodyDesc =
        RAPIER.RigidBodyDesc.fixed();


    const body =
        physicsWorld.createRigidBody(
            bodyDesc
        );


    // ========================================================
    // TRIMESH
    // ========================================================

    const colliderDesc =
        RAPIER.ColliderDesc.trimesh(
            vertices,
            indices
        );


    colliderDesc.setFriction(
        0.9
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
        '🧱 Collider estático:',
        mesh.name
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

    if (!physicsWorld) {

        console.error(
            '❌ Rapier no está inicializado.'
        );

        return 0;
    }


    if (
        !Array.isArray(meshes) ||
        meshes.length === 0
    ) {

        console.warn(
            '⚠️ No existen Collision meshes.'
        );

        return 0;
    }


    let count = 0;


    meshes.forEach(
        (mesh) => {

            const result =
                createStaticMeshCollider(
                    mesh
                );

            if (result) {
                count++;
            }

        }
    );


    console.log(
        `✅ ${count} colliders del escenario creados`
    );


    return count;

}


// ============================================================
// CREAR PERSONAJE
// ============================================================

export function createCharacterPhysics(
    groundPosition
) {

    if (!physicsWorld) {

        console.error(
            '❌ Rapier no está inicializado.'
        );

        return;
    }


    // ========================================================
    // ELIMINAR BODY ANTERIOR
    // ========================================================

    if (characterBody) {

        physicsWorld.removeRigidBody(
            characterBody
        );

        characterBody = null;
        characterCollider = null;

    }


    if (characterController) {

        physicsWorld.removeCharacterController(
            characterController
        );

        characterController =
            null;

    }


    // ========================================================
    // BODY CINEMÁTICO
    // ========================================================

    const bodyDesc =
        RAPIER.RigidBodyDesc
            .kinematicPositionBased()
            .setTranslation(

                groundPosition.x,

                groundPosition.y +
                CHARACTER_FOOT_OFFSET,

                groundPosition.z

            );


    characterBody =
        physicsWorld.createRigidBody(
            bodyDesc
        );


    // ========================================================
    // CÁPSULA
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


    characterController.enableAutostep(
        0.22,
        0.12,
        true
    );


    characterController.enableSnapToGround(
        0.25
    );


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


    // Permite empujar objetos dinámicos.
    characterController
        .setApplyImpulsesToDynamicBodies(
            true
        );


    verticalVelocity =
        0;


    console.log(
        '🧍 Personaje físico creado'
    );

}


// ============================================================
// REPOSICIONAR PERSONAJE
// ============================================================

export function setCharacterPhysicsPosition(
    groundPosition
) {

    if (!characterBody) {
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
    // MOVIMIENTO
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


    characterController
        .computeColliderMovement(
            characterCollider,
            desiredMovement
        );


    const correctedMovement =
        characterController
            .computedMovement();


    const current =
        characterBody.translation();


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


    characterBody
        .setNextKinematicTranslation(
            next
        );


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
// ACTUALIZAR MUNDO FÍSICO
// ============================================================

export function updatePhysics(
    delta
) {

    if (!physicsWorld) {
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