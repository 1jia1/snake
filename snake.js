class Snake {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 20;
        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.food = this.generateFood();
        this.score = 0;
        this.gameLoop = null;
        this.isPaused = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.audioInitialized = false;
        this.gameMode = 'normal';

        // 音频元素
        this.moveSound = document.getElementById('moveSound');
        this.eatSound = document.getElementById('eatSound');
        this.gameOverSound = document.getElementById('gameOverSound');
        this.bgMusic = document.getElementById('bgMusic');

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupControls();

        // 监听游戏模式变化
        document.getElementById('modeSelect').addEventListener('change', (e) => {
            this.gameMode = e.target.value;
            if (this.gameLoop) {
                this.gameOver();
                this.start();
            }
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        this.canvas.width = containerWidth;
        this.canvas.height = containerWidth;
        this.cols = Math.floor(this.canvas.width / this.gridSize);
        this.rows = Math.floor(this.canvas.height / this.gridSize);
    }

    setupControls() {
        // 触摸控制
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0 && this.direction !== 'left') {
                    this.direction = 'right';
                } else if (deltaX < 0 && this.direction !== 'right') {
                    this.direction = 'left';
                }
            } else {
                if (deltaY > 0 && this.direction !== 'up') {
                    this.direction = 'down';
                } else if (deltaY < 0 && this.direction !== 'down') {
                    this.direction = 'up';
                }
            }
        });

        // 键盘控制（作为备选）
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    if (this.direction !== 'down') this.direction = 'up';
                    break;
                case 'ArrowDown':
                    if (this.direction !== 'up') this.direction = 'down';
                    break;
                case 'ArrowLeft':
                    if (this.direction !== 'right') this.direction = 'left';
                    break;
                case 'ArrowRight':
                    if (this.direction !== 'left') this.direction = 'right';
                    break;
            }
        });
    }

    generateFood() {
        return {
            x: Math.floor(Math.random() * this.cols),
            y: Math.floor(Math.random() * this.rows)
        };
    }

    getGameSpeed() {
        switch(this.gameMode) {
            case 'hard': return 150;
            case 'hell': return 100;
            default: return 200;
        }
    }

    getScoreMultiplier() {
        switch(this.gameMode) {
            case 'hard': return 1.5;
            case 'hell': return 2;
            default: return 1;
        }
    }

    update() {
        const head = {...this.snake[0]};

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // 播放移动音效
        if (this.audioInitialized) {
            this.moveSound.currentTime = 0;
            this.moveSound.play().catch(error => {
                console.error('播放移动音效失败:', error);
            });
        }

        // 检查碰撞
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            const baseScore = 10;
            this.score += Math.round(baseScore * this.getScoreMultiplier());
            document.getElementById('score').textContent = `分数: ${this.score}`;
            this.food = this.generateFood();
            // 播放吃到食物的音效
            if (this.audioInitialized) {
                this.eatSound.currentTime = 0;
                this.eatSound.play().catch(error => {
                    console.error('播放吃食物音效失败:', error);
                });
            }
        } else {
            this.snake.pop();
        }
    }

    async start() {
        if (this.gameLoop) return;

        // 初始化音频设置
        if (!this.audioInitialized) {
            this.initAudio();
        }

        // 重置游戏状态
        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.score = 0;
        document.getElementById('score').textContent = '分数: 0';
        this.food = this.generateFood();
        document.getElementById('startButton').textContent = '游戏中';

        // 播放背景音乐
        try {
            this.bgMusic.currentTime = 0; // 重置播放位置
            await this.bgMusic.play();
        } catch (error) {
            console.error('播放背景音乐失败:', error);
        }

        // 启动游戏循环
        this.gameLoop = setInterval(() => {
            if (!this.isPaused) {
                this.update();
                this.draw();
            }
        }, this.getGameSpeed());
    }

    checkCollision(head) {
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            return true;
        }

        // 检查自身碰撞
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制蛇
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#4CAF50' : '#2E7D32';
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });

        // 绘制食物
        this.ctx.fillStyle = '#FF4081';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 1,
            this.gridSize - 1
        );
    }

    gameOver() {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
        // 停止背景音乐
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
        // 播放游戏结束音效
        this.gameOverSound.play();
        alert(`游戏结束！得分：${this.score}`);
        document.getElementById('startButton').textContent = '重新开始';
    }

    initAudio() {
        this.bgMusic.volume = 0.5;
        this.moveSound.volume = 0.3;
        this.eatSound.volume = 0.3;
        this.gameOverSound.volume = 0.4;
        this.audioInitialized = true; // 标记为已初始化
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        // 暂停/继续背景音乐
        if (this.isPaused) {
            this.bgMusic.pause();
        } else {
            this.bgMusic.play();
        }
        document.getElementById('pauseButton').textContent = 
            this.isPaused ? '继续' : '暂停';
    }
}

// 初始化游戏
const canvas = document.getElementById('gameCanvas');
const game = new Snake(canvas);

// 按钮控制
document.getElementById('startButton').addEventListener('click', () => {
    game.start();
});

document.getElementById('pauseButton').addEventListener('click', () => {
    game.togglePause();
});

// 初始绘制
game.draw();