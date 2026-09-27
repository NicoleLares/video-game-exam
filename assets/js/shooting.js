import * as THREE from 'three';

import {
    getDynamicObjects,
    damageDynamicObject
} from './objects.js';

import {
    getObjectiveTargets,
    damageObjectiveByMesh
} from './objectives.js';


// ============================================================
// OPERATION IMPACT
// SHOOTING.JS
// VERSION 1.0.6
// ============================================================


// ============================================================
// CONFIGURACIÓN DEL DISPARO
// ============================================================

const MAX_DISTANCE =
    70;

const BULLET_DAMAGE =
    40;

const SHOOT_FORCE =
    8;

const UP_FORCE =
    0.8;

const FIRE_COOLDOWN =
    0.16;


// ============================================================
// MUNICIÓN
// ============================================================

const MAGAZINE_SIZE =
    30;

const STARTING_RESERVE_AMMO =
    90;

const RELOAD_TIME =
    1.5;

const WEAPON_NAME =
    'AR-15';


// ============================================================
// PROYECTIL VISUAL
// ============================================================

const PROJECTILE_SPEED =
    55;

const PROJECTILE_LENGTH =
    0.34;

const PROJECTILE_RADIUS =
    0.025;


// ============================================================
// DURACIÓN DE EFECTOS
// ============================================================

const IMPACT_DURATION =
    0.32;

const DESTRUCTION_DURATION =
    0.70;

const MUZZLE_FLASH_DURATION =
    0.08;

const IMPACT_LIGHT_DURATION =
    0.12;

const SHOCKWAVE_DURATION =
    0.28;

const CROSSHAIR_FIRE_DURATION =
    0.10;

const HITMARKER_DURATION =
    0.15;


// ============================================================
// REFERENCIAS
// ============================================================

let sceneRef =
    null;

let cameraRef =
    null;

let environmentMeshesRef =
    [];


// ============================================================
// ESTADO DEL ARMA
// ============================================================

let cooldown =
    0;

let aiming =
    false;

let magazineAmmo =
    MAGAZINE_SIZE;

let reserveAmmo =
    STARTING_RESERVE_AMMO;

let reloading =
    false;

let reloadTimer =
    0;


// ============================================================
// HUD
// ============================================================

let crosshairElement =
    null;

let hitmarkerElement =
    null;

let targetInfoElement =
    null;

let targetNameElement =
    null;

let targetHealthFillElement =
    null;

let targetHealthTextElement =
    null;

let weaponHudElement =
    null;

let magazineElement =
    null;

let reserveElement =
    null;

let reloadElement =
    null;


// ============================================================
// TEMPORIZADORES DE HUD
// ============================================================

let crosshairFireTimer =
    0;

let hitmarkerTimer =
    0;


// ============================================================
// RAYCASTER
// ============================================================

const raycaster =
    new THREE.Raycaster();

const screenCenter =
    new THREE.Vector2(
        0,
        0
    );


// ============================================================
// VECTORES REUTILIZABLES
// ============================================================

const muzzlePosition =
    new THREE.Vector3();

const cameraDirection =
    new THREE.Vector3();

const impactDirection =
    new THREE.Vector3();

const worldNormal =
    new THREE.Vector3();

const normalMatrix =
    new THREE.Matrix3();


// ============================================================
// EFECTOS ACTIVOS
// ============================================================

const projectiles =
    [];

const effects =
    [];


// ============================================================
// INICIALIZAR SISTEMA
// ============================================================

export function initShootingSystem(
    scene,
    camera,
    environmentMeshes = []
) {

    sceneRef =
        scene;

    cameraRef =
        camera;

    environmentMeshesRef =
        environmentMeshes;


    crosshairElement =
        document.getElementById(
            'crosshair'
        );


    if (
        crosshairElement
    ) {

        crosshairElement.style.top =
            '50%';

        crosshairElement.style.left =
            '50%';

        crosshairElement.classList.add(
            'crosshair-visible'
        );

        crosshairElement.classList.remove(
            'crosshair-aiming'
        );

        crosshairElement.classList.remove(
            'crosshair-target'
        );

        crosshairElement.classList.remove(
            'crosshair-fire'
        );

    }


    createCombatHUD();

    updateAmmoHUD();


    console.log(
        '🔫 Sistema de disparo v1.0.6 listo'
    );

}


// ============================================================
// CREAR HUD DE COMBATE
// ============================================================

function createCombatHUD() {

    // ========================================================
    // HITMARKER
    // ========================================================

    hitmarkerElement =
        document.getElementById(
            'hitmarker'
        );


    if (
        !hitmarkerElement
    ) {

        hitmarkerElement =
            document.createElement(
                'div'
            );

        hitmarkerElement.id =
            'hitmarker';

        hitmarkerElement.textContent =
            '✕';

        document.body.appendChild(
            hitmarkerElement
        );

    }


    // ========================================================
    // INFORMACIÓN DEL BLANCO
    // ========================================================

    targetInfoElement =
        document.getElementById(
            'target-info'
        );


    if (
        !targetInfoElement
    ) {

        targetInfoElement =
            document.createElement(
                'div'
            );

        targetInfoElement.id =
            'target-info';


        targetNameElement =
            document.createElement(
                'div'
            );

        targetNameElement.className =
            'target-name';

        targetInfoElement.appendChild(
            targetNameElement
        );


        const healthBar =
            document.createElement(
                'div'
            );

        healthBar.className =
            'target-health-bar';


        targetHealthFillElement =
            document.createElement(
                'div'
            );

        targetHealthFillElement.className =
            'target-health-fill';


        healthBar.appendChild(
            targetHealthFillElement
        );

        targetInfoElement.appendChild(
            healthBar
        );


        targetHealthTextElement =
            document.createElement(
                'div'
            );

        targetHealthTextElement.className =
            'target-health-text';


        targetInfoElement.appendChild(
            targetHealthTextElement
        );


        document.body.appendChild(
            targetInfoElement
        );

    } else {

        targetNameElement =
            targetInfoElement.querySelector(
                '.target-name'
            );

        targetHealthFillElement =
            targetInfoElement.querySelector(
                '.target-health-fill'
            );

        targetHealthTextElement =
            targetInfoElement.querySelector(
                '.target-health-text'
            );

    }


    // ========================================================
    // HUD DEL ARMA
    // ========================================================

    weaponHudElement =
        document.getElementById(
            'weapon-hud'
        );


    if (
        !weaponHudElement
    ) {

        weaponHudElement =
            document.createElement(
                'div'
            );

        weaponHudElement.id =
            'weapon-hud';

        weaponHudElement.innerHTML = `
            <div class="weapon-name">
                ${WEAPON_NAME}
            </div>

            <div class="weapon-ammo">
                <span id="weapon-magazine">
                    ${MAGAZINE_SIZE}
                </span>

                <span class="weapon-divider">
                    /
                </span>

                <span id="weapon-reserve">
                    ${STARTING_RESERVE_AMMO}
                </span>
            </div>

            <div id="weapon-reload">
                R · RECARGAR
            </div>
        `;


        document.body.appendChild(
            weaponHudElement
        );

    }


    magazineElement =
        document.getElementById(
            'weapon-magazine'
        );

    reserveElement =
        document.getElementById(
            'weapon-reserve'
        );

    reloadElement =
        document.getElementById(
            'weapon-reload'
        );


    hideTargetInfo();

    hideHitmarker();

}


// ============================================================
// MODO APUNTADO
// ============================================================

export function setAimingMode(
    active
) {

    aiming =
        active === true;


    if (
        crosshairElement
    ) {

        crosshairElement.classList.toggle(
            'crosshair-aiming',
            aiming
        );


        if (
            !aiming
        ) {

            crosshairElement.classList.remove(
                'crosshair-target'
            );

            crosshairElement.classList.remove(
                'crosshair-fire'
            );

        }

    }


    if (
        !aiming
    ) {

        hideTargetInfo();

        hideHitmarker();

    }

}


// ============================================================
// CONSULTAR APUNTADO
// ============================================================

export function isAimingMode() {

    return aiming;

}


// ============================================================
// OBTENER MUNICIÓN
// ============================================================

export function getAmmoState() {

    return {

        magazine:
            magazineAmmo,

        reserve:
            reserveAmmo,

        magazineSize:
            MAGAZINE_SIZE,

        reloading,

        reloadTime:
            reloadTimer

    };

}


// ============================================================
// COMPROBAR SI PUEDE DISPARAR
// ============================================================

export function canShoot() {

    return (
        sceneRef !== null &&
        cameraRef !== null &&
        cooldown <= 0 &&
        aiming &&
        !reloading &&
        magazineAmmo > 0
    );

}


// ============================================================
// RECARGAR
// ============================================================

export function startReload() {

    if (
        reloading
    ) {

        return false;

    }


    if (
        magazineAmmo >=
        MAGAZINE_SIZE
    ) {

        console.log(
            '🔋 Cargador completo'
        );

        return false;

    }


    if (
        reserveAmmo <=
        0
    ) {

        console.log(
            '❌ Sin munición de reserva'
        );

        return false;

    }


    reloading =
        true;

    reloadTimer =
        RELOAD_TIME;


    crosshairElement
        ?.classList
        .remove(
            'crosshair-fire'
        );


    updateAmmoHUD();


    console.log(
        '🔄 Recargando...'
    );


    return true;

}


// ============================================================
// FINALIZAR RECARGA
// ============================================================

function finishReload() {

    const ammoNeeded =
        MAGAZINE_SIZE -
        magazineAmmo;


    const ammoToLoad =
        Math.min(
            ammoNeeded,
            reserveAmmo
        );


    magazineAmmo +=
        ammoToLoad;

    reserveAmmo -=
        ammoToLoad;


    reloading =
        false;

    reloadTimer =
        0;


    updateAmmoHUD();


    console.log(
        `✅ Recarga completa: ${magazineAmmo}/${reserveAmmo}`
    );

}


// ============================================================
// ACTUALIZAR HUD DE MUNICIÓN
// ============================================================

function updateAmmoHUD() {

    if (
        magazineElement
    ) {

        magazineElement.textContent =
            magazineAmmo;

    }


    if (
        reserveElement
    ) {

        reserveElement.textContent =
            reserveAmmo;

    }


    if (
        weaponHudElement
    ) {

        weaponHudElement.classList.toggle(
            'weapon-empty',
            magazineAmmo === 0
        );


        weaponHudElement.classList.toggle(
            'weapon-reloading',
            reloading
        );

    }


    if (
        reloadElement
    ) {

        if (
            reloading
        ) {

            reloadElement.textContent =
                `RECARGANDO ${reloadTimer.toFixed(1)}s`;

        } else if (
            magazineAmmo === 0 &&
            reserveAmmo > 0
        ) {

            reloadElement.textContent =
                'R · RECARGAR';

        } else if (
            reserveAmmo === 0
        ) {

            reloadElement.textContent =
                'SIN MUNICIÓN DE RESERVA';

        } else {

            reloadElement.textContent =
                'R · RECARGAR';

        }

    }

}


// ============================================================
// OBTENER BLANCOS
// ============================================================

function getShootableTargets() {

    // ========================================================
    // FIGURAS
    // ========================================================

    const dynamicTargets =
        getDynamicObjects()
            .filter(
                (object) =>
                    object.mesh &&
                    object.body &&
                    !object.destroyed &&
                    object.mesh.visible
            )
            .map(
                (object) => ({

                    type:
                        'dynamic',

                    mesh:
                        object.mesh,

                    object

                })
            );


    // ========================================================
    // NÚCLEOS
    // ========================================================

    const objectiveTargets =
        getObjectiveTargets()
            .map(
                (target) => ({

                    type:
                        'objective',

                    mesh:
                        target.mesh,

                    objective:
                        target.objective

                })
            );


    return [
        ...dynamicTargets,
        ...objectiveTargets
    ];

}


// ============================================================
// CALCULAR APUNTADO
// ============================================================

function calculateAim() {

    raycaster.setFromCamera(
        screenCenter,
        cameraRef
    );


    raycaster.far =
        MAX_DISTANCE;


    const targets =
        getShootableTargets();


    const targetMeshes =
        targets.map(
            (target) =>
                target.mesh
        );


    // ========================================================
    // INTERSECCIONES CON OBJETIVOS
    // ========================================================

    const targetHits =
        targetMeshes.length > 0
            ?
            raycaster.intersectObjects(
                targetMeshes,
                false
            )
            :
            [];


    // ========================================================
    // ESCENARIO
    // ========================================================

    const validEnvironmentMeshes =
        environmentMeshesRef.filter(
            (mesh) =>
                mesh &&
                mesh.visible
        );


    const environmentHits =
        validEnvironmentMeshes.length > 0
            ?
            raycaster.intersectObjects(
                validEnvironmentMeshes,
                false
            )
            :
            [];


    const targetHit =
        targetHits.length > 0
            ?
            targetHits[0]
            :
            null;


    const environmentHit =
        environmentHits.length > 0
            ?
            environmentHits[0]
            :
            null;


    // ========================================================
    // OBJETIVO DELANTE DEL ESCENARIO
    // ========================================================

    if (
        targetHit &&
        (
            !environmentHit ||
            targetHit.distance <=
                environmentHit.distance +
                0.03
        )
    ) {

        const target =
            targets.find(
                (item) =>
                    item.mesh ===
                    targetHit.object
            );


        return {

            type:
                'target',

            hit:
                targetHit,

            target,

            point:
                targetHit.point.clone()

        };

    }


    // ========================================================
    // ESCENARIO
    // ========================================================

    if (
        environmentHit
    ) {

        return {

            type:
                'environment',

            hit:
                environmentHit,

            target:
                null,

            point:
                environmentHit.point.clone()

        };

    }


    // ========================================================
    // DISPARO AL AIRE
    // ========================================================

    return {

        type:
            'miss',

        hit:
            null,

        target:
            null,

        point:
            raycaster.ray.origin
                .clone()
                .addScaledVector(
                    raycaster.ray.direction,
                    MAX_DISTANCE
                )

    };

}


// ============================================================
// CALCULAR NORMAL DE IMPACTO
// ============================================================

function getImpactNormal(
    hit
) {

    if (
        !hit ||
        !hit.face
    ) {

        return raycaster.ray.direction
            .clone()
            .multiplyScalar(
                -1
            )
            .normalize();

    }


    normalMatrix.getNormalMatrix(
        hit.object.matrixWorld
    );


    worldNormal
        .copy(
            hit.face.normal
        )
        .applyMatrix3(
            normalMatrix
        )
        .normalize();


    return worldNormal.clone();

}


// ============================================================
// ACTUALIZAR HUD DEL BLANCO
// ============================================================

function updateAimingHUD() {

    if (
        !crosshairElement ||
        !cameraRef
    ) {

        return;

    }


    if (
        !aiming
    ) {

        crosshairElement.classList.remove(
            'crosshair-target'
        );

        hideTargetInfo();

        return;

    }


    const aim =
        calculateAim();


    const hasTarget =
        aim.type ===
            'target' &&
        aim.target;


    crosshairElement.classList.toggle(
        'crosshair-target',
        Boolean(
            hasTarget
        )
    );


    if (
        hasTarget
    ) {

        showTargetInfo(
            aim.target
        );

    } else {

        hideTargetInfo();

    }

}


// ============================================================
// MOSTRAR INFORMACIÓN DEL BLANCO
// ============================================================

function showTargetInfo(
    target
) {

    if (
        !targetInfoElement
    ) {

        return;

    }


    let name =
        'OBJETIVO';

    let health =
        0;

    let maxHealth =
        100;


    // ========================================================
    // FIGURA
    // ========================================================

    if (
        target.type ===
        'dynamic'
    ) {

        name =
            'OBJETO DE ENTRENAMIENTO';

        health =
            target.object.health;

        maxHealth =
            target.object.maxHealth;

    }


    // ========================================================
    // NÚCLEO
    // ========================================================

    if (
        target.type ===
        'objective'
    ) {

        name =
            'NÚCLEO DE ENERGÍA';

        health =
            target.objective.health;

        maxHealth =
            target.objective.maxHealth;

    }


    health =
        Math.max(
            0,
            health
        );


    const percentage =
        THREE.MathUtils.clamp(

            (
                health /
                Math.max(
                    maxHealth,
                    1
                )
            ) *
            100,

            0,

            100

        );


    if (
        targetNameElement
    ) {

        targetNameElement.textContent =
            name;

    }


    if (
        targetHealthTextElement
    ) {

        targetHealthTextElement.textContent =
            `${Math.ceil(health)} / ${maxHealth}`;

    }


    if (
        targetHealthFillElement
    ) {

        targetHealthFillElement.style.width =
            `${percentage}%`;

    }


    targetInfoElement.classList.add(
        'target-info-visible'
    );

}


// ============================================================
// OCULTAR INFORMACIÓN
// ============================================================

function hideTargetInfo() {

    targetInfoElement
        ?.classList
        .remove(
            'target-info-visible'
        );

}


// ============================================================
// EFECTO DE CROSSHAIR AL DISPARAR
// ============================================================

function triggerCrosshairFire() {

    if (
        !crosshairElement
    ) {

        return;

    }


    crosshairFireTimer =
        CROSSHAIR_FIRE_DURATION;


    crosshairElement.classList.add(
        'crosshair-fire'
    );

}


// ============================================================
// HITMARKER
// ============================================================

function showHitmarker(
    destroyed =
        false
) {

    if (
        !hitmarkerElement
    ) {

        return;

    }


    hitmarkerTimer =
        HITMARKER_DURATION;


    hitmarkerElement.classList.add(
        'hitmarker-visible'
    );


    hitmarkerElement.classList.toggle(
        'hitmarker-destroyed',
        destroyed
    );

}


// ============================================================
// OCULTAR HITMARKER
// ============================================================

function hideHitmarker() {

    if (
        !hitmarkerElement
    ) {

        return;

    }


    hitmarkerElement.classList.remove(
        'hitmarker-visible'
    );


    hitmarkerElement.classList.remove(
        'hitmarker-destroyed'
    );

}


// ============================================================
// DISPARAR
// ============================================================

export function shoot(
    characterRoot
) {

    // ========================================================
    // RECARGANDO
    // ========================================================

    if (
        reloading
    ) {

        return false;

    }


    // ========================================================
    // SIN MUNICIÓN
    // ========================================================

    if (
        magazineAmmo <=
        0
    ) {

        updateAmmoHUD();


        console.log(
            '🔴 Cargador vacío · Presiona R'
        );


        return false;

    }


    // ========================================================
    // COOLDOWN / APUNTADO
    // ========================================================

    if (
        !canShoot()
    ) {

        return false;

    }


    // ========================================================
    // CONSUMIR BALA
    // ========================================================

    magazineAmmo--;


    updateAmmoHUD();


    cooldown =
        FIRE_COOLDOWN;


    triggerCrosshairFire();


    // ========================================================
    // CALCULAR DISPARO
    // ========================================================

    const aim =
        calculateAim();


    cameraRef.getWorldDirection(
        cameraDirection
    );


    cameraDirection.normalize();


    // ========================================================
    // POSICIÓN DE SALIDA
    // ========================================================

    muzzlePosition.copy(
        characterRoot.position
    );


    muzzlePosition.y +=
        1.06;


    muzzlePosition.addScaledVector(
        cameraDirection,
        0.58
    );


    // ========================================================
    // MUZZLE FLASH
    // ========================================================

    createMuzzleFlash(
        muzzlePosition
    );


    // ========================================================
    // PROYECTIL VISUAL
    // ========================================================

    createProjectile(
        muzzlePosition,
        aim.point
    );


    // ========================================================
    // IMPACTO EN OBJETIVO
    // ========================================================

    if (
        aim.type ===
            'target' &&
        aim.target
    ) {

        const result =
            handleTargetImpact(
                aim.target,
                aim.hit
            );


        showHitmarker(
            result.destroyed
        );


        return true;

    }


    // ========================================================
    // IMPACTO EN PARED / PISO / ESCENARIO
    // ========================================================

    if (
        aim.type ===
        'environment'
    ) {

        const normal =
            getImpactNormal(
                aim.hit
            );


        // CHISPAS
        createImpactBurst(
            aim.point,
            normal,
            0xffd27a,
            false
        );


        // FLASH DE LUZ
        createImpactLight(
            aim.point,
            0xffc46b,
            2.8
        );


        // ONDA VISUAL
        createShockwave(
            aim.point,
            normal,
            0xffd27a,
            0.35
        );

    }


    return true;

}


// ============================================================
// IMPACTO EN BLANCO
// ============================================================

function handleTargetImpact(
    target,
    hit
) {

    const normal =
        getImpactNormal(
            hit
        );


    // ========================================================
    // FIGURA DINÁMICA
    // ========================================================

    if (
        target.type ===
        'dynamic'
    ) {

        const result =
            damageDynamicObject(
                target.object,
                BULLET_DAMAGE
            );


        // ====================================================
        // DESTRUIDO
        // ====================================================

        if (
            result.destroyed
        ) {

            createDestructionEffect(
                hit.point,
                normal,
                0xff9f1c
            );

        } else {

            // =================================================
            // IMPULSO FÍSICO
            // =================================================

            impactDirection.copy(
                raycaster.ray.direction
            );


            impactDirection.y +=
                0.06;


            impactDirection.normalize();


            target.object.body.applyImpulse(

                {

                    x:
                        impactDirection.x *
                        SHOOT_FORCE,

                    y:
                        impactDirection.y *
                            SHOOT_FORCE +
                        UP_FORCE,

                    z:
                        impactDirection.z *
                        SHOOT_FORCE

                },

                true

            );


            // =================================================
            // TORQUE
            // =================================================

            target.object.body
                .applyTorqueImpulse(

                    {

                        x:
                            THREE.MathUtils.randFloat(
                                -1.2,
                                1.2
                            ),

                        y:
                            THREE.MathUtils.randFloat(
                                -0.8,
                                0.8
                            ),

                        z:
                            THREE.MathUtils.randFloat(
                                -1.2,
                                1.2
                            )

                    },

                    true

                );


            // =================================================
            // CHISPAS
            // =================================================

            createImpactBurst(
                hit.point,
                normal,
                0xffb300,
                false
            );


            // =================================================
            // LUZ
            // =================================================

            createImpactLight(
                hit.point,
                0xffb300,
                3.4
            );


            // =================================================
            // ONDA VISUAL
            // =================================================

            createShockwave(
                hit.point,
                normal,
                0xffc107,
                0.42
            );

        }


        return {

            destroyed:
                result.destroyed

        };

    }


    // ========================================================
    // NÚCLEO DE ENERGÍA
    // ========================================================

    if (
        target.type ===
        'objective'
    ) {

        const result =
            damageObjectiveByMesh(
                hit.object,
                BULLET_DAMAGE
            ) || {};


        // ====================================================
        // SOPORTE PARA OBJECTIVES.JS
        // ====================================================

        const destroyed =
            result.destroyed === true ||
            target.objective.destroyed === true;


        // ====================================================
        // DESTRUCCIÓN
        // ====================================================

        if (
            destroyed
        ) {

            createDestructionEffect(
                hit.point,
                normal,
                0x00eaff
            );

        } else {

            // =================================================
            // PARTÍCULAS CYAN
            // =================================================

            createImpactBurst(
                hit.point,
                normal,
                0x00eaff,
                false
            );


            // =================================================
            // LUZ CYAN
            // =================================================

            createImpactLight(
                hit.point,
                0x00eaff,
                4
            );


            // =================================================
            // ONDA CYAN
            // =================================================

            createShockwave(
                hit.point,
                normal,
                0x00eaff,
                0.48
            );

        }


        return {

            destroyed

        };

    }


    return {

        destroyed:
            false

    };

}


// ============================================================
// CREAR PROYECTIL VISUAL
// ============================================================

function createProjectile(
    start,
    end
) {

    if (
        !sceneRef
    ) {

        return;

    }


    const direction =
        end
            .clone()
            .sub(
                start
            );


    const maxTravel =
        direction.length();


    if (
        maxTravel <=
        0.01
    ) {

        return;

    }


    direction.normalize();


    // ========================================================
    // GEOMETRÍA
    // ========================================================

    const geometry =
        new THREE.CylinderGeometry(
            PROJECTILE_RADIUS,
            PROJECTILE_RADIUS,
            PROJECTILE_LENGTH,
            6
        );


    // ========================================================
    // MATERIAL
    // ========================================================

    const material =
        new THREE.MeshBasicMaterial({

            color:
                0xffe082,

            transparent:
                true,

            opacity:
                0.95,

            blending:
                THREE.AdditiveBlending,

            depthWrite:
                false

        });


    const projectile =
        new THREE.Mesh(
            geometry,
            material
        );


    projectile.position.copy(
        start
    );


    // ========================================================
    // ORIENTAR HACIA EL OBJETIVO
    // ========================================================

    projectile.quaternion
        .setFromUnitVectors(

            new THREE.Vector3(
                0,
                1,
                0
            ),

            direction

        );


    sceneRef.add(
        projectile
    );


    projectiles.push({

        mesh:
            projectile,

        direction,

        travelled:
            0,

        maxTravel

    });

}


// ============================================================
// ACTUALIZAR PROYECTILES
// ============================================================

function updateProjectiles(
    delta
) {

    for (
        let i =
            projectiles.length -
            1;
        i >= 0;
        i--
    ) {

        const projectile =
            projectiles[i];


        const movement =
            PROJECTILE_SPEED *
            delta;


        projectile.mesh.position
            .addScaledVector(
                projectile.direction,
                movement
            );


        projectile.travelled +=
            movement;


        // ====================================================
        // LLEGÓ AL DESTINO
        // ====================================================

        if (
            projectile.travelled >=
            projectile.maxTravel
        ) {

            sceneRef.remove(
                projectile.mesh
            );


            disposeObject(
                projectile.mesh
            );


            projectiles.splice(
                i,
                1
            );

        }

    }

}


// ============================================================
// MUZZLE FLASH
// ============================================================

function createMuzzleFlash(
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


    // ========================================================
    // FLASH
    // ========================================================

    const flash =
        new THREE.Mesh(

            new THREE.SphereGeometry(
                0.10,
                8,
                8
            ),

            new THREE.MeshBasicMaterial({

                color:
                    0xffe082,

                transparent:
                    true,

                opacity:
                    1,

                blending:
                    THREE.AdditiveBlending,

                depthWrite:
                    false

            })

        );


    group.add(
        flash
    );


    // ========================================================
    // LUZ
    // ========================================================

    const light =
        new THREE.PointLight(
            0xffd54f,
            6,
            2.5,
            2
        );


    group.add(
        light
    );


    effects.push({

        type:
            'muzzle',

        object:
            group,

        flash,

        light,

        age:
            0,

        duration:
            MUZZLE_FLASH_DURATION

    });

}


// ============================================================
// PARTÍCULAS DE IMPACTO
// ============================================================

function createImpactBurst(
    position,
    normal,
    color,
    strong =
        false
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


    const count =
        strong
            ?
            28
            :
            14;


    // ========================================================
    // GENERAR PARTÍCULAS
    // ========================================================

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const size =
            THREE.MathUtils.randFloat(
                0.018,
                strong
                    ?
                    0.075
                    :
                    0.050
            );


        const geometry =
            new THREE.SphereGeometry(
                size,
                5,
                5
            );


        const material =
            new THREE.MeshBasicMaterial({

                color,

                transparent:
                    true,

                opacity:
                    1,

                blending:
                    THREE.AdditiveBlending,

                depthWrite:
                    false

            });


        const particle =
            new THREE.Mesh(
                geometry,
                material
            );


        // ====================================================
        // VELOCIDAD
        // ====================================================

        const velocity =
            normal
                .clone()
                .multiplyScalar(
                    THREE.MathUtils.randFloat(
                        0.8,
                        strong
                            ?
                            4.5
                            :
                            2.8
                    )
                );


        velocity.x +=
            THREE.MathUtils.randFloatSpread(
                strong
                    ?
                    3.5
                    :
                    2
            );


        velocity.y +=
            THREE.MathUtils.randFloat(
                0.1,
                strong
                    ?
                    2.8
                    :
                    1.6
            );


        velocity.z +=
            THREE.MathUtils.randFloatSpread(
                strong
                    ?
                    3.5
                    :
                    2
            );


        particle.userData.velocity =
            velocity;


        particle.userData.spin =
            new THREE.Vector3(

                THREE.MathUtils.randFloatSpread(
                    10
                ),

                THREE.MathUtils.randFloatSpread(
                    10
                ),

                THREE.MathUtils.randFloatSpread(
                    10
                )

            );


        group.add(
            particle
        );


        particles.push(
            particle
        );

    }


    effects.push({

        type:
            'impact',

        object:
            group,

        particles,

        age:
            0,

        duration:
            strong
                ?
                DESTRUCTION_DURATION
                :
                IMPACT_DURATION

    });

}


// ============================================================
// LUZ DE IMPACTO
// ============================================================

function createImpactLight(
    position,
    color,
    intensity =
        3
) {

    if (
        !sceneRef
    ) {

        return;

    }


    const light =
        new THREE.PointLight(

            color,

            intensity,

            4,

            2

        );


    light.position.copy(
        position
    );


    sceneRef.add(
        light
    );


    effects.push({

        type:
            'light',

        object:
            light,

        light,

        originalIntensity:
            intensity,

        age:
            0,

        duration:
            IMPACT_LIGHT_DURATION

    });

}


// ============================================================
// ONDA VISUAL
// ============================================================

function createShockwave(
    position,
    normal,
    color,
    size =
        0.4
) {

    if (
        !sceneRef
    ) {

        return;

    }


    const geometry =
        new THREE.RingGeometry(
            size *
            0.35,
            size,
            28
        );


    const material =
        new THREE.MeshBasicMaterial({

            color,

            transparent:
                true,

            opacity:
                0.75,

            side:
                THREE.DoubleSide,

            blending:
                THREE.AdditiveBlending,

            depthWrite:
                false

        });


    const ring =
        new THREE.Mesh(
            geometry,
            material
        );


    // ========================================================
    // POSICIÓN
    // ========================================================

    ring.position
        .copy(
            position
        )
        .addScaledVector(
            normal,
            0.018
        );


    // ========================================================
    // ORIENTAR A LA SUPERFICIE
    // ========================================================

    ring.quaternion
        .setFromUnitVectors(

            new THREE.Vector3(
                0,
                0,
                1
            ),

            normal

        );


    ring.scale.setScalar(
        0.25
    );


    sceneRef.add(
        ring
    );


    effects.push({

        type:
            'shockwave',

        object:
            ring,

        ring,

        age:
            0,

        duration:
            SHOCKWAVE_DURATION

    });

}


// ============================================================
// EFECTO DE DESTRUCCIÓN
// ============================================================

function createDestructionEffect(
    position,
    normal,
    color
) {

    // ========================================================
    // MUCHAS PARTÍCULAS
    // ========================================================

    createImpactBurst(
        position,
        normal,
        color,
        true
    );


    // ========================================================
    // FLASH FUERTE
    // ========================================================

    createImpactLight(
        position,
        color,
        7
    );


    // ========================================================
    // ONDA MÁS GRANDE
    // ========================================================

    createShockwave(
        position,
        normal,
        color,
        0.85
    );

}


// ============================================================
// ACTUALIZAR TODOS LOS EFECTOS
// ============================================================

function updateEffects(
    delta
) {

    for (
        let i =
            effects.length -
            1;
        i >= 0;
        i--
    ) {

        const effect =
            effects[i];


        effect.age +=
            delta;


        const progress =
            THREE.MathUtils.clamp(

                effect.age /
                effect.duration,

                0,

                1

            );


        // ====================================================
        // MUZZLE FLASH
        // ====================================================

        if (
            effect.type ===
            'muzzle'
        ) {

            effect.flash.scale.setScalar(
                1 +
                progress *
                2.2
            );


            effect.flash.material.opacity =
                1 -
                progress;


            effect.light.intensity =
                6 *
                (
                    1 -
                    progress
                );

        }


        // ====================================================
        // PARTÍCULAS
        // ====================================================

        if (
            effect.type ===
            'impact'
        ) {

            for (
                const particle of
                effect.particles
            ) {

                // =============================================
                // MOVIMIENTO
                // =============================================

                particle.position
                    .addScaledVector(
                        particle.userData.velocity,
                        delta
                    );


                // =============================================
                // GRAVEDAD
                // =============================================

                particle.userData.velocity.y -=
                    5.5 *
                    delta;


                // =============================================
                // ROTACIÓN
                // =============================================

                particle.rotation.x +=
                    particle.userData.spin.x *
                    delta;


                particle.rotation.y +=
                    particle.userData.spin.y *
                    delta;


                particle.rotation.z +=
                    particle.userData.spin.z *
                    delta;


                // =============================================
                // DESVANECER
                // =============================================

                particle.material.opacity =
                    1 -
                    progress;


                // =============================================
                // ENCOGER
                // =============================================

                particle.scale.setScalar(

                    Math.max(

                        0.05,

                        1 -
                        progress *
                        0.75

                    )

                );

            }

        }


        // ====================================================
        // LUZ
        // ====================================================

        if (
            effect.type ===
            'light'
        ) {

            effect.light.intensity =
                effect.originalIntensity *
                (
                    1 -
                    progress
                );

        }


        // ====================================================
        // ONDA VISUAL
        // ====================================================

        if (
            effect.type ===
            'shockwave'
        ) {

            const scale =
                THREE.MathUtils.lerp(
                    0.25,
                    2.4,
                    progress
                );


            effect.ring.scale.setScalar(
                scale
            );


            effect.ring.material.opacity =
                (
                    1 -
                    progress
                ) *
                0.75;

        }


        // ====================================================
        // ELIMINAR EFECTO
        // ====================================================

        if (
            progress >=
            1
        ) {

            sceneRef.remove(
                effect.object
            );


            disposeObject(
                effect.object
            );


            effects.splice(
                i,
                1
            );

        }

    }

}


// ============================================================
// ACTUALIZAR UI DE COMBATE
// ============================================================

function updateCombatUI(
    delta
) {

    // ========================================================
    // CROSSHAIR
    // ========================================================

    if (
        crosshairFireTimer >
        0
    ) {

        crosshairFireTimer -=
            delta;


        if (
            crosshairFireTimer <=
            0
        ) {

            crosshairFireTimer =
                0;


            crosshairElement
                ?.classList
                .remove(
                    'crosshair-fire'
                );

        }

    }


    // ========================================================
    // HITMARKER
    // ========================================================

    if (
        hitmarkerTimer >
        0
    ) {

        hitmarkerTimer -=
            delta;


        if (
            hitmarkerTimer <=
            0
        ) {

            hitmarkerTimer =
                0;


            hideHitmarker();

        }

    }

}


// ============================================================
// ACTUALIZAR RECARGA
// ============================================================

function updateReload(
    delta
) {

    if (
        !reloading
    ) {

        return;

    }


    reloadTimer -=
        delta;


    if (
        reloadTimer <=
        0
    ) {

        finishReload();

        return;

    }


    updateAmmoHUD();

}


// ============================================================
// UPDATE PRINCIPAL
// ============================================================

export function updateShooting(
    delta
) {

    // ========================================================
    // COOLDOWN
    // ========================================================

    if (
        cooldown >
        0
    ) {

        cooldown =
            Math.max(
                0,
                cooldown -
                delta
            );

    }


    // ========================================================
    // RECARGA
    // ========================================================

    updateReload(
        delta
    );


    // ========================================================
    // HUD DE APUNTADO
    // ========================================================

    updateAimingHUD();


    // ========================================================
    // PROYECTILES
    // ========================================================

    updateProjectiles(
        delta
    );


    // ========================================================
    // EFECTOS
    // ========================================================

    updateEffects(
        delta
    );


    // ========================================================
    // UI
    // ========================================================

    updateCombatUI(
        delta
    );

}


// ============================================================
// RESET COMPLETO
// ============================================================

export function resetShooting() {

    cooldown =
        0;


    crosshairFireTimer =
        0;


    hitmarkerTimer =
        0;


    // ========================================================
    // MUNICIÓN
    // ========================================================

    magazineAmmo =
        MAGAZINE_SIZE;


    reserveAmmo =
        STARTING_RESERVE_AMMO;


    // ========================================================
    // RECARGA
    // ========================================================

    reloading =
        false;


    reloadTimer =
        0;


    // ========================================================
    // APUNTADO
    // ========================================================

    setAimingMode(
        false
    );


    hideTargetInfo();


    hideHitmarker();


    crosshairElement
        ?.classList
        .remove(
            'crosshair-fire'
        );


    // ========================================================
    // ELIMINAR PROYECTILES
    // ========================================================

    for (
        const projectile of
        projectiles
    ) {

        sceneRef?.remove(
            projectile.mesh
        );


        disposeObject(
            projectile.mesh
        );

    }


    projectiles.length =
        0;


    // ========================================================
    // ELIMINAR EFECTOS
    // ========================================================

    for (
        const effect of
        effects
    ) {

        sceneRef?.remove(
            effect.object
        );


        disposeObject(
            effect.object
        );

    }


    effects.length =
        0;


    // ========================================================
    // RESTAURAR HUD
    // ========================================================

    updateAmmoHUD();

}


// ============================================================
// LIBERAR GEOMETRÍAS Y MATERIALES
// ============================================================

function disposeObject(
    object
) {

    if (
        !object
    ) {

        return;

    }


    object.traverse?.(

        (child) => {

            // =================================================
            // GEOMETRÍA
            // =================================================

            if (
                child.geometry
            ) {

                child.geometry.dispose();

            }


            // =================================================
            // MATERIAL
            // =================================================

            if (
                child.material
            ) {

                if (
                    Array.isArray(
                        child.material
                    )
                ) {

                    child.material.forEach(
                        (material) => {

                            material.dispose();

                        }
                    );

                } else {

                    child.material.dispose();

                }

            }

        }

    );

}