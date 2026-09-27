import * as THREE from 'three';

import {
    registerObjectiveDestroyed
} from './game.js';


// ============================================================
// CONFIGURACIÓN
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
// ESTADO
// ============================================================

let sceneRef = null;

const objectives = [];
const explosionEffects = [];

const objectiveGroup =
    new THREE.Group();

objectiveGroup.name =
    'EnergyObjectives';

const worldPosition =
    new THREE.Vector3();


// ============================================================
// MATERIALES
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
// INICIALIZAR
// ============================================================

export function initObjectives(
    scene,
    getGroundHeight,
    options
) {
    sceneRef = scene;

    objectives.length = 0;

    clearExplosionEffects();

    objectiveGroup.clear();

    if (!objectiveGroup.parent) {
        scene.add(objectiveGroup);
    }

    const spawn =
        options.spawn || {
            x: 0,
            z: 0
        };

    const platforms =
        options.columnPlatforms || [];

    const bounds = {
        minX: options.minX + 1,
        maxX: options.maxX - 1,
        minZ: options.minZ + 1,
        maxZ: options.maxZ - 1
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

    return getObjectivePositions();
}


// ============================================================
// PLATAFORMAS
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

    const selected = [];

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

        if (tooClose) {
            continue;
        }

        selected.push(platform);

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

    if (!Number.isFinite(center)) {
        return null;
    }

    const samples = [
        [FLOOR_CHECK_RADIUS, 0],
        [-FLOOR_CHECK_RADIUS, 0],
        [0, FLOOR_CHECK_RADIUS],
        [0, -FLOOR_CHECK_RADIUS]
    ];

    for (
        const [
            offsetX,
            offsetZ
        ] of samples
    ) {
        const y =
            getGroundHeight(
                x + offsetX,
                z + offsetZ
            );

        if (!Number.isFinite(y)) {
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
// POSICIONES DE PISO
// ============================================================

function findFloorPositions(
    bounds,
    spawn,
    getGroundHeight,
    count
) {
    if (count <= 0) {
        return [];
    }

    const candidates = [];

    const columns = 22;
    const rows = 30;

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
                    column / columns
                );

            const z =
                THREE.MathUtils.lerp(
                    bounds.minZ,
                    bounds.maxZ,
                    row / rows
                );

            const y =
                getValidObjectiveGround(
                    x,
                    z,
                    getGroundHeight
                );

            if (!Number.isFinite(y)) {
                continue;
            }

            const spawnDistance =
                Math.hypot(
                    x - spawn.x,
                    z - spawn.z
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

    candidates.sort((a, b) => {
        const distanceA =
            Math.hypot(
                a.x - spawn.x,
                a.z - spawn.z
            );

        const distanceB =
            Math.hypot(
                b.x - spawn.x,
                b.z - spawn.z
            );

        return distanceB - distanceA;
    });

    const selected = [];

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

        if (tooClose) {
            continue;
        }

        selected.push(candidate);
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

            if (tooClose) {
                continue;
            }

            selected.push(candidate);
        }
    }

    return selected;
}


// ============================================================
// CREAR NÚCLEO
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

    base.position.y = 0.10;
    base.castShadow = true;
    base.receiveShadow = true;

    group.add(base);

    const corePivot =
        new THREE.Group();

    corePivot.position.y =
        CORE_FLOAT_HEIGHT;

    group.add(corePivot);

    const outerCore =
        new THREE.Mesh(
            new THREE.IcosahedronGeometry(
                CORE_RADIUS,
                2
            ),
            coreMaterial.clone()
        );

    outerCore.castShadow = true;

    corePivot.add(outerCore);

    const innerCore =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                CORE_RADIUS * 0.52,
                20,
                16
            ),
            innerMaterial.clone()
        );

    corePivot.add(innerCore);

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
        Math.PI / 2;

    corePivot.add(ring1);

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
        Math.PI / 2;

    corePivot.add(ring2);

    const light =
        new THREE.PointLight(
            0x00e5ff,
            8,
            4.5,
            2
        );

    corePivot.add(light);

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

        destroyed: false,

        health:
            OBJECTIVE_HEALTH,

        maxHealth:
            OBJECTIVE_HEALTH,

        baseFloatY:
            CORE_FLOAT_HEIGHT,

        phase:
            Math.random() *
            Math.PI *
            2
    };

    objectives.push(objective);

    objectiveGroup.add(group);
}


// ============================================================
// OBJETIVOS DISPARABLES
// ============================================================

export function getObjectiveTargets() {
    const targets = [];

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

        meshes.forEach((mesh) => {
            targets.push({
                mesh,
                objective
            });
        });
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
                item.base === mesh ||
                item.outerCore === mesh ||
                item.innerCore === mesh ||
                item.ring1 === mesh ||
                item.ring2 === mesh
        );

    if (
        !objective ||
        objective.destroyed
    ) {
        return {
            hit: false,
            destroyed: false,
            health: 0
        };
    }

    objective.health =
        Math.max(
            0,
            objective.health -
                damage
        );

    console.log(
        `⚡ Vida núcleo: ${objective.health}/${objective.maxHealth}`
    );

    if (
        objective.health <= 0
    ) {
        const destroyed =
            destroyObjective(
                objective
            );

        return {
            hit: true,
            destroyed,
            health: 0
        };
    }

    return {
        hit: true,
        destroyed: false,
        health:
            objective.health
    };
}


// ============================================================
// ACTUALIZAR
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

        objective.outerCore.rotation.y +=
            delta * 1.7;

        objective.outerCore.rotation.x +=
            delta * 0.6;

        objective.ring1.rotation.z +=
            delta * 1.9;

        objective.ring2.rotation.x -=
            delta * 1.5;

        objective.corePivot.position.y =
            objective.baseFloatY +
            Math.sin(
                elapsedTime * 2 +
                objective.phase
            ) *
            0.09;

        objective.light.intensity =
            8 +
            Math.sin(
                elapsedTime * 5 +
                objective.phase
            ) *
            2;
    }

    updateExplosionEffects(
        delta
    );
}


// ============================================================
// DAÑO DE GRANADA
// ============================================================

export function damageObjectives(
    explosionPosition,
    radius
) {
    let destroyedNow = 0;

    for (
        const objective of
        objectives
    ) {
        if (
            objective.destroyed
        ) {
            continue;
        }

        objective.corePivot
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

    if (!accepted) {
        return false;
    }

    objective.corePivot
        .getWorldPosition(
            worldPosition
        );

    const explosionPosition =
        worldPosition.clone();

    objective.destroyed = true;
    objective.health = 0;

    objective.group.visible = false;

    createCoreExplosion(
        explosionPosition
    );

    console.log(
        '⚡ NÚCLEO DESTRUIDO'
    );

    return true;
}


// ============================================================
// EXPLOSIÓN NÚCLEO
// ============================================================

function createCoreExplosion(
    position
) {
    if (!sceneRef) {
        return;
    }

    const group =
        new THREE.Group();

    group.position.copy(
        position
    );

    sceneRef.add(group);

    const particles = [];

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
                        i % 2 === 0
                            ?
                            0x00e5ff
                            :
                            0xffffff,

                    transparent: true,
                    opacity: 1
                })
            );

        const direction =
            new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 1.6 + 0.15,
                Math.random() * 2 - 1
            )
                .normalize();

        particle.userData.velocity =
            direction.multiplyScalar(
                THREE.MathUtils.randFloat(
                    2,
                    5
                )
            );

        group.add(particle);

        particles.push(particle);
    }

    const light =
        new THREE.PointLight(
            0x00e5ff,
            30,
            7,
            2
        );

    group.add(light);

    explosionEffects.push({
        group,
        particles,
        light,
        age: 0,
        duration: 0.75
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
            explosionEffects.length - 1;
        i >= 0;
        i--
    ) {
        const effect =
            explosionEffects[i];

        effect.age += delta;

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
                particle.userData.velocity;

            particle.position
                .addScaledVector(
                    velocity,
                    delta
                );

            velocity.y -=
                4 *
                delta;

            particle.material.opacity =
                1 -
                progress;

            particle.scale.setScalar(
                Math.max(
                    0.1,
                    1 -
                    progress * 0.7
                )
            );
        }

        effect.light.intensity =
            30 *
            (
                1 -
                progress
            );

        if (
            progress >= 1
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
// POSICIONES
// ============================================================

export function getObjectivePositions() {
    const positions = [];

    for (
        const objective of
        objectives
    ) {
        objective.corePivot
            .getWorldPosition(
                worldPosition
            );

        positions.push({
            x: worldPosition.x,
            y: worldPosition.y,
            z: worldPosition.z
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

            objective.corePivot.position.y =
                objective.baseFloatY;

            objective.outerCore.rotation.set(
                0,
                0,
                0
            );

            objective.ring1.rotation.set(
                Math.PI / 2,
                0,
                0
            );

            objective.ring2.rotation.set(
                0,
                Math.PI / 2,
                0
            );

            objective.light.intensity =
                8;
        }
    );

    console.log(
        '🔄 Núcleos reiniciados'
    );
}


// ============================================================
// GET
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
        if (sceneRef) {
            sceneRef.remove(
                effect.group
            );
        }

        disposeObject3D(
            effect.group
        );
    }

    explosionEffects.length = 0;
}


// ============================================================
// DISPOSE
// ============================================================

function disposeObject3D(
    object
) {
    object.traverse(
        (child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }

            if (child.material) {
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
                    child.material.dispose();
                }
            }
        }
    );
}