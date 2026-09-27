// ============================================================
// ESTADOS DEL JUEGO
// ============================================================

export const GAME_STATES = {
    START:
        'INICIO',

    PLAYING:
        'JUGANDO',

    VICTORY:
        'VICTORIA',

    DEFEAT:
        'DERROTA'
};


// ============================================================
// CONFIGURACIÓN
// ============================================================

const GAME_DURATION =
    120;

const TOTAL_OBJECTIVES =
    8;

const POINTS_PER_OBJECTIVE =
    500;


// ============================================================
// ESTADO
// ============================================================

let gameState =
    GAME_STATES.START;

let score =
    0;

let destroyedObjectives =
    0;

let remainingTime =
    GAME_DURATION;


// ============================================================
// INICIAR PARTIDA
// ============================================================

export function startGame() {

    gameState =
        GAME_STATES.PLAYING;


    score =
        0;


    destroyedObjectives =
        0;


    remainingTime =
        GAME_DURATION;


    console.log(
        '🎮 Estado del juego:',
        gameState
    );

}


// ============================================================
// ACTUALIZAR
// ============================================================

export function updateGame(
    delta
) {

    if (
        gameState !==
        GAME_STATES.PLAYING
    ) {

        return;

    }


    remainingTime -=
        delta;


    if (
        remainingTime <=
        0
    ) {

        remainingTime =
            0;


        if (
            destroyedObjectives <
            TOTAL_OBJECTIVES
        ) {

            gameState =
                GAME_STATES.DEFEAT;


            console.log(
                '❌ MISIÓN FALLIDA'
            );


            console.log(
                `⚡ Núcleos destruidos: ${destroyedObjectives}/${TOTAL_OBJECTIVES}`
            );

        }

    }

}


// ============================================================
// REGISTRAR OBJETIVO
// ============================================================

export function registerObjectiveDestroyed() {

    if (
        gameState !==
        GAME_STATES.PLAYING
    ) {

        return false;

    }


    if (
        destroyedObjectives >=
        TOTAL_OBJECTIVES
    ) {

        return false;

    }


    destroyedObjectives++;


    score +=
        POINTS_PER_OBJECTIVE;


    console.log(
        `⚡ Objetivos: ${destroyedObjectives}/${TOTAL_OBJECTIVES}`
    );


    console.log(
        `⭐ Puntos: ${score}`
    );


    if (
        destroyedObjectives >=
        TOTAL_OBJECTIVES
    ) {

        destroyedObjectives =
            TOTAL_OBJECTIVES;


        gameState =
            GAME_STATES.VICTORY;


        console.log(
            '🏆 MISIÓN COMPLETADA'
        );


        console.log(
            `⏱️ Tiempo restante: ${remainingTime.toFixed(1)} segundos`
        );

    }


    return true;

}


// ============================================================
// GETTERS
// ============================================================

export function getGameState() {

    return gameState;

}


export function setGameState(
    newState
) {

    gameState =
        newState;

}


export function getScore() {

    return score;

}


export function getObjectives() {

    return {
        destroyed:
            destroyedObjectives,

        total:
            TOTAL_OBJECTIVES
    };

}


export function getRemainingTime() {

    return remainingTime;

}