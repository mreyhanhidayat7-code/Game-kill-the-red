/* =====================================================
   KILL THE RED
   MAIN GAME ENGINE
===================================================== */


/* =====================================================
   CANVAS
===================================================== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

function resizeCanvas() {

    W = window.innerWidth;
    H = window.innerHeight;

    const dpr =
        Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* =====================================================
   SCREENS
===================================================== */

const loginScreen =
    document.getElementById("loginScreen");

const menuScreen =
    document.getElementById("menuScreen");

const gameScreen =
    document.getElementById("gameScreen");

const leaderboardScreen =
    document.getElementById(
        "leaderboardScreen"
    );

let currentUsername = "";


/* =====================================================
   GAME VARIABLES
===================================================== */

let running = false;

let animationId = null;

let level = 1;

let score = 0;

let player = null;

let enemies = [];

let projectiles = [];

let enemyProjectiles = [];

let particles = [];

let lastTime = 0;

let spawnTimer = 0;

let mouseX = W / 2;

let mouseY = H / 2;

let moveX = 0;

let moveY = 0;

let cheatActive = false;


/* =====================================================
   LOGIN
===================================================== */

document
    .getElementById("loginBtn")
    .addEventListener(
        "click",
        login
    );


function login() {

    const username =
        document
            .getElementById("username")
            .value
            .trim();

    const password =
        document
            .getElementById("password")
            .value;

    const message =
        document
            .getElementById("loginMessage");


    if (!username || !password) {

        message.textContent =
            "Username dan password wajib diisi.";

        return;
    }


    currentUsername = username;

    document
        .getElementById("playerName")
        .textContent = username;


    message.textContent = "";


    loginScreen
        .classList
        .add("hidden");

    menuScreen
        .classList
        .remove("hidden");
}


/* =====================================================
   MENU
===================================================== */

document
    .getElementById("startBtn")
    .addEventListener(
        "click",
        () => {

            menuScreen
                .classList
                .add("hidden");

            gameScreen
                .classList
                .remove("hidden");

            startGame();
        }
    );


/* LOGOUT */

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        logout
    );


function logout() {

    stopGame();

    currentUsername = "";

    gameScreen
        .classList
        .add("hidden");

    menuScreen
        .classList
        .add("hidden");

    leaderboardScreen
        .classList
        .add("hidden");

    loginScreen
        .classList
        .remove("hidden");

    document
        .getElementById("username")
        .value = "";

    document
        .getElementById("password")
        .value = "";
}


/* =====================================================
   LEADERBOARD
===================================================== */

document
    .getElementById("leaderboardBtn")
    .addEventListener(
        "click",
        loadLeaderboard
    );


document
    .getElementById("backMenuBtn")
    .addEventListener(
        "click",
        () => {

            leaderboardScreen
                .classList
                .add("hidden");

            menuScreen
                .classList
                .remove("hidden");
        }
    );


async function loadLeaderboard() {

    menuScreen
        .classList
        .add("hidden");

    leaderboardScreen
        .classList
        .remove("hidden");


    const list =
        document.getElementById(
            "leaderboardList"
        );


    /* Ambil leaderboard lokal */

    let data =
        JSON.parse(
            localStorage.getItem(
                "killTheRedLeaderboard"
            ) || "[]"
        );


    data.sort(
        (a, b) =>
            Number(b.score) -
            Number(a.score)
    );


    if (data.length === 0) {

        list.innerHTML =
            "<p>Belum ada skor.</p>";

        return;
    }


    list.innerHTML =
        data
            .slice(0, 10)
            .map(
                (item, index) => `
                    <div class="leaderboardRow">
                        <b>#${index + 1}</b>
                        <span>
                            ${escapeHTML(item.username)}
                        </span>
                        <strong>
                            ${item.score}
                        </strong>
                    </div>
                `
            )
            .join("");
}


/* =====================================================
   SAVE SCORE
===================================================== */

function saveScore() {

    const data =
        JSON.parse(
            localStorage.getItem(
                "killTheRedLeaderboard"
            ) || "[]"
        );


    data.push({

        username:
            currentUsername || "Unknown",

        score: score,

        level: level,

        date:
            new Date().toLocaleString()

    });


    data.sort(
        (a, b) =>
            Number(b.score) -
            Number(a.score)
    );


    localStorage.setItem(
        "killTheRedLeaderboard",
        JSON.stringify(
            data.slice(0, 50)
        )
    );
}


/* =====================================================
   SECURITY HELPER
===================================================== */

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =====================================================
   PLAYER
===================================================== */

function createPlayer() {

    return {

        x: W / 2,

        y: H / 2,

        radius: 18,

        hp: 100,

        maxHp: 100,

        speed: 230,

        angle: 0,

        damageMultiplier: 1
    };
}


/* =====================================================
   START GAME
===================================================== */

function startGame() {

    running = true;

    level = 1;

    score = 0;

    cheatActive = false;

    enemies = [];

    projectiles = [];

    enemyProjectiles = [];

    particles = [];

    spawnTimer = 0;

    player =
        createPlayer();


    document
        .getElementById("gameOver")
        .classList
        .add("hidden");


    updateHUD();


    lastTime =
        performance.now();


    cancelAnimationFrame(
        animationId
    );


    animationId =
        requestAnimationFrame(
            gameLoop
        );
}


/* =====================================================
   STOP GAME
===================================================== */

function stopGame() {

    running = false;

    cancelAnimationFrame(
        animationId
    );
}


/* =====================================================
   GAME LOOP
===================================================== */

function gameLoop(timestamp) {

    if (!running) {
        return;
    }


    const dt =
        Math.min(
            (timestamp - lastTime) / 1000,
            0.033
        );


    lastTime = timestamp;


    update(dt);

    draw();


    animationId =
        requestAnimationFrame(
            gameLoop
        );
}


/* =====================================================
   UPDATE
===================================================== */

function update(dt) {

    if (!player) return;


    updatePlayer(dt);

    updateEnemies(dt);

    updateProjectiles(dt);

    updateEnemyProjectiles(dt);

    updateParticles(dt);


    spawnTimer += dt;


    const spawnDelay =
        Math.max(
            0.35,
            1.5 - level * 0.035
        );


    if (
        spawnTimer >= spawnDelay
    ) {

        spawnTimer = 0;

        spawnEnemy();
    }


    const newLevel =
        Math.min(
            30,
            Math.floor(score / 100) + 1
        );


    if (newLevel !== level) {

        level = newLevel;

        updateHUD();
    }


    if (player.hp <= 0) {

        endGame();
    }
}


/* =====================================================
   PLAYER MOVEMENT
===================================================== */

function updatePlayer(dt) {

    player.x +=
        moveX *
        player.speed *
        dt;

    player.y +=
        moveY *
        player.speed *
        dt;


    const margin = 30;


    player.x =
        Math.max(
            margin,
            Math.min(
                W - margin,
                player.x
            )
        );


    player.y =
        Math.max(
            margin,
            Math.min(
                H - margin,
                player.y
            )
        );


    player.angle =
        Math.atan2(
            mouseY - player.y,
            mouseX - player.x
        );
}


/* =====================================================
   ENEMY
===================================================== */

function spawnEnemy() {

    const types = [
        "circle",
        "square",
        "triangle"
    ];


    const type =
        types[
            Math.floor(
                Math.random() *
                types.length
            )
        ];


    let x;
    let y;


    const side =
        Math.floor(
            Math.random() * 4
        );


    if (side === 0) {

        x = Math.random() * W;
        y = -40;

    } else if (side === 1) {

        x = W + 40;
        y = Math.random() * H;

    } else if (side === 2) {

        x = Math.random() * W;
        y = H + 40;

    } else {

        x = -40;
        y = Math.random() * H;
    }


    const size =
        18 +
        Math.random() * 15;


    const hp =
        20 +
        level * 5;


    enemies.push({

        x: x,

        y: y,

        size: size,

        type: type,

        hp: hp,

        maxHp: hp,

        speed:
            35 +
            level * 3,

        shootTimer:
            Math.random(),

        shootDelay:
            Math.max(
                0.6,
                2.2 - level * 0.04
            )
    });
}


/* =====================================================
   ENEMY UPDATE
===================================================== */

function updateEnemies(dt) {

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


        const dx =
            player.x -
            enemy.x;


        const dy =
            player.y -
            enemy.y;


        const dist =
            Math.hypot(
                dx,
                dy
            ) || 1;


        enemy.x +=
            dx / dist *
            enemy.speed *
            dt;


        enemy.y +=
            dy / dist *
            enemy.speed *
            dt;


        enemy.shootTimer += dt;


        if (
            enemy.shootTimer >=
            enemy.shootDelay
        ) {

            enemy.shootTimer = 0;

            enemyAttack(enemy);
        }


        if (
            dist <
            player.radius +
            enemy.size * 0.7
        ) {

            damagePlayer(
                getEnemyDamage()
            );

            enemies.splice(i, 1);
        }
    }
}


/* =====================================================
   ENEMY DAMAGE
===================================================== */

function getEnemyDamage() {

    if (level <= 10) {
        return 10;
    }

    if (level <= 20) {
        return 20;
    }

    return 30;
}


/* =====================================================
   ENEMY ATTACK
===================================================== */

function enemyAttack(enemy) {

    const angle =
        Math.atan2(
            player.y - enemy.y,
            player.x - enemy.x
        );


    /* Level 1-5 */

    if (level <= 5) {

        createEnemyProjectile(
            enemy.x,
            enemy.y,
            angle
        );

        return;
    }


    /* Level 6-10 */

    if (level <= 10) {

        for (
            let i = -1;
            i <= 1;
            i++
        ) {

            createEnemyProjectile(
                enemy.x,
                enemy.y,
                angle + i * 0.25
            );
        }

        return;
    }


    /* Level 11-20 */

    if (level <= 20) {

        for (
            let i = -2;
            i <= 2;
            i++
        ) {

            createEnemyProjectile(
                enemy.x,
                enemy.y,
                angle + i * 0.22
            );
        }

        return;
    }


    /* Level 21-30 */

    for (
        let i = 0;
        i < 8;
        i++
    ) {

        createEnemyProjectile(
            enemy.x,
            enemy.y,
            i *
            Math.PI *
            2 /
            8
        );
    }
}


/* =====================================================
   PLAYER PROJECTILE
===================================================== */

function createProjectile(
    x,
    y,
    angle
) {

    projectiles.push({

        x: x,

        y: y,

        vx:
            Math.cos(angle) *
            650,

        vy:
            Math.sin(angle) *
            650,

        radius: 5,

        damage:
            20 *
            player.damageMultiplier,

        life: 1
    });
}


/* =====================================================
   ENEMY PROJECTILE
===================================================== */

function createEnemyProjectile(
    x,
    y,
    angle
) {

    enemyProjectiles.push({

        x: x,

        y: y,

        vx:
            Math.cos(angle) *
            (170 + level * 5),

        vy:
            Math.sin(angle) *
            (170 + level * 5),

        radius: 6,

        life: 5
    });
}


/* =====================================================
   ATTACK
===================================================== */

function attack() {

    if (!running || !player) {
        return;
    }


    const weapon =
        getWeapon();


    const angle =
        Math.atan2(
            mouseY - player.y,
            mouseX - player.x
        );


    /* Energy Blaster */

    if (
        weapon ===
        "ENERGY BLASTER"
    ) {

        createProjectile(
            player.x,
            player.y,
            angle
        );

        return;
    }


    /* Plasma Scatter */

    if (
        weapon ===
        "PLASMA SCATTER"
    ) {

        for (
            let i = -2;
            i <= 2;
            i++
        ) {

            createProjectile(
                player.x,
                player.y,
                angle + i * 0.12
            );
        }

        return;
    }


    /* Energy Rifle */

    for (
        let i = -1;
        i <= 1;
        i++
    ) {

        createProjectile(
            player.x,
            player.y,
            angle + i * 0.04
        );
    }
}


/* =====================================================
   PROJECTILE UPDATE
===================================================== */

function updateProjectiles(dt) {

    for (
        let i = projectiles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            projectiles[i];


        p.x +=
            p.vx * dt;

        p.y +=
            p.vy * dt;


        p.life -= dt;


        if (
            p.life <= 0 ||
            p.x < -50 ||
            p.x > W + 50 ||
            p.y < -50 ||
            p.y > H + 50
        ) {

            projectiles.splice(i, 1);

            continue;
        }


        for (
            let j = enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy =
                enemies[j];


            const distance =
                Math.hypot(
                    p.x - enemy.x,
                    p.y - enemy.y
                );


            if (
                distance <
                p.radius +
                enemy.size
            ) {

                enemy.hp -=
                    p.damage;


                createParticles(
                    p.x,
                    p.y,
                    5
                );


                projectiles.splice(
                    i,
                    1
                );


                if (
                    enemy.hp <= 0
                ) {

                    score += 10;


                    createParticles(
                        enemy.x,
                        enemy.y,
                        15
                    );


                    enemies.splice(
                        j,
                        1
                    );


                    updateHUD();
                }


                break;
            }
        }
    }
}


/* =====================================================
   ENEMY PROJECTILE UPDATE
===================================================== */

function updateEnemyProjectiles(dt) {

    for (
        let i =
            enemyProjectiles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            enemyProjectiles[i];


        p.x +=
            p.vx * dt;

        p.y +=
            p.vy * dt;


        p.life -= dt;


        const distance =
            Math.hypot(
                p.x - player.x,
                p.y - player.y
            );


        if (
            distance <
            p.radius +
            player.radius
        ) {

            damagePlayer(
                getEnemyDamage()
            );


            enemyProjectiles.splice(
                i,
                1
            );

            continue;
        }


        if (
            p.life <= 0 ||
            p.x < -100 ||
            p.x > W + 100 ||
            p.y < -100 ||
            p.y > H + 100
        ) {

            enemyProjectiles.splice(
                i,
                1
            );
        }
    }
}


/* =====================================================
   DAMAGE
===================================================== */

function damagePlayer(amount) {

    if (!player) {
        return;
    }


    player.hp -= amount;


    if (player.hp < 0) {
        player.hp = 0;
    }


    updateHUD();
}


/* =====================================================
   PARTICLES
===================================================== */

function createParticles(
    x,
    y,
    count
) {

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;


        const speed =
            40 +
            Math.random() *
            120;


        particles.push({

            x: x,

            y: y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life:
                0.5 +
                Math.random() *
                0.5
        });
    }
}


function updateParticles(dt) {

    for (
        let i =
            particles.length - 1;
        i >= 0;
        i--
    ) {

  
