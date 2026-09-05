"use strict";


/* ==================================================
   CANVAS
================================================== */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");


function resizeCanvas() {

    const dpr =
        Math.min(window.devicePixelRatio || 1, 2);

    canvas.width =
        innerWidth * dpr;

    canvas.height =
        innerHeight * dpr;

    canvas.style.width =
        innerWidth + "px";

    canvas.style.height =
        innerHeight + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);


/* ==================================================
   GAME STATE
================================================== */

let username = "";

let gameRunning = false;

let gameOver = false;

let lastTime = 0;

let score = 0;

let kills = 0;

let level = 1;

let hp = 100;

let maxHP = 100;

let xp = 0;

let nextXP = 8;

let cheatActive = false;


/* ==================================================
   PLAYER
================================================== */

const player = {

    x: innerWidth / 2,

    y: innerHeight / 2,

    radius: 16,

    speed: 260
};


/* ==================================================
   INPUT
================================================== */

const keys = {};

const mouse = {

    x: innerWidth / 2,

    y: innerHeight / 2,

    down: false
};

const joystickInput = {

    x: 0,

    y: 0
};


document.addEventListener(
    "keydown",
    e => {

        keys[e.key] = true;

        if (e.key === " ") {

            e.preventDefault();

            mouse.down = true;
        }
    }
);


document.addEventListener(
    "keyup",
    e => {

        keys[e.key] = false;

        if (e.key === " ") {

            mouse.down = false;
        }
    }
);


canvas.addEventListener(
    "mousemove",
    e => {

        mouse.x = e.clientX;

        mouse.y = e.clientY;
    }
);


canvas.addEventListener(
    "mousedown",
    e => {

        if (e.button === 0) {

            mouse.down = true;
        }
    }
);


window.addEventListener(
    "mouseup",
    () => {

        mouse.down = false;
    }
);


/* ==================================================
   WEAPONS
================================================== */

const weapons = {

    pistol: {

        name: "PISTOL",

        damage: 18,

        fireRate: .22,

        pellets: 1,

        spread: .02,

        bulletSpeed: 720
    },

    shotgun: {

        name: "SHOTGUN",

        damage: 24,

        fireRate: .65,

        pellets: 7,

        spread: .35,

        bulletSpeed: 650
    },

    ak47: {

        name: "AK-47",

        damage: 32,

        fireRate: .095,

        pellets: 1,

        spread: .07,

        bulletSpeed: 900
    }
};


function getWeapon() {

    if (level >= 25) {

        return weapons.ak47;

    }

    if (level >= 10) {

        return weapons.shotgun;
    }

    return weapons.pistol;
}


/* ==================================================
   ENEMY DAMAGE
================================================== */

function enemyDamage() {

    if (level <= 10) {

        return 10;
    }

    if (level <= 20) {

        return 20;
    }

    return 30;
}


/* ==================================================
   GAME OBJECTS
================================================== */

let bullets = [];

let enemies = [];

let particles = [];

let trees = [];


/* ==================================================
   FOREST
================================================== */

function createForest() {

    trees = [];

    for (let i = 0; i < 60; i++) {

        trees.push({

            x: Math.random() * innerWidth,

            y: Math.random() * innerHeight,

            size:
                15 +
                Math.random() * 20
        });
    }
}


/* ==================================================
   ENEMY
================================================== */

function spawnEnemy() {

    const side =
        Math.floor(
            Math.random() * 4
        );

    const padding = 60;

    let x;
    let y;

    if (side === 0) {

        x = -padding;

        y = Math.random() *
            innerHeight;

    } else if (side === 1) {

        x = innerWidth + padding;

        y = Math.random() *
            innerHeight;

    } else if (side === 2) {

        x = Math.random() *
            innerWidth;

        y = -padding;

    } else {

        x = Math.random() *
            innerWidth;

        y = innerHeight + padding;
    }


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


    const enemyHP =
        35 +
        level * 6;


    enemies.push({

        x,

        y,

        radius:
            16 +
            Math.random() * 8,

        type,

        hp: enemyHP,

        maxHP: enemyHP
    });
}


/* ==================================================
   SHOOT
================================================== */

let shootCooldown = 0;


function shoot() {

    if (shootCooldown > 0) {

        return;
    }


    const weapon =
        getWeapon();


    shootCooldown =
        weapon.fireRate;


    const angle =
        Math.atan2(

            mouse.y -
            player.y,

            mouse.x -
            player.x
        );


    for (
        let i = 0;
        i < weapon.pellets;
        i++
    ) {

        const spread =
            (
                Math.random() -
                .5
            ) *
            weapon.spread;


        const a =
            angle + spread;


        let damage =
            weapon.damage;


        if (cheatActive) {

            damage *= 5;
        }


        bullets.push({

            x:
                player.x +
                Math.cos(a) * 20,

            y:
                player.y +
                Math.sin(a) * 20,

            vx:
                Math.cos(a) *
                weapon.bulletSpeed,

            vy:
                Math.sin(a) *
                weapon.bulletSpeed,

            radius: 3,

            damage,

            life: 1.2
        });
    }
}


/* ==================================================
   LEVEL SYSTEM
================================================== */

function addXP() {

    xp++;

    if (
        xp >= nextXP &&
        level < 30
    ) {

        xp = 0;

        level++;

        nextXP =
            8 +
            Math.floor(
                level * 2.5
            );


        hp =
            Math.min(
                maxHP,
                hp + 15
            );


        showLevel();


        if (
            level === 10 ||
            level === 25
        ) {

            alert(
                "Senjata diperbarui menjadi " +
                getWeapon().name
            );
        }
    }
}


function showLevel() {

    const text =
        document.getElementById(
            "levelText"
        );

    text.innerText =
        "LEVEL " + level;

    text.style.opacity = 1;


    setTimeout(() => {

        text.style.opacity = 0;

    }, 1500);
}


/* ==================================================
   DAMAGE PLAYER
================================================== */

function damagePlayer(amount) {

    if (cheatActive) {

        amount *= .5;
    }


    hp -= amount;


    if (hp <= 0) {

        hp = 0;

        endGame();
    }
}


/* ==================================================
   GAME UPDATE
================================================== */

let spawnTimer = 0;


function update(dt) {

    if (gameOver) {

        return;
    }


    shootCooldown -= dt;


    /* PLAYER */

    let moveX = 0;

    let moveY = 0;


    if (
        keys["w"] ||
        keys["ArrowUp"]
    ) {

        moveY--;
    }

    if (
        keys["s"] ||
        keys["ArrowDown"]
    ) {

        moveY++;
    }

    if (
        keys["a"] ||
        keys["ArrowLeft"]
    ) {

        moveX--;
    }

    if (
        keys["d"] ||
        keys["ArrowRight"]
    ) {

        moveX++;
    }


    moveX += joystickInput.x;

    moveY += joystickInput.y;


    const length =
        Math.hypot(
            moveX,
            moveY
        );


    if (length > 1) {

        moveX /= length;

        moveY /= length;
    }


    player.x +=
        moveX *
        player.speed *
        dt;

    player.y +=
        moveY *
        player.speed *
        dt;


    player.x =
        Math.max(
            player.radius,
            Math.min(
                innerWidth -
                player.radius,
                player.x
            )
        );


    player.y =
        Math.max(
            player.radius,
            Math.min(
                innerHeight -
                player.radius,
                player.y
            )
        );


    /* SHOOT */

    if (mouse.down) {

        shoot();
    }


    /* SPAWN */

    spawnTimer -= dt;


    if (spawnTimer <= 0) {

        spawnTimer =
            Math.max(
                .2,
                1.1 -
                level * .025
            );

        spawnEnemy();
    }


    /* BULLETS */

    for (const bullet of bullets) {

        bullet.x +=
            bullet.vx * dt;

        bullet.y +=
            bullet.vy * dt;

        bullet.life -= dt;
    }


    bullets =
        bullets.filter(
            bullet =>
                bullet.life > 0
        );


    /* ENEMIES */

    for (const enemy of enemies) {

        const dx =
            player.x -
            enemy.x;

        const dy =
            player.y -
            enemy.y;

        const distance =
            Math.hypot(
                dx,
                dy
            ) || 1;


        const speed =
            45 +
            level * 3;


        enemy.x +=
            dx / distance *
            speed *
            dt;

        enemy.y +=
            dy / distance *
            speed *
            dt;


        if (
            distance <
            player.radius +
            enemy.radius
        ) {

            damagePlayer(
                enemyDamage() *
                dt *
                1.8
            );
        }
    }


    /* BULLET COLLISION */

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];


        let hit = false;


        for (
            let j =
                enemies.length - 1;

            j >= 0;

            j--
        ) {

            const enemy =
                enemies[j];


            const distance =
                Math.hypot(

                    bullet.x -
                    enemy.x,

                    bullet.y -
                    enemy.y
                );


            if (
                distance <
                bullet.radius +
                enemy.radius
            ) {

                enemy.hp -=
                    bullet.damage;


                hit = true;


                if (
                    enemy.hp <= 0
                ) {

                    enemies.splice(
                        j,
                        1
                    );


                    kills++;


                    score +=
                        10 * level;


                    addXP();
                }


                break;
            }
        }


        if (hit) {

            bullets.splice(
                i,
                1
            );
        }
    }


    updateHUD();
}


/* ==================================================
   DRAW FOREST
================================================== */

function drawForest() {

    const gradient =
        ctx.createRadialGradient(

            innerWidth / 2,

            innerHeight / 2,

            30,

            innerWidth / 2,

            innerHeight / 2,

            Math.max(
                innerWidth,
                innerHeight
            )
        );


    gradient.addColorStop(
        0,
        "#28572d"
    );

    gradient.addColorStop(
        1,
        "#081c0c"
    );


    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        innerWidth,
        innerHeight
    );


    /* TREES */

    for (const tree of trees) {

        ctx.fillStyle =
            "#55351d";

        ctx.fillRect(

            tree.x - 5,

            tree.y,

            10,

            30
        );


        ctx.beginPath();

        ctx.fillStyle =
            "#174a22";

        ctx.arc(

            tree.x,

            tree.y,

            tree.size,

            0,

            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.fillStyle =
            "#24702f";

        ctx.arc(

            tree.x - 7,

            tree.y - 7,

            tree.size * .65,

            0,

            Math.PI * 2
        );

        ctx.fill();
    }
}


/* ==================================================
   DRAW ENEMIES
================================================== */

function drawEnemy(enemy) {

    ctx.save();

    ctx.translate(
        enemy.x,
        enemy.y
    );


    ctx.fillStyle =
        "#ef2939";


    if (
        enemy.type ===
        "circle"
    ) {

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

    } else if (
        enemy.type ===
        "square"
    ) {

        ctx.fillRect(

            -enemy.radius,

            -enemy.radius,

            enemy.radius * 2,

            enemy.radius * 2
        );

    } else {

        ctx.beginPath();

        ctx.moveTo(
            0,
            -enemy.radius
        );

        ctx.lineTo(
            enemy.radius,
            enemy.radius
        );

        ctx.lineTo(
            -enemy.radius,
            enemy.radius
        );

        ctx.closePath();

        ctx.fill();
    }


    ctx.restore();


    /* HP ENEMY */

    ctx.fillStyle =
        "#281013";

    ctx.fillRect(

        enemy.x -
        enemy.radius,

        enemy.y -
        enemy.radius -
        8,

        enemy.radius * 2,

        4
    );


    ctx.fillStyle =
        "#ff5962";

    ctx.fillRect(

        enemy.x -
        enemy.radius,

        enemy.y -
        enemy.radius -
        8,

        enemy.radius *
        2 *
        Math.max(
            0,
            enemy.hp /
            enemy.maxHP
        ),

        4
    );
}


/* ==================================================
   DRAW PLAYER
================================================== */

function drawPlayer() {

    ctx.save();


    ctx.shadowBlur = 25;

    ctx.shadowColor =
        "#38aaff";


    ctx.fillStyle =
        "#299fff";


    ctx.beginPath();

    ctx.arc(

        player.x,

        player.y,

        player.radius,

        0,

        Math.PI * 2
    );

    ctx.fill();


    ctx.shadowBlur = 0;


    /* LIGHT */

    ctx.fillStyle =
        "#dff7ff";


    ctx.beginPath();

    ctx.arc(

        player.x - 5,

        player.y - 5,

        5,

        0,

        Math.PI * 2
    );

    ctx.fill();


    /* WEAPON */

    const angle =
        Math.atan2(

            mouse.y -
            player.y,

            mouse.x -
            player.x
        );


    ctx.strokeStyle =
        "#eee";

    ctx.lineWidth = 6;

    ctx.lineCap =
        "round";


    ctx.beginPath();

    ctx.moveTo(

        player.x +
        Math.cos(angle) * 10,

        player.y +
        Math.sin(angle) * 10
    );


    ctx.lineTo(

        player.x +
        Math.cos(angle) * 28,

        player.y +
        Math.sin(angle) * 28
    );


    ctx.stroke();


    ctx.restore();
}


/* ==================================================
   DRAW BULLETS
================================================== */

function drawBullets() {

    for (const bullet of bullets) {

        ctx.fillStyle =
            "#ffe06a";

        ctx.shadowBlur = 12;

        ctx.shadowColor =
            "#ffdd55";


        ctx.beginPath();

        ctx.arc(

            bullet.x,

            bullet.y,

            bullet.radius,

            0,

            Math.PI * 2
        );

        ctx.fill();


        ctx.shadowBlur = 0;
    }
}


/* ==================================================
   DRAW
================================================== */

function draw() {

    drawForest();

    drawBullets();


    for (
        const enemy of enemies
    ) {

        drawEnemy(enemy);
    }


    drawPlayer();
}


/* ==================================================
   GAME LOOP
================================================== */

function gameLoop(time) {

    if (!gameRunning) {

        return;
    }


    const dt =
        Math.min(
            .033,
            (time - lastTime) /
            1000
        );


    lastTime = time;


    update(dt);

    draw();


    requestAnimationFrame(
        gameLoop
    );
}


/* ==================================================
   HUD
================================================== */

function updateHUD() {

    document.getElementById(
        "playerName"
    ).innerText = username;


    document.getElementById(
        "hp"
    ).style.width =
        (
            hp /
            maxHP *
            100
        ) + "%";


    document.getElementById(
        "hpText"
    ).innerText =
        Math.ceil(hp) +
        " / " +
        maxHP;


    document.getElementById(
        "level"
    ).innerText =
        level;


    document.getElementById(
        "score"
    ).innerText =
        score;


    document.getElementById(
        "kills"
    ).innerText =
        kills;


    const weapon =
        getWeapon();


    document.getElementById(
        "weaponName"
    ).innerText =
        weapon.name;


    document.getElementById(
        "weaponDamage"
    ).innerText =
        "Damage " +
        (
            weapon.damage *
            (cheatActive ? 5 : 1)
        );
}


/* ==================================================
   LOGIN
================================================== */

function login() {

    const user =
        document.getElementById(
            "username"
        ).value.trim();


    const password =
        document.getElementById(
            "password"
        ).value;


    const error =
        document.getElementById(
            "loginError"
        );


    if (user.length < 2) {

        error.innerText =
            "Username minimal 2 karakter.";

        return;
    }


    if (password.length < 10) {

        error.innerText =
            "Password minimal 10 karakter.";

        return;
    }


    username = user;


    document.getElementById(
        "loginScreen"
    ).classList.add(
        "hidden"
    );


    document.getElementById(
        "gameScreen"
    ).classList.remove(
        "hidden"
    );


    startGame();
}


/* ==================================================
   START GAME
================================================== */

function startGame() {

    score = 0;

    kills = 0;

    level = 1;

    xp = 0;

    nextXP = 8;

    hp = 100;

    maxHP = 100;

    cheatActive = false;

    bullets = [];

    enemies = [];


    player.x =
        innerWidth / 2;

    player.y =
        innerHeight / 2;


    createForest();


    for (
        let i = 0;
        i < 5;
        i++
    ) {

        spawnEnemy();
    }


    gameOver = false;

    gameRunning = true;

    lastTime =
        performance.now();


    updateHUD();

    showLevel();


    requestAnimationFrame(
        gameLoop
    );
}


/* ==================================================
   GAME OVER
================================================== */

function endGame() {

    gameOver = true;
    gameRunning = false ;
    
    document.getElementById(
        "finalScore"
    ).innerText =
        "Score: " +
        score +
        " | Kill: " +
        kills +
        " | Level: " +
        level;


    document.getElementById(
        "gameOver"
    ).classList.remove(
        "hidden"
    );


    saveScore();
}


function restartGame() {

    document.getElementById(
        "gameOver"
    ).classList.add(
        "hidden"
    );


    startGame();
}


function backLogin() {

    document.getElementById(
        "gameOver"
    ).classList.add(
        "hidden"
    );


    document.getElementById(
        "gameScreen"
    ).classList.add(
        "hidden"
    );


    document.getElementById(
        "loginScreen"
    ).classList.remove(
        "hidden"
    );


    gameRunning = false;
}

function openCheat() {

    document.getElementById(
        "cheatMenu"
    ).classList.remove(
        "hidden"
    );
}


function closeCheat() {

    document.getElementById(
        "cheatMenu"
    ).classList.add(
        "hidden"
    );
}


function activateCheat() {

    const code =
        document.getElementById(
            "cheatInput"
        ).value.trim();


    const error =
        document.getElementById(
            "cheatError"
        );


    if (
        code ===
        "SUKI LIAR"
    ) {

        cheatActive = true;

        maxHP = 1000;

        hp = 1000;


        error.innerText =
            "CHEAT AKTIF!";


        updateHUD();


        setTimeout(
            closeCheat,
            700
        );

    } else {

        error.innerText =
            "Kode cheat salah.";
    }
}

async function saveScore() {

    try {

        const response =
            await fetch(
                "/api/score",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            username:
                                username,

                            score:
                                score,

                            kills:
                                kills,

                            level:
                                level
                        })
                }
            );


        const data =
            await response.json();


        if (!data.ok) {

            console.error(
                data.error
            );

            return;
        }


        console.log(
            "Score berhasil disimpan"
        );


    } catch (error) {

        console.error(
            "Gagal menyimpan score:",
            error
        );
    }
}
                    
async function openLeaderboard() {

    const menu =
        document.getElementById(
            "leaderboardMenu"
        );


    const container =
        document.getElementById(
            "leaderboard"
        );


    menu.classList.remove(
        "hidden"
    );


    container.innerHTML =
        "<p>Memuat leaderboard...</p>";


    try {

        const response =
            await fetch(
                "/api/score"
            );


        const data =
            await response.json();


        if (!data.ok) {

            throw new Error(
                data.error
            );
        }


        if (
            !data.rows ||
            data.rows.length === 0
        ) {

            container.innerHTML =
                "<p>Belum ada pemain.</p>";

            return;
        }


        container.innerHTML =

            data.rows.map(
                (player, index) => {

                    return `

                    <div class="leaderRow">

                        <b>
                            #${index + 1}
                        </b>

                        <span>
                            ${escapeHTML(
                                player.username
                            )}
                        </span>

                        <b>
                            ${player.score}
                        </b>

                    </div>

                    `;

                }
            ).join("");


    } catch (error) {

        console.error(error);


        container.innerHTML = `

            <p>
                Gagal mengambil
                leaderboard.
            </p>

        `;
    }
}

function closeLeaderboard() {

    document.getElementById(
        "leaderboardMenu"
    ).classList.add(
        "hidden"
    );
}


function escapeHTML(text) {

    return String(text)
        .replace(
            /[&<>"']/g,
            char => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            }[char])
        );
}



const joystick =
    document.getElementById(
        "joystick"
    );

const stick =
    document.getElementById(
        "stick"
    );


let joystickTouch = null;


function updateJoystick(touch) {

    const rect =
        joystick.getBoundingClientRect();


    const centerX =
        rect.left +
        rect.width / 2;


    const centerY =
        rect.top +
        rect.height / 2;


    let dx =
        touch.clientX -
        centerX;


    let dy =
        touch.clientY -
        centerY;


    const max =
        48;


    const distance =
        Math.hypot(
            dx,
            dy
        ) || 1;


    if (
        distance > max
    ) {

        dx =
            dx /
            distance *
            max;

        dy =
            dy /
            distance *
            max;
    }


    joystickInput.x =
        dx / max;


    joystickInput.y =
        dy / max;


    stick.style.transform =
        `translate(${dx}px,${dy}px)`;
}


joystick.addEventListener(
    "touchstart",
    e => {

        joystickTouch =
            e.changedTouches[0]
                .identifier;

        updateJoystick(
            e.changedTouches[0]
        );

        e.preventDefault();

    },
    {
        passive: false
    }
);


joystick.addEventListener(
    "touchmove",
    e => {

        for (
            const touch
            of e.changedTouches
        ) {

            if (
                touch.identifier ===
                joystickTouch
            ) {

                updateJoystick(
                    touch
                );
            }
        }

        e.preventDefault();

    },
    {
        passive: false
    }
);


joystick.addEventListener(
    "touchend",
    () => {

        joystickTouch =
            null;

        joystickInput.x = 0;

        joystickInput.y = 0;

        stick.style.transform =
            "";
    }
);

const fireButton =
    document.getElementById(
        "fireButton"
    );


fireButton.addEventListener(
    "touchstart",
    e => {

        mouse.down = true;

        shoot();

        e.preventDefault();

    },
    {
        passive: false
    }
);


fireButton.addEventListener(
    "touchend",
    e => {

        mouse.down = false;

        e.preventDefault();

    },
    {
        passive: false
    }
);