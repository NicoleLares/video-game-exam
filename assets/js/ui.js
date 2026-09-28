import {
    GAME_STATES
} from './game.js';


// ============================================================
// OPERATION IMPACT
// UI.JS
// VERSION 8.0.0
// ============================================================


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
// ELEMENTOS DE PANTALLA
// ============================================================

const screenTag =
    document.getElementById(
        'screen-tag'
    );

const screenTitle =
    document.getElementById(
        'screen-title'
    );

const gameDescription =
    document.getElementById(
        'game-description'
    );

const missionBox =
    document.getElementById(
        'mission-box'
    );

const resultSummary =
    document.getElementById(
        'result-summary'
    );

const resultObjectives =
    document.getElementById(
        'result-objectives'
    );

const resultScore =
    document.getElementById(
        'result-score'
    );

const resultTime =
    document.getElementById(
        'result-time'
    );

const versionElement =
    document.querySelector(
        '.version'
    );


// ============================================================
// ESTADO INTERNO DE UI
// ============================================================

let currentState =
    GAME_STATES.START;

let previousState =
    null;

let currentScore =
    0;

let currentDestroyed =
    0;

let currentTotal =
    8;

let currentSeconds =
    120;

let startButtonConfigured =
    false;


// ============================================================
// FORMATEAR TIEMPO
// ============================================================

function formatTime(
    seconds
) {

    const safeSeconds =
        Math.max(
            0,
            seconds
        );


    const minutes =
        Math.floor(
            safeSeconds /
            60
        );


    const remainingSeconds =
        Math.floor(
            safeSeconds %
            60
        );


    return (
        `${String(minutes).padStart(2, '0')}:` +
        `${String(remainingSeconds).padStart(2, '0')}`
    );

}


// ============================================================
// CONTROL DE OVERLAY
// ============================================================

function setOverlayActive(
    active
) {

    document.body.classList.toggle(
        'game-screen-active',
        active
    );

}


// ============================================================
// LIBERAR MOUSE
// ============================================================

function releaseMouse() {

    if (
        document.pointerLockElement &&
        document.exitPointerLock
    ) {

        document.exitPointerLock();

    }

}


// ============================================================
// OCULTAR CROSSHAIR
// ============================================================

function hideCombatCrosshair() {

    if (
        !crosshair
    ) {

        return;

    }


    crosshair.classList.remove(
        'visible'
    );

    crosshair.classList.remove(
        'crosshair-visible'
    );

    crosshair.classList.remove(
        'crosshair-aiming'
    );

    crosshair.classList.remove(
        'crosshair-target'
    );

    crosshair.classList.remove(
        'crosshair-fire'
    );

}


// ============================================================
// MOSTRAR CROSSHAIR
// ============================================================

function showCombatCrosshair() {

    if (
        !crosshair
    ) {

        return;

    }


    crosshair.classList.add(
        'visible'
    );

    crosshair.classList.add(
        'crosshair-visible'
    );

}


// ============================================================
// ACTUALIZAR DATOS FINALES
// ============================================================

function updateResultStats() {

    if (
        resultObjectives
    ) {

        resultObjectives.textContent =
            `${currentDestroyed} / ${currentTotal}`;

    }


    if (
        resultScore
    ) {

        resultScore.textContent =
            String(
                currentScore
            ).padStart(
                4,
                '0'
            );

    }


    if (
        resultTime
    ) {

        resultTime.textContent =
            formatTime(
                currentSeconds
            );

    }

}


// ============================================================
// PANTALLA INICIAL
// ============================================================

function showInitialScreen() {

    if (
        !startScreen
    ) {

        return;

    }


    startScreen.classList.remove(
        'hidden'
    );

    startScreen.classList.remove(
        'screen-victory'
    );

    startScreen.classList.remove(
        'screen-defeat'
    );


    setOverlayActive(
        true
    );


    hideCombatCrosshair();


    if (
        screenTag
    ) {

        screenTag.textContent =
            'MISIÓN TÁCTICA';

    }


    if (
        screenTitle
    ) {

        screenTitle.innerHTML =
            'OPERATION <span>IMPACT</span>';

    }


    if (
        gameDescription
    ) {

        gameDescription.textContent =
            'Infiltra la instalación y destruye los núcleos de energía antes de que termine el tiempo.';

    }


    if (
        missionBox
    ) {

        missionBox.hidden =
            false;

    }


    if (
        resultSummary
    ) {

        resultSummary.hidden =
            true;

    }


    if (
        startButton
    ) {

        startButton.disabled =
            false;

        startButton.textContent =
            'INICIAR MISIÓN';

    }


    if (
        versionElement
    ) {

        versionElement.textContent =
            'VERSION 8.0.0 · OPERATION IMPACT';

    }

}


// ============================================================
// PANTALLA DE VICTORIA
// ============================================================

function showVictoryScreen() {

    if (
        !startScreen
    ) {

        return;

    }


    releaseMouse();


    hideCombatCrosshair();


    setOverlayActive(
        true
    );


    startScreen.classList.remove(
        'hidden'
    );

    startScreen.classList.remove(
        'screen-defeat'
    );

    startScreen.classList.add(
        'screen-victory'
    );


    if (
        screenTag
    ) {

        screenTag.textContent =
            'OPERACIÓN COMPLETADA';

    }


    if (
        screenTitle
    ) {

        screenTitle.innerHTML =
            'MISIÓN <span>CUMPLIDA</span>';

    }


    if (
        gameDescription
    ) {

        gameDescription.textContent =
            'Todos los núcleos de energía fueron destruidos. La operación ha sido completada con éxito.';

    }


    if (
        missionBox
    ) {

        missionBox.hidden =
            true;

    }


    if (
        resultSummary
    ) {

        resultSummary.hidden =
            false;

    }


    if (
        startButton
    ) {

        startButton.disabled =
            false;

        startButton.textContent =
            'JUGAR DE NUEVO';

    }


    updateResultStats();

}


// ============================================================
// PANTALLA DE DERROTA
// ============================================================

function showDefeatScreen() {

    if (
        !startScreen
    ) {

        return;

    }


    releaseMouse();


    hideCombatCrosshair();


    setOverlayActive(
        true
    );


    startScreen.classList.remove(
        'hidden'
    );

    startScreen.classList.remove(
        'screen-victory'
    );

    startScreen.classList.add(
        'screen-defeat'
    );


    if (
        screenTag
    ) {

        screenTag.textContent =
            'OPERACIÓN FALLIDA';

    }


    if (
        screenTitle
    ) {

        screenTitle.innerHTML =
            'MISIÓN <span>FALLIDA</span>';

    }


    if (
        gameDescription
    ) {

        gameDescription.textContent =
            'El tiempo de la operación se agotó antes de destruir todos los núcleos de energía.';

    }


    if (
        missionBox
    ) {

        missionBox.hidden =
            true;

    }


    if (
        resultSummary
    ) {

        resultSummary.hidden =
            false;

    }


    if (
        startButton
    ) {

        startButton.disabled =
            false;

        startButton.textContent =
            'REINTENTAR MISIÓN';

    }


    updateResultStats();

}


// ============================================================
// BOTÓN INICIAR / REINICIAR
// ============================================================

export function setupStartButton(
    callback
) {

    if (
        !startButton ||
        startButtonConfigured
    ) {

        return;

    }


    startButtonConfigured =
        true;


    startButton.addEventListener(
        'click',
        () => {

            // =================================================
            // OCULTAR PANTALLA
            // =================================================

            startScreen?.classList.add(
                'hidden'
            );


            startScreen?.classList.remove(
                'screen-victory'
            );


            startScreen?.classList.remove(
                'screen-defeat'
            );


            // =================================================
            // QUITAR OVERLAY
            // =================================================

            setOverlayActive(
                false
            );


            // =================================================
            // MOSTRAR MIRA
            // =================================================

            showCombatCrosshair();


            // =================================================
            // EJECUTAR CALLBACK DE MAIN.JS
            // =================================================

            if (
                callback
            ) {

                callback();

            }


            startButton.blur();

        }
    );

}


// ============================================================
// ESTADO
// ============================================================

export function updateGameStatus(
    state
) {

    currentState =
        state;


    if (
        gameStatus
    ) {

        gameStatus.textContent =
            state;

    }


    // ========================================================
    // SOLO EJECUTAR CAMBIO DE PANTALLA
    // CUANDO CAMBIA EL ESTADO
    // ========================================================

    if (
        state ===
            previousState
    ) {

        return;

    }


    previousState =
        state;


    // ========================================================
    // VICTORIA
    // ========================================================

    if (
        state ===
        GAME_STATES.VICTORY
    ) {

        showVictoryScreen();

        return;

    }


    // ========================================================
    // DERROTA
    // ========================================================

    if (
        state ===
        GAME_STATES.DEFEAT
    ) {

        showDefeatScreen();

        return;

    }

}


// ============================================================
// PUNTUACIÓN
// ============================================================

export function updateScore(
    score
) {

    currentScore =
        score;


    if (
        scoreElement
    ) {

        scoreElement.textContent =
            String(
                score
            ).padStart(
                4,
                '0'
            );

    }


    if (
        currentState ===
            GAME_STATES.VICTORY ||
        currentState ===
            GAME_STATES.DEFEAT
    ) {

        updateResultStats();

    }

}


// ============================================================
// OBJETIVOS
// ============================================================

export function updateObjectives(
    destroyed,
    total
) {

    currentDestroyed =
        destroyed;

    currentTotal =
        total;


    if (
        objectiveCounter
    ) {

        objectiveCounter.textContent =
            `${destroyed} / ${total}`;

    }


    if (
        currentState ===
            GAME_STATES.VICTORY ||
        currentState ===
            GAME_STATES.DEFEAT
    ) {

        updateResultStats();

    }

}


// ============================================================
// CRONÓMETRO
// ============================================================

export function updateTimer(
    seconds
) {

    currentSeconds =
        Math.max(
            0,
            seconds
        );


    if (
        timerElement
    ) {

        timerElement.textContent =
            formatTime(
                currentSeconds
            );

    }


    if (
        currentState ===
            GAME_STATES.VICTORY ||
        currentState ===
            GAME_STATES.DEFEAT
    ) {

        updateResultStats();

    }

}


// ============================================================
// REINICIAR INTERFAZ
// ============================================================

export function resetUI() {

    currentState =
        GAME_STATES.START;

    previousState =
        GAME_STATES.START;

    currentScore =
        0;

    currentDestroyed =
        0;

    currentTotal =
        8;

    currentSeconds =
        120;


    if (
        gameStatus
    ) {

        gameStatus.textContent =
            GAME_STATES.START;

    }


    updateScore(
        0
    );


    updateObjectives(
        0,
        8
    );


    updateTimer(
        120
    );


    showInitialScreen();

}