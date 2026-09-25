import {
    GAME_STATES
} from './game.js';


// ============================================================
// ELEMENTOS HTML
// ============================================================

const startScreen =
    document.getElementById(
        'start-screen'
    );

const startButton =
    document.getElementById(
        'start-button'
    );

const gameStatus =
    document.getElementById(
        'game-status'
    );

const scoreElement =
    document.getElementById(
        'score'
    );

const objectiveCounter =
    document.getElementById(
        'objective-counter'
    );

const timerElement =
    document.getElementById(
        'timer'
    );

const crosshair =
    document.getElementById(
        'crosshair'
    );


// ============================================================
// BOTÓN INICIAR
// ============================================================

export function setupStartButton(
    callback
) {

    startButton.addEventListener(
        'click',
        () => {

            startScreen.classList.add(
                'hidden'
            );

            crosshair.classList.add(
                'visible'
            );

            if (callback) {
                callback();
            }

        }
    );

}


// ============================================================
// ESTADO
// ============================================================

export function updateGameStatus(
    state
) {

    gameStatus.textContent =
        state;

}


// ============================================================
// PUNTUACIÓN
// ============================================================

export function updateScore(
    score
) {

    scoreElement.textContent =
        String(score).padStart(
            4,
            '0'
        );

}


// ============================================================
// OBJETIVOS
// ============================================================

export function updateObjectives(
    destroyed,
    total
) {

    objectiveCounter.textContent =
        `${destroyed} / ${total}`;

}


// ============================================================
// CRONÓMETRO
// ============================================================

export function updateTimer(
    seconds
) {

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remainingSeconds =
        Math.floor(
            seconds % 60
        );

    timerElement.textContent =
        `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

}


// ============================================================
// REINICIAR INTERFAZ
// ============================================================

export function resetUI() {

    updateGameStatus(
        GAME_STATES.START
    );

    updateScore(0);

    updateObjectives(
        0,
        8
    );

    updateTimer(
        120
    );

}