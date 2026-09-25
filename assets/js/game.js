// ============================================================
// ESTADOS DEL JUEGO
// ============================================================

export const GAME_STATES = {
    START: 'INICIO',
    PLAYING: 'JUGANDO',
    VICTORY: 'VICTORIA',
    DEFEAT: 'DERROTA'
};


// ============================================================
// VARIABLES GENERALES
// ============================================================

let currentState = GAME_STATES.START;

let score = 0;

let destroyedObjectives = 0;

const totalObjectives = 8;


// ============================================================
// OBTENER ESTADO
// ============================================================

export function getGameState() {
    return currentState;
}


// ============================================================
// CAMBIAR ESTADO
// ============================================================

export function setGameState(newState) {

    currentState = newState;

    console.log(
        `🎮 Estado del juego: ${currentState}`
    );

}


// ============================================================
// INICIAR PARTIDA
// ============================================================

export function startGame() {

    score = 0;

    destroyedObjectives = 0;

    setGameState(
        GAME_STATES.PLAYING
    );

}


// ============================================================
// OBTENER PUNTUACIÓN
// ============================================================

export function getScore() {
    return score;
}


// ============================================================
// OBTENER OBJETIVOS
// ============================================================

export function getObjectives() {

    return {
        destroyed: destroyedObjectives,
        total: totalObjectives
    };

}


// ============================================================
// ACTUALIZACIÓN
// ============================================================

export function updateGame() {

    if (
        currentState !==
        GAME_STATES.PLAYING
    ) {
        return;
    }

    /*
        En versiones posteriores:

        - cronómetro
        - puntuación
        - objetivos
        - victoria
        - derrota
        - reinicio
    */

}