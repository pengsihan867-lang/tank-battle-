
        // 游戏常量
        const CANVAS_WIDTH = 800;
        const CANVAS_HEIGHT = 600;
        const TANK_SIZE = 40; // 增大坦克尺寸
        const BULLET_SIZE = 4;
        const TANK_SPEED = 3;
        const BULLET_SPEED = 7;
        const ENEMY_SPAWN_RATE = 120;
        const WALL_SIZE = 20;

        // 游戏状态
        let gameState = {
            score: 0, lives: 3, level: 1,
            gameRunning: false, gameOver: false, enemySpawnTimer: 0
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
        let walls = [];
        const keys = {};

        // 墙壁类
        class Wall {
            constructor(x, y, type = 'brick') {
                this.x = x; this.y = y; this.type = type;
                this.size = WALL_SIZE;
                this.health = type === 'brick' ? 1 : 999;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                
                if (this.type === 'brick') {
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
                    ctx.beginPath();
                    ctx.moveTo(-this.size/2, 0);
                    ctx.lineTo(this.size/2, 0);
                    ctx.moveTo(0, -this.size/2);
                    ctx.lineTo(0, this.size/2);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = '#708090';
                    ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
                    ctx.strokeStyle = '#2F4F4F';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(-this.size/2 + 2, -this.size/2 + 2, this.size/3, this.size/3);
                }
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
                        explosions.push(new Explosion(this.x, this.y));
                        return true;
                    }
                }
                return false;
            }
        }

        // 绘制王宇翱头像
        function drawWangYuAo(x, y, size) {
            ctx.save();
            ctx.translate(x, y);
            
            ctx.fillStyle = '#f4d03f';
            ctx.beginPath();
            ctx.arc(0, 0, size/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(0, -size/4, size/3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(-size/6, -size/8, size/12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(size/6, -size/8, size/12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#34495e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(-size/6, -size/8, size/10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(size/6, -size/8, size/10, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(-size/6 + size/10, -size/8);
            ctx.lineTo(size/6 - size/10, -size/8);
            ctx.stroke();
            
            ctx.fillStyle = '#e67e22';
            ctx.beginPath();
            ctx.arc(0, 0, size/20, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, size/6, size/8, 0, Math.PI);
            ctx.stroke();
            
            ctx.restore();
        }

        // 绘制吴泽凯头像
        function drawWuZeKai(x, y, size) {
            ctx.save();
            ctx.translate(x, y);
            
            ctx.fillStyle = '#f4d03f';
            ctx.beginPath();
            ctx.arc(0, 0, size/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(0, -size/4, size/3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(-size/6, -size/8, size/12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(size/6, -size/8, size/12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, size/8, size/6, 0, Math.PI);
            ctx.stroke();
            
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

        // 绘制角色名字标签
        function drawNameLabel(x, y, name, isPlayer) {
            ctx.save();
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isPlayer ? '#4ecdc4' : '#ff6b6b';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(name, x, y - TANK_SIZE/2 - 15);
            ctx.fillText(name, x, y - TANK_SIZE/2 - 15);
            ctx.restore();
        }

        // 坦克类
        class Tank {
            constructor(x, y, color, isPlayer = false) {
                this.x = x; this.y = y; this.color = color; this.isPlayer = isPlayer;
                this.direction = 0;
                this.size = TANK_SIZE;
                this.speed = TANK_SPEED;
                this.lastShot = 0;
                this.shotCooldown = 300;
                this.health = 1;
            }

            update() {
                if (this.isPlayer) {
                    this.handlePlayerInput();
                } else {
                    this.handleAI();
                }
                
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
                
                if (!this.checkWallCollision(newX, newY)) {
                    this.x = newX;
                    this.y = newY;
                }
                
                if (keys[' '] && Date.now() - this.lastShot > this.shotCooldown) {
                    this.shoot();
                    this.lastShot = Date.now();
                }
            }

            handleAI() {
                if (Math.random() < 0.02) {
                    this.direction = Math.floor(Math.random() * 4);
                }
                
                let newX = this.x;
                let newY = this.y;
                
                switch (this.direction) {
                    case 0: newY -= this.speed * 0.5; break;
                    case 1: newX += this.speed * 0.5; break;
                    case 2: newY += this.speed * 0.5; break;
                    case 3: newX -= this.speed * 0.5; break;
                }
                
                if (!this.checkWallCollision(newX, newY)) {
                    this.x = newX;
                    this.y = newY;
                }
                
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
                        return true;
                    }
                }
                return false;
            }

            shoot() {
                let bulletX = this.x;
                let bulletY = this.y;
                
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
                
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
                
                ctx.fillStyle = '#333';
                ctx.fillRect(-2, -this.size/2 - 8, 4, 8);
                
                ctx.fillStyle = '#666';
                ctx.fillRect(-this.size/2 + 2, -this.size/2 + 2, this.size - 4, this.size - 4);
                
                ctx.restore();
                
                if (this.isPlayer) {
                    drawWangYuAo(this.x, this.y, this.size);
                    drawNameLabel(this.x, this.y, '王宇翱', true);
                } else {
                    drawWuZeKai(this.x, this.y, this.size);
                    drawNameLabel(this.x, this.y, '吴泽凯', false);
                }
            }

            getBounds() {
                return {
                    left: this.x - this.size/2,
                    right: this.x + this.size/2,
                    top: this.y - this.size/2,
                    bottom: this.y + this.size/2
                };
            }
        }

        // 子弹类
        class Bullet {
            constructor(x, y, direction, isPlayerBullet) {
                this.x = x; this.y = y; this.direction = direction;
                this.isPlayerBullet = isPlayerBullet;
                this.speed = BULLET_SPEED;
                this.size = BULLET_SIZE;
            }

            update() {
                switch (this.direction) {
                    case 0: this.y -= this.speed; break;
                    case 1: this.x += this.speed; break;
                    case 2: this.y += this.speed; break;
                    case 3: this.x -= this.speed; break;
                }
            }

            draw() {
                ctx.fillStyle = this.isPlayerBullet ? '#4ecdc4' : '#ff6b6b';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = this.isPlayerBullet ? 'rgba(78, 205, 196, 0.5)' : 'rgba(255, 107, 107, 0.5)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                ctx.fill();
            }

            isOutOfBounds() {
                return this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT;
            }

            getBounds() {
                return {
                    left: this.x - this.size,
                    right: this.x + this.size,
                    top: this.y - this.size,
                    bottom: this.y + this.size
                };
            }
        }

        // 爆炸效果类
        class Explosion {
            constructor(x, y) {
                this.x = x; this.y = y;
                this.radius = 5;
                this.life = 1.0;
                this.decay = 0.05;
            }

            update() {
                this.radius += 2;
                this.life -= this.decay;
            }

            draw() {
                const alpha = this.life;
                ctx.save();
                ctx.globalAlpha = alpha;
                
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
                gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
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
            
            // 边界墙
            for (let x = 0; x < CANVAS_WIDTH; x += WALL_SIZE) {
                walls.push(new Wall(x, 0, 'steel'));
                walls.push(new Wall(x, CANVAS_HEIGHT - WALL_SIZE, 'steel'));
            }
            for (let y = 0; y < CANVAS_HEIGHT; y += WALL_SIZE) {
                walls.push(new Wall(0, y, 'steel'));
                walls.push(new Wall(CANVAS_WIDTH - WALL_SIZE, y, 'steel'));
            }
            
            // 中央十字形障碍
            for (let i = 0; i < 5; i++) {
                walls.push(new Wall(400, 200 + i * WALL_SIZE, 'brick'));
                walls.push(new Wall(400, 400 + i * WALL_SIZE, 'brick'));
                walls.push(new Wall(300 + i * WALL_SIZE, 300, 'brick'));
                walls.push(new Wall(500 + i * WALL_SIZE, 300, 'brick'));
            }
            
            // 角落L形障碍
            for (let i = 0; i < 3; i++) {
                walls.push(new Wall(150 + i * WALL_SIZE, 150, 'brick'));
                walls.push(new Wall(150, 150 + i * WALL_SIZE, 'brick'));
                walls.push(new Wall(650 - i * WALL_SIZE, 150, 'brick'));
                walls.push(new Wall(650, 150 + i * WALL_SIZE, 'brick'));
                walls.push(new Wall(150 + i * WALL_SIZE, 450, 'brick'));
                walls.push(new Wall(150, 450 - i * WALL_SIZE, 'brick'));
                walls.push(new Wall(650 - i * WALL_SIZE, 450, 'brick'));
                walls.push(new Wall(650, 450 - i * WALL_SIZE, 'brick'));
            }
            
            // 随机砖块
            for (let i = 0; i < 20; i++) {
                const x = Math.floor(Math.random() * (CANVAS_WIDTH / WALL_SIZE)) * WALL_SIZE + WALL_SIZE/2;
                const y = Math.floor(Math.random() * (CANVAS_HEIGHT / WALL_SIZE)) * WALL_SIZE + WALL_SIZE/2;
                
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
            createMap();
            gameState = {
                score: 0, lives: 3, level: 1,
                gameRunning: true, gameOver: false, enemySpawnTimer: 0
            };
            updateUI();
        }

        // 生成敌人
        function spawnEnemy() {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            
            switch (side) {
                case 0: x = Math.random() * (CANVAS_WIDTH - 100) + 50; y = -TANK_SIZE; break;
                case 1: x = CANVAS_WIDTH + TANK_SIZE; y = Math.random() * (CANVAS_HEIGHT - 100) + 50; break;
                case 2: x = Math.random() * (CANVAS_WIDTH - 100) + 50; y = CANVAS_HEIGHT + TANK_SIZE; break;
                case 3: x = -TANK_SIZE; y = Math.random() * (CANVAS_HEIGHT - 100) + 50; break;
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
            
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            // 绘制网格
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
            
            walls.forEach(wall => wall.draw());
            
            if (playerTank) {
                playerTank.update();
                playerTank.draw();
            }
            
            gameState.enemySpawnTimer++;
            if (gameState.enemySpawnTimer >= ENEMY_SPAWN_RATE) {
                spawnEnemy();
                gameState.enemySpawnTimer = 0;
            }
            
            enemies.forEach(enemy => {
                enemy.update();
                enemy.draw();
            });
            
            bullets.forEach(bullet => {
                bullet.update();
                bullet.draw();
            });
            
            explosions.forEach(explosion => {
                explosion.update();
                explosion.draw();
            });
            
            bullets = bullets.filter(bullet => !bullet.isOutOfBounds());
            explosions = explosions.filter(explosion => !explosion.isDead());
            walls = walls.filter(wall => wall.health > 0);
            
            checkCollisions();
            
            if (gameState.lives <= 0) {
                gameOver();
            }
            
            requestAnimationFrame(gameLoop);
        }

        // 碰撞检测
        function checkCollisions() {
            bullets.forEach((bullet, bulletIndex) => {
                walls.forEach((wall, wallIndex) => {
                    if (checkCollision(bullet.getBounds(), wall.getBounds())) {
                        bullets.splice(bulletIndex, 1);
                        if (wall.takeDamage()) {
                            // 墙壁被摧毁
                        }
                    }
                });
            });
            
            bullets.forEach((bullet, bulletIndex) => {
                if (bullet.isPlayerBullet) {
                    enemies.forEach((enemy, enemyIndex) => {
                        if (checkCollision(bullet.getBounds(), enemy.getBounds())) {
                            explosions.push(new Explosion(enemy.x, enemy.y));
                            bullets.splice(bulletIndex, 1);
                            enemies.splice(enemyIndex, 1);
                            gameState.score += 100;
                            updateUI();
                        }
                    });
                }
            });
            
            bullets.forEach((bullet, bulletIndex) => {
                if (!bullet.isPlayerBullet && playerTank) {
                    if (checkCollision(bullet.getBounds(), playerTank.getBounds())) {
                        explosions.push(new Explosion(playerTank.x, playerTank.y));
                        bullets.splice(bulletIndex, 1);
                        gameState.lives--;
                        updateUI();
                        playerTank.x = CANVAS_WIDTH/2;
                        playerTank.y = CANVAS_HEIGHT - 50;
                    }
                }
            });
            
            if (playerTank) {
                enemies.forEach((enemy, enemyIndex) => {
                    if (checkCollision(playerTank.getBounds(), enemy.getBounds())) {
                        explosions.push(new Explosion(playerTank.x, playerTank.y));
                        explosions.push(new Explosion(enemy.x, enemy.y));
                        enemies.splice(enemyIndex, 1);
                        gameState.lives--;
                        updateUI();
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
            if (e.key === 'r' || e.key === 'R') {
                if (gameState.gameOver) {
                    startGame();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
            }
        });

        // 初始化游戏
        initGame();
        gameLoop();
    