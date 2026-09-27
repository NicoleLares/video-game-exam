import * as THREE from 'three';
import { registerObjectiveDestroyed } from './game.js';

// ============================================================
// OPERATION IMPACT - OBJECTIVES.JS
// VERSION 1.0.9
// Daño visual progresivo de núcleos de energía
// ============================================================

const TOTAL_OBJECTIVES = 8;
const DESIRED_PLATFORM_OBJECTIVES = 3;

const MIN_OBJECTIVE_DISTANCE = 4.0;
const RELAXED_OBJECTIVE_DISTANCE = 2.7;

const SPAWN_SAFE_DISTANCE = 5.0;

const FLOOR_CHECK_RADIUS = 0.50;
const FLOOR_HEIGHT_TOLERANCE = 0.25;

const CORE_FLOAT_HEIGHT = 0.72;
const CORE_RADIUS = 0.34;

const OBJECTIVE_HEALTH = 100;

// ============================================================
// DAÑO VISUAL
// ============================================================

const DAMAGED_HEALTH_RATIO = 0.60;
const CRITICAL_HEALTH_RATIO = 0.20;

const HIT_FLASH_DURATION = 0.13;

const NORMAL_LIGHT_INTENSITY = 8;
const DAMAGED_LIGHT_INTENSITY = 11;
const CRITICAL_LIGHT_INTENSITY = 16;

// ============================================================
// COLORES NORMALES
// ============================================================

const NORMAL_CORE_COLOR =
    new THREE.Color(0x00e5ff);

const NORMAL_CORE_EMISSIVE =
    new THREE.Color(0x0097a7);

const NORMAL_INNER_COLOR =
    new THREE.Color(0xffffff);

const NORMAL_INNER_EMISSIVE =
    new THREE.Color(0x66ffff);

const NORMAL_RING_COLOR =
    new THREE.Color(0x29b6f6);

const NORMAL_RING_EMISSIVE =
    new THREE.Color(0x0277bd);

const NORMAL_LIGHT_COLOR =
    new THREE.Color(0x00e5ff);

// ============================================================
// COLORES DAÑADOS
// ============================================================

const DAMAGED_CORE_COLOR =
    new THREE.Color(0x5cf2ff);

const DAMAGED_CORE_EMISSIVE =
    new THREE.Color(0x00c8d7);

const DAMAGED_RING_COLOR =
    new THREE.Color(0x70ddff);

const DAMAGED_RING_EMISSIVE =
    new THREE.Color(0x009fd1);

// ============================================================
// COLORES CRÍTICOS
// ============================================================

const CRITICAL_CORE_COLOR =
    new THREE.Color(0xff5c78);

const CRITICAL_CORE_EMISSIVE =
    new THREE.Color(0xff1744);

const CRITICAL_RING_COLOR =
    new THREE.Color(0xff7a92);

const CRITICAL_RING_EMISSIVE =
    new THREE.Color(0xff1744);

const CRITICAL_LIGHT_COLOR =
    new THREE.Color(0xff3355);

// ============================================================
// FLASH DE IMPACTO
// ============================================================

const HIT_FLASH_COLOR =
    new THREE.Color(0xffffff);

const HIT_FLASH_EMISSIVE =
    new THREE.Color(0xbfffff);

const tempColorA =
    new THREE.Color();

const tempColorB =
    new THREE.Color();

const worldPosition =
    new THREE.Vector3();

// ============================================================
// ESTADO
// ============================================================

let sceneRef = null;

const objectives = [];
const explosionEffects = [];

const objectiveGroup =
    new THREE.Group();

objectiveGroup.name =
    'EnergyObjectives';

// ============================================================
// MATERIALES BASE
// ============================================================

const coreMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x0097a7,
        emissiveIntensity: 3.2,
        roughness: 0.15,
        metalness: 0.45
    });

const innerMaterial =
    new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x66ffff,
        emissiveIntensity: 4.5,
        roughness: 0.1,
        metalness: 0.1
    });

const ringMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x29b6f6,
        emissive: 0x0277bd,
        emissiveIntensity: 2.4,
        roughness: 0.25,
        metalness: 0.75
    });

const baseMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x18232b,
        roughness: 0.45,
        metalness: 0.75
    });

// ============================================================
// INICIALIZAR OBJETIVOS
// ============================================================

export function initObjectives(
    scene,
    getGroundHeight,
    options = {}
) {
    sceneRef =
        scene;

    objectives.length =
        0;

    clearExplosionEffects();

    objectiveGroup.clear();

    if (
        !objectiveGroup.parent
    ) {
        scene.add(
            objectiveGroup
        );
    }

    const spawn =
        options.spawn ||
        {
            x: 0,
            z: 0
        };

    const platforms =
        options.columnPlatforms ||
        [];

    const bounds = {
        minX:
            (options.minX ?? -20) +
            1,

        maxX:
            (options.maxX ?? 20) -
            1,

        minZ:
            (options.minZ ?? -20) +
            1,

        maxZ:
            (options.maxZ ?? 20) -
            1
    };

    const selectedPlatforms =
        selectPlatforms(
            platforms,
            spawn,
            DESIRED_PLATFORM_OBJECTIVES
        );

    selectedPlatforms.forEach(
        (platform) => {

            createEnergyCore(
                platform.x,
                platform.y,
                platform.z,
                true
            );

        }
    );

    const remaining =
        TOTAL_OBJECTIVES -
        objectives.length;

    const floorPositions =
        findFloorPositions(
            bounds,
            spawn,
            getGroundHeight,
            remaining
        );

    floorPositions.forEach(
        (position) => {

            createEnergyCore(
                position.x,
                position.y,
                position.z,
                false
            );

        }
    );

    console.log(
        `⚡ Núcleos creados: ${objectives.length}/${TOTAL_OBJECTIVES}`
    );

    console.log(
        '💎 Daño visual progresivo de núcleos activado'
    );

    return getObjectivePositions();
}

// ============================================================
// SELECCIONAR PLATAFORMAS
// ============================================================

function selectPlatforms(
    platforms,
    spawn,
    count
) {
    const available =
        platforms
            .filter(
                (platform) =>

                    Math.hypot(
                        platform.x -
                        spawn.x,

                        platform.z -
                        spawn.z
                    ) >
                    SPAWN_SAFE_DISTANCE

            )
            .sort(
                (a, b) =>

                    (
                        b.area ??
                        b.width *
                        b.depth
                    ) -

                    (
                        a.area ??
                        a.width *
                        a.depth
                    )

            );

    const selected =
        [];

    for (
        const platform of
        available
    ) {
        const tooClose =
            selected.some(
                (other) =>

                    Math.hypot(
                        platform.x -
                        other.x,

                        platform.z -
                        other.z
                    ) <
                    MIN_OBJECTIVE_DISTANCE

            );

        if (
            tooClose
        ) {
            continue;
        }

        selected.push(
            platform
        );

        if (
            selected.length >=
            count
        ) {
            break;
        }
    }

    return selected;
}

// ============================================================
// VALIDAR SUELO
// ============================================================

function getValidObjectiveGround(
    x,
    z,
    getGroundHeight
) {
    const center =
        getGroundHeight(
            x,
            z
        );

    if (
        !Number.isFinite(
            center
        )
    ) {
        return null;
    }

    const samples = [
        [
            FLOOR_CHECK_RADIUS,
            0
        ],

        [
            -FLOOR_CHECK_RADIUS,
            0
        ],

        [
            0,
            FLOOR_CHECK_RADIUS
        ],

        [
            0,
            -FLOOR_CHECK_RADIUS
        ]
    ];

    for (
        const [
            offsetX,
            offsetZ
        ] of
        samples
    ) {
        const y =
            getGroundHeight(
                x +
                offsetX,

                z +
                offsetZ
            );

        if (
            !Number.isFinite(
                y
            )
        ) {
            return null;
        }

        if (
            Math.abs(
                y -
                center
            ) >
            FLOOR_HEIGHT_TOLERANCE
        ) {
            return null;
        }
    }

    return center;
}

// ============================================================
// BUSCAR POSICIONES DE PISO
// ============================================================

function findFloorPositions(
    bounds,
    spawn,
    getGroundHeight,
    count
) {
    if (
        count <=
        0
    ) {
        return [];
    }

    const candidates =
        [];

    const columns =
        22;

    const rows =
        30;

    for (
        let row = 0;
        row <= rows;
        row++
    ) {
        for (
            let column = 0;
            column <= columns;
            column++
        ) {
            const x =
                THREE.MathUtils.lerp(
                    bounds.minX,
                    bounds.maxX,
                    column /
                    columns
                );

            const z =
                THREE.MathUtils.lerp(
                    bounds.minZ,
                    bounds.maxZ,
                    row /
                    rows
                );

            const y =
                getValidObjectiveGround(
                    x,
                    z,
                    getGroundHeight
                );

            if (
                !Number.isFinite(
                    y
                )
            ) {
                continue;
            }

            const spawnDistance =
                Math.hypot(
                    x -
                    spawn.x,

                    z -
                    spawn.z
                );

            if (
                spawnDistance <
                SPAWN_SAFE_DISTANCE
            ) {
                continue;
            }

            const tooCloseToPlatformCore =
                objectives.some(
                    (objective) =>

                        Math.hypot(
                            x -
                            objective
                                .group
                                .position
                                .x,

                            z -
                            objective
                                .group
                                .position
                                .z
                        ) <
                        MIN_OBJECTIVE_DISTANCE

                );

            if (
                tooCloseToPlatformCore
            ) {
                continue;
            }

            candidates.push({
                x,
                y,
                z
            });
        }
    }

    candidates.sort(
        (a, b) => {

            const distanceA =
                Math.hypot(
                    a.x -
                    spawn.x,

                    a.z -
                    spawn.z
                );

            const distanceB =
                Math.hypot(
                    b.x -
                    spawn.x,

                    b.z -
                    spawn.z
                );

            return (
                distanceB -
                distanceA
            );
        }
    );

    const selected =
        [];

    for (
        const candidate of
        candidates
    ) {
        if (
            selected.length >=
            count
        ) {
            break;
        }

        const tooClose =
            selected.some(
                (other) =>

                    Math.hypot(
                        candidate.x -
                        other.x,

                        candidate.z -
                        other.z
                    ) <
                    MIN_OBJECTIVE_DISTANCE

            );

        if (
            tooClose
        ) {
            continue;
        }

        selected.push(
            candidate
        );
    }

    if (
        selected.length <
        count
    ) {
        for (
            const candidate of
            candidates
        ) {
            if (
                selected.length >=
                count
            ) {
                break;
            }

            if (
                selected.includes(
                    candidate
                )
            ) {
                continue;
            }

            const tooClose =
                selected.some(
                    (other) =>

                        Math.hypot(
                            candidate.x -
                            other.x,

                            candidate.z -
                            other.z
                        ) <
                        RELAXED_OBJECTIVE_DISTANCE

                );

            if (
                tooClose
            ) {
                continue;
            }

            selected.push(
                candidate
            );
        }
    }

    return selected;
}

// ============================================================
// CREAR NÚCLEO DE ENERGÍA
// ============================================================

function createEnergyCore(
    x,
    groundY,
    z,
    elevated
) {
    const group =
        new THREE.Group();

    group.name =
        'EnergyCore';

    group.position.set(
        x,
        groundY,
        z
    );

    // ========================================================
    // BASE
    // ========================================================

    const base =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.46,
                0.56,
                0.20,
                24
            ),

            baseMaterial.clone()

        );

    base.position.y =
        0.10;

    base.castShadow =
        true;

    base.receiveShadow =
        true;

    group.add(
        base
    );

    // ========================================================
    // PIVOTE
    // ========================================================

    const corePivot =
        new THREE.Group();

    corePivot.position.y =
        CORE_FLOAT_HEIGHT;

    group.add(
        corePivot
    );

    // ========================================================
    // NÚCLEO EXTERIOR
    // ========================================================

    const outerCore =
        new THREE.Mesh(

            new THREE.IcosahedronGeometry(
                CORE_RADIUS,
                2
            ),

            coreMaterial.clone()

        );

    outerCore.castShadow =
        true;

    corePivot.add(
        outerCore
    );

    // ========================================================
    // NÚCLEO INTERIOR
    // ========================================================

    const innerCore =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                CORE_RADIUS *
                0.52,

                20,
                16
            ),

            innerMaterial.clone()

        );

    corePivot.add(
        innerCore
    );

    // ========================================================
    // ANILLO 1
    // ========================================================

    const ring1 =
        new THREE.Mesh(

            new THREE.TorusGeometry(
                0.47,
                0.035,
                10,
                32
            ),

            ringMaterial.clone()

        );

    ring1.rotation.x =
        Math.PI /
        2;

    corePivot.add(
        ring1
    );

    // ========================================================
    // ANILLO 2
    // ========================================================

    const ring2 =
        new THREE.Mesh(

            new THREE.TorusGeometry(
                0.41,
                0.028,
                10,
                32
            ),

            ringMaterial.clone()

        );

    ring2.rotation.y =
        Math.PI /
        2;

    corePivot.add(
        ring2
    );

    // ========================================================
    // LUZ
    // ========================================================

    const light =
        new THREE.PointLight(
            0x00e5ff,
            NORMAL_LIGHT_INTENSITY,
            4.5,
            2
        );

    corePivot.add(
        light
    );

    // ========================================================
    // OBJETIVO
    // ========================================================

    const objective = {
        group,
        base,
        corePivot,
        outerCore,
        innerCore,
        ring1,
        ring2,
        light,

        elevated,

        destroyed:
            false,

        health:
            OBJECTIVE_HEALTH,

        maxHealth:
            OBJECTIVE_HEALTH,

        baseFloatY:
            CORE_FLOAT_HEIGHT,

        phase:
            Math.random() *
            Math.PI *
            2,

        hitFlash:
            0,

        visualState:
            'normal'
    };

    objectives.push(
        objective
    );

    objectiveGroup.add(
        group
    );

    resetObjectiveVisual(
        objective
    );
}

// ============================================================
// OBJETIVOS DISPARABLES
// ============================================================

export function getObjectiveTargets() {
    const targets =
        [];

    for (
        const objective of
        objectives
    ) {
        if (
            objective.destroyed ||
            !objective.group.visible
        ) {
            continue;
        }

        const meshes = [
            objective.base,
            objective.outerCore,
            objective.innerCore,
            objective.ring1,
            objective.ring2
        ];

        meshes.forEach(
            (mesh) => {

                targets.push({
                    mesh,
                    objective
                });

            }
        );
    }

    return targets;
}

// ============================================================
// DAÑO POR DISPARO
// ============================================================

export function damageObjectiveByMesh(
    mesh,
    damage
) {
    const objective =
        objectives.find(
            (item) =>

                item.base ===
                    mesh ||

                item.outerCore ===
                    mesh ||

                item.innerCore ===
                    mesh ||

                item.ring1 ===
                    mesh ||

                item.ring2 ===
                    mesh

        );

    if (
        !objective ||
        objective.destroyed
    ) {
        return {
            hit:
                false,

            destroyed:
                false,

            health:
                0,

            maxHealth:
                OBJECTIVE_HEALTH
        };
    }

    objective.health =
        Math.max(

            0,

            objective.health -
            Math.max(
                0,
                damage
            )

        );

    // Flash al impacto
    objective.hitFlash =
        HIT_FLASH_DURATION;

    console.log(
        `⚡ Vida núcleo: ${objective.health}/${objective.maxHealth}`
    );

    if (
        objective.health <=
        0
    ) {
        const destroyed =
            destroyObjective(
                objective
            );

        return {
            hit:
                true,

            destroyed,

            health:
                0,

            maxHealth:
                objective.maxHealth
        };
    }

    return {
        hit:
            true,

        destroyed:
            false,

        health:
            objective.health,

        maxHealth:
            objective.maxHealth
    };
}

// ============================================================
// ACTUALIZAR OBJETIVOS
// ============================================================

export function updateObjectives(
    delta,
    elapsedTime
) {
    for (
        const objective of
        objectives
    ) {
        if (
            objective.destroyed
        ) {
            continue;
        }

        if (
            objective.hitFlash >
            0
        ) {
            objective.hitFlash =
                Math.max(

                    0,

                    objective.hitFlash -
                    delta

                );
        }

        updateObjectiveVisual(
            objective,
            delta,
            elapsedTime
        );
    }

    updateExplosionEffects(
        delta
    );
}

// ============================================================
// DAÑO VISUAL PROGRESIVO
// ============================================================

function updateObjectiveVisual(
    objective,
    delta,
    elapsedTime
) {
    const healthRatio =
        THREE.MathUtils.clamp(

            objective.health /
            objective.maxHealth,

            0,
            1

        );

    const damageAmount =
        1 -
        healthRatio;

    let state =
        'normal';

    if (
        healthRatio <=
        CRITICAL_HEALTH_RATIO
    ) {
        state =
            'critical';

    } else if (
        healthRatio <=
        DAMAGED_HEALTH_RATIO
    ) {
        state =
            'damaged';
    }

    objective.visualState =
        state;

    // ========================================================
    // VELOCIDADES BASE
    // ========================================================

    let outerSpeedY =
        1.7;

    let outerSpeedX =
        0.6;

    let ring1Speed =
        1.9;

    let ring2Speed =
        1.5;

    let floatFrequency =
        2;

    let floatAmplitude =
        0.09;

    // ========================================================
    // ESCALAS
    // ========================================================

    let outerScale =
        1;

    let innerScale =
        1;

    let ring1Scale =
        1;

    let ring2Scale =
        1;

    // ========================================================
    // LUZ
    // ========================================================

    let lightBase =
        NORMAL_LIGHT_INTENSITY;

    let lightPulse =
        2;

    let lightFrequency =
        5;

    // ========================================================
    // INESTABILIDAD DEL PIVOTE
    // ========================================================

    let pivotTiltX =
        0;

    let pivotTiltZ =
        0;

    // ========================================================
    // ESTADO NORMAL
    // ========================================================

    if (
        state ===
        'normal'
    ) {
        objective
            .outerCore
            .material
            .color
            .copy(
                NORMAL_CORE_COLOR
            );

        objective
            .outerCore
            .material
            .emissive
            .copy(
                NORMAL_CORE_EMISSIVE
            );

        objective
            .outerCore
            .material
            .emissiveIntensity =
            3.2;

        objective
            .innerCore
            .material
            .color
            .copy(
                NORMAL_INNER_COLOR
            );

        objective
            .innerCore
            .material
            .emissive
            .copy(
                NORMAL_INNER_EMISSIVE
            );

        objective
            .innerCore
            .material
            .emissiveIntensity =
            4.5;

        objective
            .ring1
            .material
            .color
            .copy(
                NORMAL_RING_COLOR
            );

        objective
            .ring1
            .material
            .emissive
            .copy(
                NORMAL_RING_EMISSIVE
            );

        objective
            .ring1
            .material
            .emissiveIntensity =
            2.4;

        objective
            .ring2
            .material
            .color
            .copy(
                NORMAL_RING_COLOR
            );

        objective
            .ring2
            .material
            .emissive
            .copy(
                NORMAL_RING_EMISSIVE
            );

        objective
            .ring2
            .material
            .emissiveIntensity =
            2.4;

        objective
            .light
            .color
            .copy(
                NORMAL_LIGHT_COLOR
            );
    }

    // ========================================================
    // ESTADO DAÑADO
    // ========================================================

    if (
        state ===
        'damaged'
    ) {
        const damagedProgress =
            THREE.MathUtils.clamp(

                (
                    DAMAGED_HEALTH_RATIO -
                    healthRatio
                ) /

                (
                    DAMAGED_HEALTH_RATIO -
                    CRITICAL_HEALTH_RATIO
                ),

                0,
                1

            );

        const pulse =
            (
                Math.sin(

                    elapsedTime *
                    8 +

                    objective.phase

                ) +
                1
            ) /
            2;

        objective
            .outerCore
            .material
            .color
            .copy(
                DAMAGED_CORE_COLOR
            );

        objective
            .outerCore
            .material
            .emissive
            .copy(
                DAMAGED_CORE_EMISSIVE
            );

        objective
            .outerCore
            .material
            .emissiveIntensity =

            4.2 +
            pulse *
            1.4;

        objective
            .innerCore
            .material
            .color
            .copy(
                NORMAL_INNER_COLOR
            );

        objective
            .innerCore
            .material
            .emissive
            .copy(
                DAMAGED_CORE_COLOR
            );

        objective
            .innerCore
            .material
            .emissiveIntensity =

            5.7 +
            pulse *
            1.5;

        objective
            .ring1
            .material
            .color
            .copy(
                DAMAGED_RING_COLOR
            );

        objective
            .ring1
            .material
            .emissive
            .copy(
                DAMAGED_RING_EMISSIVE
            );

        objective
            .ring1
            .material
            .emissiveIntensity =

            3.5 +
            pulse *
            1.2;

        objective
            .ring2
            .material
            .color
            .copy(
                DAMAGED_RING_COLOR
            );

        objective
            .ring2
            .material
            .emissive
            .copy(
                DAMAGED_RING_EMISSIVE
            );

        objective
            .ring2
            .material
            .emissiveIntensity =

            3.5 +
            pulse *
            1.2;

        objective
            .light
            .color
            .copy(
                DAMAGED_CORE_COLOR
            );

        outerSpeedY =
            2.4 +
            damagedProgress *
            0.8;

        outerSpeedX =
            0.9 +
            damagedProgress *
            0.4;

        ring1Speed =
            2.8 +
            damagedProgress *
            0.8;

        ring2Speed =
            2.3 +
            damagedProgress *
            0.8;

        floatFrequency =
            2.8;

        floatAmplitude =
            0.11;

        outerScale =
            1 +
            pulse *
            0.035;

        innerScale =
            1 +
            pulse *
            0.07;

        ring1Scale =
            1 +
            pulse *
            0.035;

        ring2Scale =
            1 -
            pulse *
            0.025;

        lightBase =
            DAMAGED_LIGHT_INTENSITY;

        lightPulse =
            4;

        lightFrequency =
            8;
    }

    // ========================================================
    // ESTADO CRÍTICO
    // ========================================================

    if (
        state ===
        'critical'
    ) {
        const pulse =
            (
                Math.sin(

                    elapsedTime *
                    16 +

                    objective.phase

                ) +
                1
            ) /
            2;

        const fastPulse =
            (
                Math.sin(

                    elapsedTime *
                    29 +

                    objective.phase *
                    1.7

                ) +
                1
            ) /
            2;

        // ====================================================
        // NÚCLEO EXTERIOR
        // ====================================================

        tempColorA
            .copy(
                NORMAL_CORE_COLOR
            )
            .lerp(

                CRITICAL_CORE_COLOR,

                0.55 +
                pulse *
                0.45

            );

        tempColorB
            .copy(
                NORMAL_CORE_EMISSIVE
            )
            .lerp(

                CRITICAL_CORE_EMISSIVE,

                0.65 +
                fastPulse *
                0.35

            );

        objective
            .outerCore
            .material
            .color
            .copy(
                tempColorA
            );

        objective
            .outerCore
            .material
            .emissive
            .copy(
                tempColorB
            );

        objective
            .outerCore
            .material
            .emissiveIntensity =

            6.5 +
            fastPulse *
            4.5;

        // ====================================================
        // NÚCLEO INTERIOR
        // ====================================================

        objective
            .innerCore
            .material
            .color
            .copy(
                HIT_FLASH_COLOR
            );

        objective
            .innerCore
            .material
            .emissive
            .copy(
                CRITICAL_CORE_COLOR
            );

        objective
            .innerCore
            .material
            .emissiveIntensity =

            8 +
            pulse *
            5;

        // ====================================================
        // ANILLOS
        // ====================================================

        tempColorA
            .copy(
                NORMAL_RING_COLOR
            )
            .lerp(

                CRITICAL_RING_COLOR,

                0.6 +
                pulse *
                0.4

            );

        tempColorB
            .copy(
                NORMAL_RING_EMISSIVE
            )
            .lerp(

                CRITICAL_RING_EMISSIVE,

                0.7 +
                fastPulse *
                0.3

            );

        objective
            .ring1
            .material
            .color
            .copy(
                tempColorA
            );

        objective
            .ring1
            .material
            .emissive
            .copy(
                tempColorB
            );

        objective
            .ring1
            .material
            .emissiveIntensity =

            5.5 +
            fastPulse *
            4;

        objective
            .ring2
            .material
            .color
            .copy(
                tempColorA
            );

        objective
            .ring2
            .material
            .emissive
            .copy(
                tempColorB
            );

        objective
            .ring2
            .material
            .emissiveIntensity =

            5.5 +
            pulse *
            4;

        // ====================================================
        // LUZ
        // ====================================================

        objective
            .light
            .color
            .copy(
                NORMAL_LIGHT_COLOR
            )
            .lerp(

                CRITICAL_LIGHT_COLOR,

                0.65 +
                pulse *
                0.35

            );

        // ====================================================
        // MÁS VELOCIDAD / INESTABILIDAD
        // ====================================================

        outerSpeedY =
            4.8 +
            fastPulse *
            1.4;

        outerSpeedX =
            2.1 +
            pulse *
            0.9;

        ring1Speed =
            5.4 +
            fastPulse *
            2.0;

        ring2Speed =
            4.7 +
            pulse *
            1.8;

        floatFrequency =
            5.2;

        floatAmplitude =
            0.14;

        outerScale =
            1 +
            pulse *
            0.075;

        innerScale =
            0.94 +
            fastPulse *
            0.18;

        ring1Scale =
            0.96 +
            pulse *
            0.12;

        ring2Scale =
            1.05 -
            fastPulse *
            0.10;

        lightBase =
            CRITICAL_LIGHT_INTENSITY;

        lightPulse =
            9;

        lightFrequency =
            15;

        pivotTiltX =
            Math.sin(

                elapsedTime *
                11 +

                objective.phase

            ) *
            0.025;

        pivotTiltZ =
            Math.sin(

                elapsedTime *
                13 +

                objective.phase *
                0.8

            ) *
            0.030;
    }

    // ========================================================
    // FLASH BLANCO/CYAN AL RECIBIR IMPACTO
    // ========================================================

    if (
        objective.hitFlash >
        0
    ) {
        const flash =
            THREE.MathUtils.clamp(

                objective.hitFlash /
                HIT_FLASH_DURATION,

                0,
                1

            );

        objective
            .outerCore
            .material
            .color
            .lerp(

                HIT_FLASH_COLOR,

                0.78 *
                flash

            );

        objective
            .outerCore
            .material
            .emissive
            .lerp(

                HIT_FLASH_EMISSIVE,

                0.88 *
                flash

            );

        objective
            .outerCore
            .material
            .emissiveIntensity +=

            5 *
            flash;

        objective
            .innerCore
            .material
            .color
            .lerp(

                HIT_FLASH_COLOR,

                0.9 *
                flash

            );

        objective
            .innerCore
            .material
            .emissive
            .lerp(

                HIT_FLASH_EMISSIVE,

                0.9 *
                flash

            );

        objective
            .innerCore
            .material
            .emissiveIntensity +=

            6 *
            flash;

        objective
            .ring1
            .material
            .color
            .lerp(

                HIT_FLASH_COLOR,

                0.7 *
                flash

            );

        objective
            .ring2
            .material
            .color
            .lerp(

                HIT_FLASH_COLOR,

                0.7 *
                flash

            );

        lightBase +=
            12 *
            flash;
    }

    // ========================================================
    // ROTACIONES
    // ========================================================

    objective
        .outerCore
        .rotation
        .y +=

        delta *
        outerSpeedY;

    objective
        .outerCore
        .rotation
        .x +=

        delta *
        outerSpeedX;

    objective
        .ring1
        .rotation
        .z +=

        delta *
        ring1Speed;

    objective
        .ring2
        .rotation
        .x -=

        delta *
        ring2Speed;

    // ========================================================
    // FLOTACIÓN
    // ========================================================

    objective
        .corePivot
        .position
        .y =

        objective.baseFloatY +

        Math.sin(

            elapsedTime *
            floatFrequency +

            objective.phase

        ) *
        floatAmplitude;

    // ========================================================
    // INCLINACIÓN
    // ========================================================

    objective
        .corePivot
        .rotation
        .x =
        pivotTiltX;

    objective
        .corePivot
        .rotation
        .z =
        pivotTiltZ;

    // ========================================================
    // ESCALAS
    // ========================================================

    objective
        .outerCore
        .scale
        .setScalar(
            outerScale
        );

    objective
        .innerCore
        .scale
        .setScalar(
            innerScale
        );

    objective
        .ring1
        .scale
        .setScalar(
            ring1Scale
        );

    objective
        .ring2
        .scale
        .setScalar(
            ring2Scale
        );

    // ========================================================
    // LUZ
    // ========================================================

    objective
        .light
        .intensity =

        Math.max(

            0,

            lightBase +

            Math.sin(

                elapsedTime *
                lightFrequency +

                objective.phase

            ) *
            lightPulse

        );

    // ========================================================
    // VIBRACIÓN ADICIONAL
    // ========================================================

    if (
        state !==
        'normal'
    ) {
        const shake =
            damageAmount *
            0.012;

        objective
            .outerCore
            .position
            .set(

                Math.sin(

                    elapsedTime *
                    19 +

                    objective.phase

                ) *
                shake,

                Math.sin(

                    elapsedTime *
                    23 +

                    objective.phase *
                    1.2

                ) *
                shake,

                Math.cos(

                    elapsedTime *
                    17 +

                    objective.phase

                ) *
                shake

            );

    } else {

        objective
            .outerCore
            .position
            .set(
                0,
                0,
                0
            );
    }
}

// ============================================================
// RESET VISUAL DE UN NÚCLEO
// ============================================================

function resetObjectiveVisual(
    objective
) {
    objective.hitFlash =
        0;

    objective.visualState =
        'normal';

    objective
        .corePivot
        .position
        .y =

        objective.baseFloatY;

    objective
        .corePivot
        .rotation
        .set(
            0,
            0,
            0
        );

    objective
        .outerCore
        .position
        .set(
            0,
            0,
            0
        );

    objective
        .outerCore
        .scale
        .setScalar(
            1
        );

    objective
        .innerCore
        .scale
        .setScalar(
            1
        );

    objective
        .ring1
        .scale
        .setScalar(
            1
        );

    objective
        .ring2
        .scale
        .setScalar(
            1
        );

    // ========================================================
    // NÚCLEO EXTERIOR
    // ========================================================

    objective
        .outerCore
        .material
        .color
        .copy(
            NORMAL_CORE_COLOR
        );

    objective
        .outerCore
        .material
        .emissive
        .copy(
            NORMAL_CORE_EMISSIVE
        );

    objective
        .outerCore
        .material
        .emissiveIntensity =
        3.2;

    // ========================================================
    // NÚCLEO INTERIOR
    // ========================================================

    objective
        .innerCore
        .material
        .color
        .copy(
            NORMAL_INNER_COLOR
        );

    objective
        .innerCore
        .material
        .emissive
        .copy(
            NORMAL_INNER_EMISSIVE
        );

    objective
        .innerCore
        .material
        .emissiveIntensity =
        4.5;

    // ========================================================
    // ANILLO 1
    // ========================================================

    objective
        .ring1
        .material
        .color
        .copy(
            NORMAL_RING_COLOR
        );

    objective
        .ring1
        .material
        .emissive
        .copy(
            NORMAL_RING_EMISSIVE
        );

    objective
        .ring1
        .material
        .emissiveIntensity =
        2.4;

    // ========================================================
    // ANILLO 2
    // ========================================================

    objective
        .ring2
        .material
        .color
        .copy(
            NORMAL_RING_COLOR
        );

    objective
        .ring2
        .material
        .emissive
        .copy(
            NORMAL_RING_EMISSIVE
        );

    objective
        .ring2
        .material
        .emissiveIntensity =
        2.4;

    // ========================================================
    // LUZ
    // ========================================================

    objective
        .light
        .color
        .copy(
            NORMAL_LIGHT_COLOR
        );

    objective
        .light
        .intensity =
        NORMAL_LIGHT_INTENSITY;
}

// ============================================================
// DAÑO DE GRANADA
//
// Conservamos el comportamiento actual:
// si un núcleo entra en el radio de la explosión,
// la granada lo destruye.
// ============================================================

export function damageObjectives(
    explosionPosition,
    radius
) {
    let destroyedNow =
        0;

    for (
        const objective of
        objectives
    ) {
        if (
            objective.destroyed
        ) {
            continue;
        }

        objective
            .corePivot
            .getWorldPosition(
                worldPosition
            );

        const distance =
            worldPosition.distanceTo(
                explosionPosition
            );

        if (
            distance >
            radius
        ) {
            continue;
        }

        if (
            destroyObjective(
                objective
            )
        ) {
            destroyedNow++;
        }
    }

    return destroyedNow;
}

// ============================================================
// DESTRUIR NÚCLEO
// ============================================================

function destroyObjective(
    objective
) {
    const accepted =
        registerObjectiveDestroyed();

    if (
        !accepted
    ) {
        return false;
    }

    objective
        .corePivot
        .getWorldPosition(
            worldPosition
        );

    const explosionPosition =
        worldPosition.clone();

    objective.destroyed =
        true;

    objective.health =
        0;

    objective.hitFlash =
        0;

    objective.group.visible =
        false;

    createCoreExplosion(
        explosionPosition
    );

    console.log(
        '⚡ NÚCLEO DESTRUIDO'
    );

    return true;
}

// ============================================================
// EXPLOSIÓN DEL NÚCLEO
// ============================================================

function createCoreExplosion(
    position
) {
    if (
        !sceneRef
    ) {
        return;
    }

    const group =
        new THREE.Group();

    group.position.copy(
        position
    );

    sceneRef.add(
        group
    );

    const particles =
        [];

    for (
        let i = 0;
        i < 26;
        i++
    ) {
        const particle =
            new THREE.Mesh(

                new THREE.SphereGeometry(
                    0.065,
                    6,
                    6
                ),

                new THREE.MeshBasicMaterial({

                    color:
                        i %
                        2 ===
                        0
                            ?
                            0x00e5ff
                            :
                            0xffffff,

                    transparent:
                        true,

                    opacity:
                        1

                })

            );

        const direction =
            new THREE.Vector3(

                Math.random() *
                2 -
                1,

                Math.random() *
                1.6 +
                0.15,

                Math.random() *
                2 -
                1

            )
                .normalize();

        particle
            .userData
            .velocity =

            direction
                .multiplyScalar(

                    THREE.MathUtils.randFloat(
                        2,
                        5
                    )

                );

        group.add(
            particle
        );

        particles.push(
            particle
        );
    }

    const light =
        new THREE.PointLight(
            0x00e5ff,
            30,
            7,
            2
        );

    group.add(
        light
    );

    explosionEffects.push({
        group,
        particles,
        light,

        age:
            0,

        duration:
            0.75
    });
}

// ============================================================
// ACTUALIZAR EXPLOSIONES
// ============================================================

function updateExplosionEffects(
    delta
) {
    for (
        let i =
            explosionEffects.length -
            1;

        i >=
        0;

        i--
    ) {
        const effect =
            explosionEffects[
                i
            ];

        effect.age +=
            delta;

        const progress =
            THREE.MathUtils.clamp(

                effect.age /
                effect.duration,

                0,
                1

            );

        for (
            const particle of
            effect.particles
        ) {
            const velocity =
                particle
                    .userData
                    .velocity;

            particle
                .position
                .addScaledVector(
                    velocity,
                    delta
                );

            velocity.y -=
                4 *
                delta;

            particle
                .material
                .opacity =

                1 -
                progress;

            particle
                .scale
                .setScalar(

                    Math.max(

                        0.1,

                        1 -
                        progress *
                        0.7

                    )

                );
        }

        effect
            .light
            .intensity =

            30 *
            (
                1 -
                progress
            );

        if (
            progress >=
            1
        ) {
            sceneRef.remove(
                effect.group
            );

            disposeObject3D(
                effect.group
            );

            explosionEffects.splice(
                i,
                1
            );
        }
    }
}

// ============================================================
// POSICIONES DE OBJETIVOS
// ============================================================

export function getObjectivePositions() {
    const positions =
        [];

    for (
        const objective of
        objectives
    ) {
        objective
            .corePivot
            .getWorldPosition(
                worldPosition
            );

        positions.push({
            x:
                worldPosition.x,

            y:
                worldPosition.y,

            z:
                worldPosition.z
        });
    }

    return positions;
}

// ============================================================
// RESET
// ============================================================

export function resetObjectives() {
    clearExplosionEffects();

    objectives.forEach(
        (objective) => {

            objective.destroyed =
                false;

            objective.health =
                objective.maxHealth;

            objective.group.visible =
                true;

            // =================================================
            // ROTACIÓN NÚCLEO
            // =================================================

            objective
                .outerCore
                .rotation
                .set(
                    0,
                    0,
                    0
                );

            objective
                .innerCore
                .rotation
                .set(
                    0,
                    0,
                    0
                );

            // =================================================
            // ANILLO 1
            // =================================================

            objective
                .ring1
                .rotation
                .set(
                    Math.PI /
                    2,

                    0,

                    0
                );

            // =================================================
            // ANILLO 2
            // =================================================

            objective
                .ring2
                .rotation
                .set(
                    0,

                    Math.PI /
                    2,

                    0
                );

            // =================================================
            // VISUAL
            // =================================================

            resetObjectiveVisual(
                objective
            );

        }
    );

    console.log(
        '🔄 Núcleos reiniciados'
    );
}

// ============================================================
// OBTENER NÚCLEOS
// ============================================================

export function getObjectives3D() {
    return objectives;
}

// ============================================================
// LIMPIAR EFECTOS
// ============================================================

function clearExplosionEffects() {
    for (
        const effect of
        explosionEffects
    ) {
        if (
            sceneRef
        ) {
            sceneRef.remove(
                effect.group
            );
        }

        disposeObject3D(
            effect.group
        );
    }

    explosionEffects.length =
        0;
}

// ============================================================
// LIBERAR MEMORIA
// ============================================================

function disposeObject3D(
    object
) {
    object.traverse(
        (child) => {

            if (
                child.geometry
            ) {
                child
                    .geometry
                    .dispose();
            }

            if (
                child.material
            ) {
                if (
                    Array.isArray(
                        child.material
                    )
                ) {
                    child.material.forEach(
                        (material) =>

                            material.dispose()

                    );

                } else {

                    child
                        .material
                        .dispose();

                }
            }

        }
    );
}