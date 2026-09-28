import {
    GAME_STATES,
    setGameState
} from './game.js';

import {
    setGrenadePower
} from './grenades.js';

import {
    getDynamicObjects
} from './objects.js';


// ============================================================
// OPERATION IMPACT
// UI.JS
// VERSION 11.0.0
// ============================================================


// ============================================================
// CONSTANTES
// ============================================================

const GAME_DURATION =
    120;

const RECORDS_KEY =
    'operation-impact-records-v1';

const OPERATOR_KEY =
    'operation-impact-operator';

const MAX_RECORDS =
    5;


// ============================================================
// ELEMENTOS PRINCIPALES
// ============================================================

const startScreen =
    document.getElementById(
        'start-screen'
    );

const startButton =
    document.getElementById(
        'start-button'
    );

const menuButton =
    document.getElementById(
        'menu-button'
    );

const restartMissionButton =
    document.getElementById(
        'restart-mission-button'
    );

const newGameButton =
    document.getElementById(
        'new-game-button'
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

const secondaryCounter =
    document.getElementById(
        'secondary-counter'
    );

const secondaryStatus =
    document.getElementById(
        'secondary-status'
    );

const timerElement =
    document.getElementById(
        'timer'
    );

const timerPanel =
    document.getElementById(
        'timer-panel'
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

const operatorPanel =
    document.getElementById(
        'operator-panel'
    );

const operatorInput =
    document.getElementById(
        'operator-name'
    );

const recordsPanel =
    document.getElementById(
        'records-panel'
    );

const recordsList =
    document.getElementById(
        'records-list'
    );

const menuPowerPanel =
    document.getElementById(
        'menu-power-panel'
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
// POTENCIA DE GRANADA
// ============================================================

const grenadePowerMenu =
    document.getElementById(
        'grenade-power-menu'
    );

const grenadePowerMenuValue =
    document.getElementById(
        'grenade-power-menu-value'
    );

const grenadePowerGame =
    document.getElementById(
        'grenade-power-game'
    );

const grenadePowerGameValue =
    document.getElementById(
        'grenade-power-game-value'
    );


// ============================================================
// ESTADO INTERNO
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
    GAME_DURATION;

let secondaryTotal =
    0;

let startButtonConfigured =
    false;

let grenadePowerConfigured =
    false;

let actionButtonsConfigured =
    false;

let recordsConfigured =
    false;

let missionStartCallback =
    null;


// ============================================================
// FORMATO DE TIEMPO
// ============================================================

function formatTime(
    seconds
) {

    const safe =
        Math.max(
            0,
            seconds
        );


    const minutes =
        Math.floor(
            safe /
            60
        );


    const remaining =
        Math.floor(
            safe %
            60
        );


    return (
        `${String(minutes).padStart(2, '0')}:` +
        `${String(remaining).padStart(2, '0')}`
    );

}


// ============================================================
// FORMATO DE RÉCORD
// ============================================================

function formatRecordTime(
    seconds
) {

    const safe =
        Math.max(
            0,
            seconds
        );


    const minutes =
        Math.floor(
            safe /
            60
        );


    const wholeSeconds =
        Math.floor(
            safe %
            60
        );


    const tenths =
        Math.floor(

            (
                safe -
                Math.floor(
                    safe
                )
            ) *
            10

        );


    return (
        `${String(minutes).padStart(2, '0')}:` +
        `${String(wholeSeconds).padStart(2, '0')}.` +
        `${tenths}`
    );

}


// ============================================================
// NORMALIZAR NOMBRE
// ============================================================

function normalizeOperatorName(
    value
) {

    const name =
        String(
            value ??
            ''
        )
            .trim()
            .replace(
                /\s+/g,
                ' '
            )
            .slice(
                0,
                18
            );


    return (
        name ||
        'OPERADOR'
    );

}


// ============================================================
// CARGAR RÉCORDS
// ============================================================

function loadRecords() {

    try {

        const raw =
            localStorage.getItem(
                RECORDS_KEY
            );


        if (
            !raw
        ) {

            return [];

        }


        const parsed =
            JSON.parse(
                raw
            );


        if (
            !Array.isArray(
                parsed
            )
        ) {

            return [];

        }


        return parsed

            .filter(
                (record) =>

                    record &&

                    typeof record.name ===
                        'string' &&

                    Number.isFinite(
                        Number(
                            record.time
                        )
                    )
            )

            .map(
                (record) => ({

                    name:
                        normalizeOperatorName(
                            record.name
                        ),

                    time:
                        Number(
                            record.time
                        )

                })
            )

            .sort(
                (a, b) =>
                    a.time -
                    b.time
            )

            .slice(
                0,
                MAX_RECORDS
            );


    } catch (
        error
    ) {

        console.warn(
            '⚠️ No fue posible leer los récords:',
            error
        );


        return [];

    }

}


// ============================================================
// GUARDAR RÉCORDS
// ============================================================

function saveRecords(
    records
) {

    try {

        localStorage.setItem(

            RECORDS_KEY,

            JSON.stringify(
                records
            )

        );


    } catch (
        error
    ) {

        console.warn(
            '⚠️ No fue posible guardar los récords:',
            error
        );

    }

}


// ============================================================
// OBTENER OPERADOR
// ============================================================

function getOperatorName() {

    return normalizeOperatorName(
        operatorInput?.value
    );

}


// ============================================================
// RECORDAR OPERADOR
// ============================================================

function rememberOperatorName() {

    if (
        !operatorInput
    ) {

        return;

    }


    const name =
        getOperatorName();


    operatorInput.value =
        name;


    try {

        localStorage.setItem(
            OPERATOR_KEY,
            name
        );


    } catch (
        error
    ) {

        console.warn(
            '⚠️ No fue posible guardar el operador:',
            error
        );

    }

}


// ============================================================
// MOSTRAR RÉCORDS
// ============================================================

function renderRecords() {

    if (
        !recordsList
    ) {

        return;

    }


    const records =
        loadRecords();


    recordsList.innerHTML =
        '';


    if (
        records.length ===
        0
    ) {

        const empty =
            document.createElement(
                'div'
            );


        empty.className =
            'record-empty';


        empty.textContent =
            'AÚN NO HAY RÉCORDS';


        recordsList.appendChild(
            empty
        );


        return;

    }


    records.forEach(

        (
            record,
            index
        ) => {

            const row =
                document.createElement(
                    'div'
                );


            row.className =
                'record-row';


            const position =
                document.createElement(
                    'span'
                );


            position.className =
                'record-position';


            position.textContent =
                `${index + 1}.`;


            const name =
                document.createElement(
                    'span'
                );


            name.className =
                'record-name';


            name.textContent =
                record.name;


            const time =
                document.createElement(
                    'strong'
                );


            time.className =
                'record-time';


            time.textContent =
                formatRecordTime(
                    record.time
                );


            row.append(
                position,
                name,
                time
            );


            recordsList.appendChild(
                row
            );

        }

    );

}


// ============================================================
// GUARDAR RÉCORD DE VICTORIA
// ============================================================

function saveVictoryRecord() {

    const elapsed =
        Math.max(

            0,

            GAME_DURATION -
            currentSeconds

        );


    const name =
        getOperatorName();


    const records =
        loadRecords();


    const existingIndex =
        records.findIndex(

            (record) =>

                record.name
                    .toLowerCase() ===

                name
                    .toLowerCase()

        );


    if (
        existingIndex >=
        0
    ) {

        if (
            elapsed <
            records[
                existingIndex
            ].time
        ) {

            records[
                existingIndex
            ].time =
                elapsed;

        }

    } else {

        records.push({

            name,

            time:
                elapsed

        });

    }


    records.sort(
        (a, b) =>
            a.time -
            b.time
    );


    saveRecords(

        records.slice(
            0,
            MAX_RECORDS
        )

    );


    renderRecords();

}


// ============================================================
// CONFIGURAR RÉCORDS
// ============================================================

function setupRecords() {

    if (
        recordsConfigured
    ) {

        return;

    }


    recordsConfigured =
        true;


    if (
        operatorInput
    ) {

        try {

            const savedName =
                localStorage.getItem(
                    OPERATOR_KEY
                );


            if (
                savedName
            ) {

                operatorInput.value =
                    normalizeOperatorName(
                        savedName
                    );

            }


        } catch (
            error
        ) {

            console.warn(
                '⚠️ No fue posible recuperar el operador:',
                error
            );

        }


        operatorInput.addEventListener(

            'change',

            rememberOperatorName

        );

    }


    renderRecords();

}


// ============================================================
// SINCRONIZAR POTENCIA
// ============================================================

function syncGrenadePower(
    value
) {

    const appliedPower =
        setGrenadePower(
            value
        );


    const rounded =
        Math.round(
            appliedPower
        );


    if (
        grenadePowerMenu
    ) {

        grenadePowerMenu.value =
            String(
                appliedPower
            );

    }


    if (
        grenadePowerGame
    ) {

        grenadePowerGame.value =
            String(
                appliedPower
            );

    }


    if (
        grenadePowerMenuValue
    ) {

        grenadePowerMenuValue.textContent =
            `${rounded}%`;

    }


    if (
        grenadePowerGameValue
    ) {

        grenadePowerGameValue.textContent =
            `${rounded}%`;

    }


    return appliedPower;

}


// ============================================================
// CONFIGURAR SLIDERS
// ============================================================

function setupGrenadePowerControls() {

    if (
        grenadePowerConfigured
    ) {

        return;

    }


    grenadePowerConfigured =
        true;


    grenadePowerMenu
        ?.addEventListener(

            'input',

            () => {

                syncGrenadePower(
                    grenadePowerMenu.value
                );

            }

        );


    grenadePowerGame
        ?.addEventListener(

            'input',

            () => {

                syncGrenadePower(
                    grenadePowerGame.value
                );

            }

        );


    syncGrenadePower(

        grenadePowerMenu?.value ??
        grenadePowerGame?.value ??
        100

    );

}


// ============================================================
// OBTENER FIGURAS DE MISIÓN SECUNDARIA
// ============================================================

function getSecondaryMissionObjects() {

    return getDynamicObjects()

        .filter(

            (item) =>

                item &&

                item.type !==
                    'tower'

        );

}


// ============================================================
// ACTUALIZAR MISIÓN SECUNDARIA
// ============================================================

function updateSecondaryMission() {

    const activeObjects =
        getSecondaryMissionObjects();


    if (
        secondaryTotal ===
            0 &&
        activeObjects.length >
            0
    ) {

        secondaryTotal =
            activeObjects.length;

    }


    const destroyed =
        Math.max(

            0,

            secondaryTotal -
            activeObjects.length

        );


    if (
        secondaryCounter
    ) {

        secondaryCounter.textContent =

            secondaryTotal >
            0

                ?

                `${destroyed} / ${secondaryTotal}`

                :

                '0 / 0';

    }


    if (
        secondaryStatus
    ) {

        const completed =

            secondaryTotal >
                0 &&

            destroyed >=
                secondaryTotal;


        secondaryStatus.textContent =

            completed

                ?

                'COMPLETADA'

                :

                'OPCIONAL';


        secondaryStatus.classList.toggle(

            'secondary-complete',

            completed

        );

    }

}


// ============================================================
// OVERLAY
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

        'visible',

        'crosshair-visible',

        'crosshair-aiming',

        'crosshair-target',

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

        'visible',

        'crosshair-visible'

    );

}


// ============================================================
// ACTUALIZAR RESULTADOS
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
            )
                .padStart(
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
// VISIBILIDAD DE ELEMENTOS DEL MENÚ
// ============================================================

function showMenuSetupPanels(
    visible
) {

    if (
        missionBox
    ) {

        missionBox.hidden =
            !visible;

    }


    if (
        operatorPanel
    ) {

        operatorPanel.hidden =
            !visible;

    }


    if (
        menuPowerPanel
    ) {

        menuPowerPanel.hidden =
            !visible;

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

        'hidden',

        'screen-victory',

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


    showMenuSetupPanels(
        true
    );


    if (
        recordsPanel
    ) {

        recordsPanel.hidden =
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
        menuButton
    ) {

        menuButton.hidden =
            true;

    }


    if (
        versionElement
    ) {

        versionElement.textContent =
            'VERSION 11.0.0 · HUD AVANZADO Y RÉCORDS';

    }


    renderRecords();

}


// ============================================================
// VICTORIA
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

        'hidden',

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
            `${getOperatorName()}, destruiste todos los núcleos de energía. Tu tiempo quedó registrado.`;

    }


    showMenuSetupPanels(
        false
    );


    if (
        recordsPanel
    ) {

        recordsPanel.hidden =
            false;

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


    if (
        menuButton
    ) {

        menuButton.hidden =
            false;


        menuButton.textContent =
            'NUEVA PARTIDA / MENÚ';

    }


    updateResultStats();


    renderRecords();

}


// ============================================================
// DERROTA
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

        'hidden',

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


    showMenuSetupPanels(
        false
    );


    if (
        recordsPanel
    ) {

        recordsPanel.hidden =
            false;

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


    if (
        menuButton
    ) {

        menuButton.hidden =
            false;


        menuButton.textContent =
            'NUEVA PARTIDA / MENÚ';

    }


    updateResultStats();


    renderRecords();

}


// ============================================================
// INICIAR O REINICIAR MISIÓN
// ============================================================

function runMissionStart() {

    rememberOperatorName();


    startScreen
        ?.classList
        .add(
            'hidden'
        );


    startScreen
        ?.classList
        .remove(

            'screen-victory',

            'screen-defeat'

        );


    setOverlayActive(
        false
    );


    showCombatCrosshair();


    missionStartCallback?.();


    startButton?.blur();

}


// ============================================================
// BOTÓN PRINCIPAL
// ============================================================

export function setupStartButton(
    callback
) {

    missionStartCallback =
        callback;


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

        runMissionStart

    );

}


// ============================================================
// BOTONES DE PARTIDA
// ============================================================

function setupActionButtons() {

    if (
        actionButtonsConfigured
    ) {

        return;

    }


    actionButtonsConfigured =
        true;


    restartMissionButton
        ?.addEventListener(

            'click',

            () => {

                runMissionStart();

            }

        );


    newGameButton
        ?.addEventListener(

            'click',

            () => {

                setGameState(
                    GAME_STATES.START
                );


                releaseMouse();


                resetUI();

            }

        );


    menuButton
        ?.addEventListener(

            'click',

            () => {

                setGameState(
                    GAME_STATES.START
                );


                releaseMouse();


                resetUI();

            }

        );

}


// ============================================================
// ACTUALIZAR ESTADO
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


    updateSecondaryMission();


    if (
        state ===
        previousState
    ) {

        return;

    }


    previousState =
        state;


    if (
        state ===
        GAME_STATES.VICTORY
    ) {

        saveVictoryRecord();


        showVictoryScreen();


        return;

    }


    if (
        state ===
        GAME_STATES.DEFEAT
    ) {

        showDefeatScreen();

    }

}


// ============================================================
// ACTUALIZAR PUNTOS
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
            )
                .padStart(
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
// ACTUALIZAR OBJETIVOS
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
// ACTUALIZAR TIEMPO
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
        timerPanel
    ) {

        timerPanel.classList.toggle(

            'timer-warning',

            currentSeconds <=
                30 &&

            currentSeconds >
                10

        );


        timerPanel.classList.toggle(

            'timer-critical',

            currentSeconds <=
                10

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
// RESET DE UI
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
        GAME_DURATION;


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
        GAME_DURATION
    );


    setupGrenadePowerControls();


    setupActionButtons();


    setupRecords();


    if (
        secondaryCounter
    ) {

        secondaryCounter.textContent =

            secondaryTotal >
            0

                ?

                `0 / ${secondaryTotal}`

                :

                '0 / 0';

    }


    if (
        secondaryStatus
    ) {

        secondaryStatus.textContent =
            'OPCIONAL';


        secondaryStatus.classList.remove(
            'secondary-complete'
        );

    }


    showInitialScreen();

}