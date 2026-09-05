/* =====================================================
   KILL THE RED
   Main Game Engine
===================================================== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;

function resizeCanvas() {

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();


/* =====================================================
   SCREEN
===================================================== */

const loginScreen =
    document.getElementById("loginScreen");

const menuScreen =
    document.getElementById("menuScreen");

const gameScreen =
    document.getElementById("gameScreen");

const leaderboardScreen =
    document.getElementById("leaderboardScreen");


let currentUsername = "";


/* =====================================================
   LOGIN
===================================================== */

document.getElementById("loginBtn")
    .addEventListener("click", login);

function login() {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;

    const message =
        document.getElementById("loginMessage");

    if (!username || !password) {

        message.textContent =
            "Username dan password wajib diisi.";

        return;
    }

    /*
       Untuk demo, login dibuat lokal.

       Untuk produksi:
       gunakan database/authentication server.
    */

    currentUsername = username;

    document.getElementById("playerName")
        .textContent = username;

    loginScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");

}


/* =====================================================
   MENU
===================================================== */

document.getElementById("startBtn")
    .addEventListener("click", () => {

        menuScreen.classList.add("hidden");
        gameScreen.classList.remove("hidden");

        startGame();

    });


document.getElementById("logoutBtn")
    .addEventListener("click", () => {

        currentUsername = "";

        menuScreen.classList.add("hidden");
        loginScreen.classList.remove("hidden");

    });


document.getElementById("leaderboardBtn")
    .addEventListener("click", async () => {

        menuScreen.classList.add("hidden");

        leaderboardScreen.classList.remove("hidden");

        await loadLeaderboard();

    });


document.getElementById("backMenuBtn")
    .addEventListener("click", () => {

        leaderboardScreen.classList.add("hidden");

        menuScreen.classList.remove("hidden");

    });


/* =====================================================
   GAME VARIABLES
===================================================== */

let running = false;

let animationId;

let level = 1;

let score = 0;

let player;

let enemies = [];

let projectiles = [];

let enemyProjectiles = [];

let particles = [];

let lastTime = 0;

let spawnTimer = 0;

let attackTimer = 0;

let cheatActive = false;


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
   LEVEL
===================================================== */

function getDamage() {

    let damage;

    if (level <= 10) {

        damage = 10;

    } else if (level <= 20) {

        damage = 20;

    } else {

        damage = 30;

    }

    return damage *
        (cheatActive ? 5 : 1);
}


function getWeapon() {

    if (level < 10) {

        return "ENERGY BLASTER";

    }

    if (level < 25) {

        return "PLASMA SCATTER";

    }

    return "ENERGY RIFLE";
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

    player = createPlayer();

    updateHUD();

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);

}


/* =====================================================
   GAME LOOP
===================================================== */

function gameLoop(timestamp) {

    if (!running) return;

    const dt =
        Math.min((timestamp - lastTime) / 1000, .033);

    lastTime = timestamp;

    update(dt);

    draw();

    animationId =
        requestAnimationFrame(gameLoop);

}


/* =====================================================
   UPDATE
===================================================== */

function update(dt) {

    updatePlayer(dt);

    updateEnemies(dt);

    updateProjectiles(dt);

    updateEnemyProjectiles(dt);

    updateParticles(dt);

    spawnTimer += dt;

    attackTimer += dt;

    const spawnDelay =
        Math.max(.35, 1.5 - level * .035);

    if (spawnTimer >= spawnDelay) {

        spawnTimer = 0;

        spawnEnemy();

    }

    /*
       Level naik setiap beberapa skor.
    */

    const newLevel =
        Math.min(30, Math.floor(score / 100) + 1);

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

let moveX = 0;
let moveY = 0;

function updatePlayer(dt) {

    player.x += moveX *
        player.speed *
        dt;

    player.y += moveY *
        player.speed *
        dt;

    const margin = 30;

    player.x =
        Math.max(margin,
        Math.min(W - margin, player.x));

    player.y =
        Math.max(margin,
        Math.min(H - margin, player.y));

}


/* =====================================================
   ENEMIES
===================================================== */

function spawnEnemy() {

    const types = [
        "circle",
        "square",
        "triangle"
    ];

    const type =
        types[Math.floor(Math.random() * types.length)];

    let x;
    let y;

    const side =
        Math.floor(Math.random() * 4);

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
        18 + Math.random() * 15;

    enemies.push({

        x,
        y,

        size,

        type,

        hp: 20 + level * 5,

        maxHp: 20 + level * 5,

        speed: 35 + level * 3,

        shootTimer: Math.random(),

        shootDelay:
            Math.max(.6, 2.2 - level * .04)

    });

}


/* =====================================================
   ENEMY UPDATE
===================================================== */

function updateEnemies(dt) {

    for (let i = enemies.length - 1;
         i >= 0;
         i--) {

        const enemy = enemies[i];

        const dx =
            player.x - enemy.x;

        const dy =
            player.y - enemy.y;

        const dist =
            Math.hypot(dx, dy) || 1;

        enemy.x +=
            dx / dist *
            enemy.speed *
            dt;

        enemy.y +=
            dy / dist *
            enemy.speed *
            dt;


        /*
           Serangan musuh berubah berdasarkan level.
        */

        enemy.shootTimer += dt;

        if (enemy.shootTimer >= enemy.shootDelay) {

            enemy.shootTimer = 0;

            enemyAttack(enemy);

        }


        /*
           Kontak dengan pemain.
        */

        if (dist <
            player.radius + enemy.size * .7) {

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

    if (level <= 10) return 10;

    if (level <= 20) return 20;

    return 30;

}


/* =====================================================
   ENEMY ATTACK PATTERNS
===================================================== */

function enemyAttack(enemy) {

    const dx =
        player.x - enemy.x;

    const dy =
        player.y - enemy.y;

    const angle =
        Math.atan2(dy, dx);


    /*
       Level 1-5:
       satu projectile.
    */

    if (level <= 5) {

        createEnemyProjectile(
            enemy.x,
            enemy.y,
            angle
        );

        return;

    }


    /*
       Level 6-10:
       3 projectile menyebar.
    */

    if (level <= 10) {

        for (let i = -1; i <= 1; i++) {

            createEnemyProjectile(
                enemy.x,
                enemy.y,
                angle + i * .25
            );

        }

        return;

    }


    /*
       Level 11-20:
       5 projectile.
    */

    if (level <= 20) {

        for (let i = -2; i <= 2; i++) {

            createEnemyProjectile(
                enemy.x,
                enemy.y,
                angle + i * .22
            );

        }

        return;

    }


    /*
       Level 21-30:
       radial attack.
    */

    for (let i = 0; i < 8; i++) {

        createEnemyProjectile(
            enemy.x,
            enemy.y,
            i * Math.PI * 2 / 8
        );

    }

}


/* =====================================================
   PROJECTILES
===================================================== */

function createProjectile(x, y, angle) {

    projectiles.push({

        x,
        y,

        vx: Math.cos(angle) * 650,
        vy: Math.sin(angle) * 650,

        radius: 5,

        damage: 20 * player.damageMultiplier,

        life: 1

    });

}


function createEnemyProjectile(x, y, angle) {

    enemyProjectiles.push({

        x,
        y,

        vx: Math.cos(angle) *
            (170 + level * 5),

        vy: Math.sin(angle) *
            (170 + level * 5),

        radius: 6,

        life: 5

    });

}


/* =====================================================
   PLAYER ATTACK
===================================================== */

function attack() {

    if (!running) return;

    const weapon =
        getWeapon();

    const angle =
        Math.atan2(
            mouseY - player.y,
            mouseX - player.x
        );

    /*
       Energy Blaster
    */

    if (weapon === "ENERGY BLASTER") {

        createProjectile(
            player.x,
            player.y,
            angle
        );

        return;

    }


    /*
       Plasma Scatter
    */

    if (weapon === "PLASMA SCATTER") {

        for (let i = -2; i <= 2; i++) {

            createProjectile(
                player.x,
                player.y,
                angle + i * .12
            );

        }

        return;

    }


    /*
       Energy Rifle
    */

    for (let i = -1; i <= 1; i++) {

        createProjectile(
            player.x,
            player.y,
            angle + i * .04
        );

    }

}


/* =====================================================
   PROJECTILE UPDATE
===================================================== */

function updateProjectiles(dt) {

    for (let i = projectiles.length - 1;
         i >= 0;
         i--) {

        const p = projectiles[i];

        p.x += p.vx * dt;
        p.y += p.vy * dt;

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


        for (let j = enemies.length - 1;
             j >= 0;
             j--) {

            const enemy = enemies[j];

            const d =
                Math.hypot(
                    p.x - enemy.x,
                    p.y - enemy.y
                );

            if (d <
                p.radius + enemy.size) {

                enemy.hp -= p.damage;

                createParticles(
                    p.x,
                    p.y,
                    5
                );

                projectiles.splice(i, 1);

                if (enemy.hp <= 0) {

                    score += 10;

                    createParticles(
                        enemy.x,
                        enemy.y,
                        15
                    );

                    enemies.splice(j, 1);

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

    for (let i = enemyProjectiles.length - 1;
         i >= 0;
         i--) {

        const p =
            enemyProjectiles[i];

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        p.life -= dt;

        const d =
            Math.hypot(
                p.x - player.x,
                p.y - player.y
            );

        if (d <
            p.radius + player.radius) {

            damagePlayer(
                getEnemyDamage()
            );

            enemyProjectiles.splice(i, 1);

            continue;

        }

        if (
            p.life <= 0 ||
            p.x < -100 ||
            p.x > W + 100 ||
            p.y < -100 ||
            p.y > H + 100
        ) {

            enemyProjectiles.splice(i, 1);

        }

    }

}


/* =====================================================
   DAMAGE PLAYER
===================================================== */

function damagePlayer(amount) {

    player.hp -= amount;

    if (player.hp < 0) {
        player.hp = 0;
    }

    updateHUD();

}


/* =====================================================
   PARTICLES
===================================================== */

function createParticles(x, y, count) {

    for (let i = 0; i < count; i++) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const speed =
            40 + Math.random() * 120;

        particles.push({

            x,
            y,

            vx:
                Math.cos(angle) * speed,

            vy:
                Math.sin(angle) * speed,

            life: .5 + Math.random() * .5

        });

    }

}


function updateParticles(dt) {

    for (let i = particles.length - 1;
         i >= 0;
         i--) {

        const p = particles[i];

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        p.life -= dt;

        if (p.life <= 0) {

            particles.splice(i, 1);

        }

    }

}


/* =====================================================
   DRAW
===================================================== */

function draw() {

    drawForest();

    drawEnemies();

    drawProjectiles();

    drawEnemyProjectiles();

    drawParticles();

    drawPlayer();

}


/* =====================================================
   FOREST
===================================================== */

function drawForest() {

    ctx.fillStyle = "#102719";

    ctx.fillRect(0, 0, W, H);


    /*
       Grass pattern
    */

    ctx.strokeStyle =
        "rgba(70,140,75,.12)";

    ctx.lineWidth = 1;

    for (let x = 0; x < W; x += 35) {

        for (let y = 0; y < H; y += 35) {

            ctx.beginPath();

            ctx.moveTo(x, y + 8);

            ctx.lineTo(x + 5, y);

            ctx.stroke();

        }

    }


    /*
       Trees
    */

    const treeCount =
        Math.ceil((W * H) / 35000);

    for (let i = 0; i < treeCount; i++) {

        const x =
            (i * 137) % W;

        const y =
            (i * 211) % H;

        /*
           Jangan menutup area tengah terlalu banyak.
        */

        if (
            Math.abs(x - player.x) < 100 &&
            Math.abs(y - player.y) < 100
        ) continue;


        ctx.fillStyle = "#53351d";

        ctx.fillRect(
            x - 7,
            y,
            14,
            35
        );

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            28,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#164c25";

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            x - 15,
            y + 5,
            20,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#1b5b2d";

        ctx.fill();

    }

}


/* =====================================================
   DRAW PLAYER
===================================================== */

function drawPlayer() {

    /*
       Glow
    */

    const glow =
        ctx.createRadialGradient(
            player.x,
            player.y,
            3,
            player.x,
            player.y,
            45
        );

    glow.addColorStop(
        0,
        "rgba(80,180,255,.8)"
    );

    glow.addColorStop(
        1,
        "rgba(0,80,255,0)"
    );

    ctx.fillStyle = glow;

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
       Body
    */

    ctx.fillStyle = "#38aaff";

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#bceaff";

    ctx.lineWidth = 3;

    ctx.stroke();


    /*
       Direction indicator
    */

    ctx.strokeStyle = "#ffffff";

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.moveTo(
        player.x,
        player.y
    );

    ctx.lineTo(
        player.x +
        Math.cos(player.angle) * 30,

        player.y +
        Math.sin(player.angle) * 30
    );

    ctx.stroke();

}


/* =====================================================
   DRAW ENEMIES
===================================================== */

function drawEnemies() {

    for (const enemy of enemies) {

        ctx.fillStyle = "#ed3030";

        ctx.strokeStyle = "#ff7777";

        ctx.lineWidth = 2;

        ctx.beginPath();


        if (enemy.type === "circle") {

            ctx.arc(
                enemy.x,
                enemy.y,
                enemy.size,
                0,
                Math.PI * 2
            );

        }


        else if (enemy.type === "square") {

            ctx.rect(
                enemy.x - enemy.size,
                enemy.y - enemy.size,

                enemy.size * 2,
                enemy.size * 2
            );

        }


        else {

            ctx.moveTo(
                enemy.x,
                enemy.y - enemy.size
            );

            ctx.lineTo(
                enemy.x + enemy.size,
                enemy.y + enemy.size
            );

            ctx.lineTo(
                enemy.x - enemy.size,
                enemy.y + enemy.size
            );

            ctx.closePath();

        }

        ctx.fill();

        ctx.stroke();


        /*
           HP bar
        */

        const barWidth =
            enemy.size * 2;

        const hpPercent =
            enemy.hp / enemy.maxHp;

        ctx.fillStyle =
            "rgba(0,0,0,.5)";

        ctx.fillRect(
            enemy.x - enemy.size,
            enemy.y - enemy.size - 9,
            barWidth,
            4
        );

        ctx.fillStyle =
            "#58ff65";

        c
