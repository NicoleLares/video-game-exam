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
// CONFIGURACIÓN
// ============================================================

const MAX_DISTANCE = 70;

const BULLET_DAMAGE = 40;

const SHOOT_FORCE = 8;

const UP_FORCE = 0.8;

const FIRE_COOLDOWN = 0.16;


// ============================================================
// MUNICIÓN
// ============================================================

const MAGAZINE_SIZE = 30;

const STARTING_RESERVE_AMMO = 90;

const RELOAD_TIME = 1.5;

const WEAPON_NAME = 'AR-15';


// ============================================================
// PROYECTIL
// ============================================================

const PROJECTILE_SPEED = 55;

const PROJECTILE_LENGTH = 0.34;

const PROJECTILE_RADIUS = 0.025;


// ============================================================
// EFECTOS
// ============================================================

const IMPACT_DURATION = 0.28;

const DESTRUCTION_DURATION = 0.55;

const MUZZLE_FLASH_DURATION = 0.08;

const CROSSHAIR_FIRE_DURATION = 0.10;

const HITMARKER_DURATION = 0.15;


// ============================================================
// REFERENCIAS
// ============================================================

let sceneRef = null;

let cameraRef = null;

let environmentMeshesRef = [];


// ============================================================
// ESTADO DEL ARMA
// ============================================================

let cooldown = 0;

let aiming = false;

let magazineAmmo = MAGAZINE_SIZE;

let reserveAmmo = STARTING_RESERVE_AMMO;

let reloading = false;

let reloadTimer = 0;


// ============================================================
// HUD
// ============================================================

let crosshairElement = null;

let hitmarkerElement = null;

let targetInfoElement = null;

let targetNameElement = null;

let targetHealthFillElement = null;

let targetHealthTextElement = null;

let weaponHudElement = null;

let magazineElement = null;

let reserveElement = null;

let reloadElement = null;


// ============================================================
// TEMPORIZADORES
// ============================================================

let crosshairFireTimer = 0;

let hitmarkerTimer = 0;


// ============================================================
// RAYCAST
// ============================================================

const raycaster =
    new THREE.Raycaster();


const screenCenter =
    new THREE.Vector2(
        0,
        0
    );


// ============================================================
// VECTORES
// ============================================================

const muzzlePosition =
    new THREE.Vector3();


const cameraDirection =
    new THREE.Vector3();


const impactDirection =
    new THREE.Vector3();


// ============================================================
// EFECTOS ACTIVOS
// ============================================================

const projectiles = [];

const effects = [];


// ============================================================
// INICIALIZAR
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
        '🔫 Sistema de disparo v1.0.4 listo'
    );

}


// ============================================================
// CREAR HUD
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
    // VIDA DEL OBJETIVO
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
// APUNTADO
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
// ESTADO APUNTADO
// ============================================================

export function isAimingMode() {

    return aiming;

}


// ============================================================
// MUNICIÓN
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
// PUEDE DISPARAR
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
// TERMINAR RECARGA
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
// ACTUALIZAR HUD MUNICIÓN
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
// BLANCOS
// ============================================================

function getShootableTargets() {

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


    const targetHits =
        targetMeshes.length > 0
            ?
            raycaster.intersectObjects(
                targetMeshes,
                false
            )
            :
            [];


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


    const farPoint =
        raycaster.ray.origin
            .clone()
            .addScaledVector(
                raycaster.ray.direction,
                MAX_DISTANCE
            );


    return {

        type:
            'miss',

        hit:
            null,

        target:
            null,

        point:
            farPoint

    };

}


// ============================================================
// HUD APUNTADO
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
// INFORMACIÓN OBJETIVO
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
                maxHealth
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
// OCULTAR INFO
// ============================================================

function hideTargetInfo() {

    targetInfoElement
        ?.classList
        .remove(
            'target-info-visible'
        );

}


// ============================================================
// MIRA AL DISPARAR
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
    destroyed = false
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
    // SIN BALAS
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


    if (
        !canShoot()
    ) {

        return false;

    }


    // ========================================================
    // CONSUMIR BALA
    // ========================================================

    magazineAmmo -=
        1;


    updateAmmoHUD();


    cooldown =
        FIRE_COOLDOWN;


    triggerCrosshairFire();


    const aim =
        calculateAim();


    console.log(
        `🔫 DISPARO · ${magazineAmmo}/${reserveAmmo}`
    );


    // ========================================================
    // DIRECCIÓN
    // ========================================================

    cameraRef.getWorldDirection(
        cameraDirection
    );


    cameraDirection.normalize();


    // ========================================================
    // ORIGEN VISUAL
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


    createMuzzleFlash(
        muzzlePosition
    );


    createProjectile(
        muzzlePosition,
        aim.point
    );


    // ========================================================
    // BLANCO
    // ========================================================

    if (
        aim.type ===
        'target' &&
        aim.target
    ) {

        const impactResult =
            handleTargetImpact(
                aim.target,
                aim.hit
            );


        showHitmarker(
            impactResult.destroyed
        );


        return true;

    }


    // ========================================================
    // ESCENARIO
    // ========================================================

    if (
        aim.type ===
        'environment'
    ) {

        createImpactEffect(
            aim.point,
            0xffffff
        );


        return true;

    }


    return true;

}


// ============================================================
// IMPACTO
// ============================================================

function handleTargetImpact(
    target,
    hit
) {

    // ========================================================
    // OBJETO DINÁMICO
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


        if (
            result.destroyed
        ) {

            createDestructionEffect(
                hit.point,
                0xff9f1c
            );

        } else {

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


            createImpactEffect(
                hit.point,
                0xffb300
            );

        }


        return {

            destroyed:
                result.destroyed

        };

    }


    // ========================================================
    // NÚCLEO
    // ========================================================

    if (
        target.type ===
        'objective'
    ) {

        const result =
            damageObjectiveByMesh(
                hit.object,
                BULLET_DAMAGE
            );


        if (
            !result.destroyed
        ) {

            createImpactEffect(
                hit.point,
                0x00eaff
            );

        }


        return {

            destroyed:
                result.destroyed

        };

    }


    return {

        destroyed:
            false

    };

}


// ============================================================
// PROYECTIL
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


    const geometry =
        new THREE.CylinderGeometry(
            PROJECTILE_RADIUS,
            PROJECTILE_RADIUS,
            PROJECTILE_LENGTH,
            6
        );


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
// IMPACTO
// ============================================================

function createImpactEffect(
    position,
    color
) {

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
        i < 10;
        i++
    ) {

        const particle =
            new THREE.Mesh(

                new THREE.SphereGeometry(
                    0.025,
                    5,
                    5
                ),

                new THREE.MeshBasicMaterial({

                    color,

                    transparent:
                        true,

                    opacity:
                        1

                })

            );


        particle.userData.velocity =
            new THREE.Vector3(

                Math.random() *
                2 -
                1,

                Math.random() *
                1.4 +
                0.1,

                Math.random() *
                2 -
                1

            )
                .normalize()
                .multiplyScalar(
                    THREE.MathUtils.randFloat(
                        1,
                        2.8
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
            IMPACT_DURATION

    });

}


// ============================================================
// DESTRUCCIÓN
// ============================================================

function createDestructionEffect(
    position,
    color
) {

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
        i < 22;
        i++
    ) {

        const size =
            THREE.MathUtils.randFloat(
                0.035,
                0.095
            );


        const fragment =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    size,
                    size,
                    size
                ),

                new THREE.MeshBasicMaterial({

                    color,

                    transparent:
                        true,

                    opacity:
                        1

                })

            );


        fragment.userData.velocity =
            new THREE.Vector3(

                Math.random() *
                2 -
                1,

                Math.random() *
                1.6 +
                0.3,

                Math.random() *
                2 -
                1

            )
                .normalize()
                .multiplyScalar(
                    THREE.MathUtils.randFloat(
                        2,
                        4.5
                    )
                );


        group.add(
            fragment
        );


        particles.push(
            fragment
        );

    }


    effects.push({

        type:
            'destruction',

        object:
            group,

        particles,

        age:
            0,

        duration:
            DESTRUCTION_DURATION

    });

}


// ============================================================
// ACTUALIZAR EFECTOS
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


        if (
            effect.type ===
            'muzzle'
        ) {

            effect.flash.scale
                .setScalar(
                    1 +
                    progress *
                    2
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


        if (
            effect.type ===
            'impact' ||
            effect.type ===
            'destruction'
        ) {

            for (
                const particle of
                effect.particles
            ) {

                particle.position
                    .addScaledVector(
                        particle
                            .userData
                            .velocity,
                        delta
                    );


                particle
                    .userData
                    .velocity
                    .y -=
                    3.8 *
                    delta;


                particle.rotation.x +=
                    delta *
                    7;


                particle.rotation.z +=
                    delta *
                    5;


                particle.material.opacity =
                    1 -
                    progress;

            }

        }


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
// UI
// ============================================================

function updateCombatUI(
    delta
) {

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
// UPDATE RECARGA
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
// UPDATE
// ============================================================

export function updateShooting(
    delta
) {

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


    updateReload(
        delta
    );


    updateAimingHUD();


    updateProjectiles(
        delta
    );


    updateEffects(
        delta
    );


    updateCombatUI(
        delta
    );

}


// ============================================================
// RESET
// ============================================================

export function resetShooting() {

    cooldown =
        0;


    crosshairFireTimer =
        0;


    hitmarkerTimer =
        0;


    magazineAmmo =
        MAGAZINE_SIZE;


    reserveAmmo =
        STARTING_RESERVE_AMMO;


    reloading =
        false;


    reloadTimer =
        0;


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


    updateAmmoHUD();

}


// ============================================================
// DISPOSE
// ============================================================

function disposeObject(
    object
) {

    if (
        !object
    ) {

        return;

    }


    object.traverse(
        (child) => {

            if (
                child.geometry
            ) {

                child.geometry.dispose();

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

                    child.material.dispose();

                }

            }

        }
    );

}