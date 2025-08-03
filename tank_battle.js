// 游戏常量
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TANK_SIZE = 60;
const BULLET_SIZE = 4;
const TANK_SPEED = 3;
const BULLET_SPEED = 7;
const ENEMY_SPAWN_RATE = 120; // 每120帧生成一个敌人
const WALL_SIZE = 20; // 墙壁大小

// 游戏状态
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    gameRunning: false,
    gameOver: false,
    enemySpawnTimer: 0
};

// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const gameOverlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startButton = document.getElementById('startButton');

// 游戏对象数组
let playerTank = null;
let enemies = [];
let bullets = [];
let explosions = [];
let walls = []; // 墙壁数组

// 键盘状态
const keys = {};

// 墙壁类
class Wall {
    constructor(x, y, type = 'brick') {
        this.x = x;
        this.y = y;
        this.type = type; // 'brick' 可破坏, 'steel' 不可破坏
        this.size = WALL_SIZE;
        this.health = type === 'brick' ? 1 : 999; // 砖墙1血，钢墙999血
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.direction * 90) * Math.PI / 180);
        
        // 坦克主体
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // 坦克炮管
        ctx.fillStyle = '#333';
        ctx.fillRect(-2, -this.size/2 - 8, 4, 8);
        
        // 坦克装饰
        ctx.fillStyle = '#666';
        ctx.fillRect(-this.size/2 + 2, -this.size/2 + 2, this.size - 4, this.size - 4);
        
        ctx.restore();

        // 绘制名字（在坦克下方）
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.isPlayer ? '王宇翱' : '吴泽凯', 0, this.size/2 + 20);
        ctx.restore();
    }

    getBounds() {
        return {
            left: this.x - this.size/2,
            right: this.x + this.size/2,
            top: this.y - this.size/2,
            bottom: this.y + this.size/2
        };
    }

    takeDamage() {
        if (this.type === 'brick') {
            this.health--;
            if (this.health <= 0) {
                // 创建爆炸效果
                explosions.push(new Explosion(this.x, this.y));
                return true; // 墙壁被摧毁
            }
        }
        return false; // 墙壁未被摧毁
    }
}

// 绘制王宇翱头像（戴眼镜的男性）
function drawWangYuAo(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    
    // 头部轮廓
    ctx.fillStyle = '#f4d03f';
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // 头发
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(0, -size/4, size/3, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(-size/6, -size/8, size/12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size/6, -size/8, size/12, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼镜框
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-size/6, -size/8, size/10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size/6, -size/8, size/10, 0, Math.PI * 2);
    ctx.stroke();
    
    // 眼镜连接
    ctx.beginPath();
    ctx.moveTo(-size/6 + size/10, -size/8);
    ctx.lineTo(size/6 - size/10, -size/8);
    ctx.stroke();
    
    // 鼻子
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(0, 0, size/20, 0, Math.PI * 2);
    ctx.fill();
    
    // 嘴巴
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, size/6, size/8, 0, Math.PI);
    ctx.stroke();
    
    ctx.restore();
}

// 绘制吴泽凯头像（做兔子手势的男性）
function drawWuZeKai(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    
    // 头部轮廓
    ctx.fillStyle = '#f4d03f';
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // 头发
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(0, -size/4, size/3, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(-size/6, -size/8, size/12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size/6, -size/8, size/12, 0, Math.PI * 2);
    ctx.fill();
    
    // 笑容
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, size/8, size/6, 0, Math.PI);
    ctx.stroke();
    
    // 兔子手势（V字手势）
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-size/2 - size/4, -size/2);
    ctx.lineTo(-size/2 - size/4, -size/2 - size/3);
    ctx.moveTo(-size/2 - size/4 - size/6, -size/2 - size/3);
    ctx.lineTo(-size/2 - size/4 + size/6, -size/2 - size/3);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(size/2 + size/4, -size/2);
    ctx.lineTo(size/2 + size/4, -size/2 - size/3);
    ctx.moveTo(size/2 + size/4 - size/6, -size/2 - size/3);
    ctx.lineTo(size/2 + size/4 + size/6, -size/2 - size/3);
    ctx.stroke();
    
    ctx.restore();
}

// 坦克类
class Tank {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isPlayer = isPlayer;
        this.direction = 0; // 0: 上, 1: 右, 2: 下, 3: 左
        this.size = TANK_SIZE;
        this.speed = TANK_SPEED;
        this.lastShot = 0;
        this.shotCooldown = 300; // 射击冷却时间(毫秒)
        this.health = isPlayer ? 1 : 1;
    }

    update() {
        if (this.isPlayer) {
            this.handlePlayerInput();
        } else {
            this.handleAI();
        }
        
        // 边界检测
        this.x = Math.max(this.size/2, Math.min(CANVAS_WIDTH - this.size/2, this.x));
        this.y = Math.max(this.size/2, Math.min(CANVAS_HEIGHT - this.size/2, this.y));
    }

    handlePlayerInput() {
        let newX = this.x;
        let newY = this.y;
        
        if (keys['w'] || keys['W'] || keys['ArrowUp']) {
            this.direction = 0;
            newY -= this.speed;
        }
        if (keys['s'] || keys['S'] || keys['ArrowDown']) {
            this.direction = 2;
            newY += this.speed;
        }
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
            this.direction = 3;
            newX -= this.speed;
        }
        if (keys['d'] || keys['D'] || keys['ArrowRight']) {
            this.direction = 1;
            newX += this.speed;
        }
        
        // 检查墙壁碰撞
        if (!this.checkWallCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
        }
        
        // 射击
        if (keys[' '] && Date.now() - this.lastShot > this.shotCooldown) {
            this.shoot();
            this.lastShot = Date.now();
        }
    }

    handleAI() {
        // 简单的AI逻辑
        if (Math.random() < 0.02) {
            this.direction = Math.floor(Math.random() * 4);
        }
        
        // 移动
        let newX = this.x;
        let newY = this.y;
        
        switch (this.direction) {
            case 0: newY -= this.speed * 0.5; break;
            case 1: newX += this.speed * 0.5; break;
            case 2: newY += this.speed * 0.5; break;
            case 3: newX -= this.speed * 0.5; break;
        }
        
        // 检查墙壁碰撞
        if (!this.checkWallCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
        }
        
        // 随机射击
        if (Math.random() < 0.01 && Date.now() - this.lastShot > this.shotCooldown) {
            this.shoot();
            this.lastShot = Date.now();
        }
    }

    checkWallCollision(newX, newY) {
        const tankBounds = {
            left: newX - this.size/2,
            right: newX + this.size/2,
            top: newY - this.size/2,
            bottom: newY + this.size/2
        };
        
        for (let wall of walls) {
            if (checkCollision(tankBounds, wall.getBounds())) {
                return true; // 有碰撞
            }
        }
        return false; // 无碰撞
    }

    shoot() {
        let bulletX = this.x;
        let bulletY = this.y;
        
        // 根据方向调整子弹起始位置
        switch (this.direction) {
            case 0: bulletY -= this.size/2; break;
            case 1: bulletX += this.size/2; break;
            case 2: bulletY += this.size/2; break;
            case 3: bulletX -= this.size/2; break;
        }
        
        bullets.push(new Bullet(bulletX, bulletY, this.direction, this.isPlayer));
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.direction * 90) * Math.PI / 180);
        
        // 坦克主体
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // 坦克炮管
        ctx.fillStyle = '#333';
        ctx.fillRect(-2, -this.size/2 - 8, 4, 8);
        
        // 坦克装饰
        ctx.fillStyle = '#666';
        ctx.fillRect(-this.size/2 + 2, -this.size/2 + 2, this.size - 4, this.size - 4);
        
        ctx.restore();

        // 绘制名字（在坦克下方）
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.isPlayer ? '王宇翱' : '吴泽凯', 0, this.size/2 + 20);
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// 碰撞检测
function checkCollision(rect1, rect2) {
    return rect1.left < rect2.right && 
           rect1.right > rect2.left && 
           rect1.top < rect2.bottom && 
           rect1.bottom > rect2.top;
}

// 创建地图
function createMap() {
    walls = [];
    
    // 创建边界墙（钢墙）
    for (let x = 0; x < CANVAS_WIDTH; x += WALL_SIZE) {
        walls.push(new Wall(x, 0, 'steel'));
        walls.push(new Wall(x, CANVAS_HEIGHT - WALL_SIZE, 'steel'));
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += WALL_SIZE) {
        walls.push(new Wall(0, y, 'steel'));
        walls.push(new Wall(CANVAS_WIDTH - WALL_SIZE, y, 'steel'));
    }
    
    // 创建内部障碍物（砖墙）
    // 中央十字形障碍
    for (let i = 0; i < 5; i++) {
        walls.push(new Wall(400, 200 + i * WALL_SIZE, 'brick'));
        walls.push(new Wall(400, 400 + i * WALL_SIZE, 'brick'));
        walls.push(new Wall(300 + i * WALL_SIZE, 300, 'brick'));
        walls.push(new Wall(500 + i * WALL_SIZE, 300, 'brick'));
    }
    
    // 四个角落的L形障碍
    // 左上角
    for (let i = 0; i < 3; i++) {
        walls.push(new Wall(150 + i * WALL_SIZE, 150, 'brick'));
        walls.push(new Wall(150, 150 + i * WALL_SIZE, 'brick'));
    }
    
    // 右上角
    for (let i = 0; i < 3; i++) {
        walls.push(new Wall(650 - i * WALL_SIZE, 150, 'brick'));
        walls.push(new Wall(650, 150 + i * WALL_SIZE, 'brick'));
    }
    
    // 左下角
    for (let i = 0; i < 3; i++) {
        walls.push(new Wall(150 + i * WALL_SIZE, 450, 'brick'));
        walls.push(new Wall(150, 450 - i * WALL_SIZE, 'brick'));
    }
    
    // 右下角
    for (let i = 0; i < 3; i++) {
        walls.push(new Wall(650 - i * WALL_SIZE, 450, 'brick'));
        walls.push(new Wall(650, 450 - i * WALL_SIZE, 'brick'));
    }
    
    // 随机散布的砖块
    for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * (CANVAS_WIDTH / WALL_SIZE)) * WALL_SIZE + WALL_SIZE/2;
        const y = Math.floor(Math.random() * (CANVAS_HEIGHT / WALL_SIZE)) * WALL_SIZE + WALL_SIZE/2;
        
        // 避免在玩家出生点附近生成
        if (Math.abs(x - CANVAS_WIDTH/2) > 100 || Math.abs(y - CANVAS_HEIGHT + 50) > 100) {
            walls.push(new Wall(x, y, 'brick'));
        }
    }
}

// 游戏初始化
function initGame() {
    playerTank = new Tank(CANVAS_WIDTH/2, CANVAS_HEIGHT - 50, '#4ecdc4', true);
    enemies = [];
    bullets = [];
    explosions = [];
    createMap(); // 创建地图
    gameState = {
        score: 0,
        lives: 3,
        level: 1,
        gameRunning: true,
        gameOver: false,
        enemySpawnTimer: 0
    };
    updateUI();
}

// 生成敌人
function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch (side) {
        case 0: // 上
            x = Math.random() * (CANVAS_WIDTH - 100) + 50;
            y = -TANK_SIZE;
            break;
        case 1: // 右
            x = CANVAS_WIDTH + TANK_SIZE;
            y = Math.random() * (CANVAS_HEIGHT - 100) + 50;
            break;
        case 2: // 下
            x = Math.random() * (CANVAS_WIDTH - 100) + 50;
            y = CANVAS_HEIGHT + TANK_SIZE;
            break;
        case 3: // 左
            x = -TANK_SIZE;
            y = Math.random() * (CANVAS_HEIGHT - 100) + 50;
            break;
    }
    
    const colors = ['#ff6b6b', '#ff8e8e', '#ffb3b3'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    enemies.push(new Tank(x, y, color, false));
}

// 更新UI
function updateUI() {
    scoreElement.textContent = gameState.score;
    livesElement.textContent = gameState.lives;
    levelElement.textContent = gameState.level;
}

// 游戏主循环
function gameLoop() {
    if (!gameState.gameRunning) return;
    
    // 清空画布
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 绘制网格背景
    drawGrid();
    
    // 绘制墙壁
    walls.forEach(wall => wall.draw());
    
    // 更新玩家坦克
    if (playerTank) {
        playerTank.update();
        playerTank.draw();
    }
    
    // 生成敌人
    gameState.enemySpawnTimer++;
    if (gameState.enemySpawnTimer >= ENEMY_SPAWN_RATE) {
        spawnEnemy();
        gameState.enemySpawnTimer = 0;
    }
    
    // 更新敌人
    enemies.forEach(enemy => {
        enemy.update();
        enemy.draw();
    });
    
    // 更新子弹
    bullets.forEach(bullet => {
        bullet.update();
        bullet.draw();
    });
    
    // 更新爆炸效果
    explosions.forEach(explosion => {
        explosion.update();
        explosion.draw();
    });
    
    // 清理死亡对象
    bullets = bullets.filter(bullet => !bullet.isOutOfBounds());
    explosions = explosions.filter(explosion => !explosion.isDead());
    walls = walls.filter(wall => wall.health > 0);
    
    // 碰撞检测
    checkCollisions();
    
    // 检查游戏结束条件
    if (gameState.lives <= 0) {
        gameOver();
    }
    
    requestAnimationFrame(gameLoop);
}

// 绘制网格背景
function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    
    for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_HEIGHT, y);
        ctx.stroke();
    }
}

// 碰撞检测
function checkCollisions() {
    // 子弹与墙壁碰撞
    bullets.forEach((bullet, bulletIndex) => {
        walls.forEach((wall, wallIndex) => {
            if (checkCollision(bullet.getBounds(), wall.getBounds())) {
                // 移除子弹
                bullets.splice(bulletIndex, 1);
                
                // 墙壁受到伤害
                if (wall.takeDamage()) {
                    // 墙壁被摧毁，已从数组中移除
                }
            }
        });
    });
    
    // 玩家子弹与敌人碰撞
    bullets.forEach((bullet, bulletIndex) => {
        if (bullet.isPlayerBullet) {
            enemies.forEach((enemy, enemyIndex) => {
                if (checkCollision(bullet.getBounds(), enemy.getBounds())) {
                    // 创建爆炸效果
                    explosions.push(new Explosion(enemy.x, enemy.y));
                    
                    // 移除子弹和敌人
                    bullets.splice(bulletIndex, 1);
                    enemies.splice(enemyIndex, 1);
                    
                    // 增加分数
                    gameState.score += 100;
                    updateUI();
                }
            });
        }
    });
    
    // 敌人子弹与玩家碰撞
    bullets.forEach((bullet, bulletIndex) => {
        if (!bullet.isPlayerBullet && playerTank) {
            if (checkCollision(bullet.getBounds(), playerTank.getBounds())) {
                // 创建爆炸效果
                explosions.push(new Explosion(playerTank.x, playerTank.y));
                
                // 移除子弹
                bullets.splice(bulletIndex, 1);
                
                // 减少生命
                gameState.lives--;
                updateUI();
                
                // 重置玩家位置
                playerTank.x = CANVAS_WIDTH/2;
                playerTank.y = CANVAS_HEIGHT - 50;
            }
        }
    });
    
    // 玩家与敌人碰撞
    if (playerTank) {
        enemies.forEach((enemy, enemyIndex) => {
            if (checkCollision(playerTank.getBounds(), enemy.getBounds())) {
                // 创建爆炸效果
                explosions.push(new Explosion(playerTank.x, playerTank.y));
                explosions.push(new Explosion(enemy.x, enemy.y));
                
                // 移除敌人
                enemies.splice(enemyIndex, 1);
                
                // 减少生命
                gameState.lives--;
                updateUI();
                
                // 重置玩家位置
                playerTank.x = CANVAS_WIDTH/2;
                playerTank.y = CANVAS_HEIGHT - 50;
            }
        });
    }
}

// 游戏结束
function gameOver() {
    gameState.gameRunning = false;
    gameState.gameOver = true;
    
    overlayTitle.textContent = '游戏结束';
    overlayMessage.textContent = `王宇翱最终得分: ${gameState.score}`;
    startButton.textContent = '重新开始';
    gameOverlay.classList.remove('hidden');
}

// 开始游戏
function startGame() {
    gameOverlay.classList.add('hidden');
    initGame();
    gameLoop();
}

// 事件监听器
startButton.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // 重新开始游戏
    if (e.key === 'r' || e.key === 'R') {
        if (gameState.gameOver) {
            startGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// 防止空格键滚动页面
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        e.preventDefault();
    }
});

// 初始化游戏
initGame();
gameLoop(); 