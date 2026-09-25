// ============================================================
// PHYSICS.JS
// ============================================================

let physicsWorld = null;


// ============================================================
// INICIALIZAR FÍSICA
// ============================================================

export async function initPhysics() {

    console.log(
        '⚙️ Módulo de física preparado.'
    );

    /*
        Rapier se integrará en la versión v0.4.

        Aquí tendremos:

        - gravedad
        - mundo físico
        - rigid bodies
        - colliders
        - personaje
        - objetos dinámicos
        - proyectiles
    */

}


// ============================================================
// OBTENER MUNDO FÍSICO
// ============================================================

export function getPhysicsWorld() {
    return physicsWorld;
}


// ============================================================
// ACTUALIZAR FÍSICA
// ============================================================

export function updatePhysics() {

    if (!physicsWorld) {
        return;
    }

    physicsWorld.step();

}