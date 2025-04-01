    // Game elements
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const finalScoreElement = document.getElementById('final-score');
    const finalCoinsElement = document.getElementById('final-coins');
    const finalTotalElement = document.getElementById('final-total');
    const finalHighScoreElement = document.getElementById('high-score')
    const flapSound = document.getElementById('flap-sound');
    const coinSound = document.getElementById('coin-sound');
    const hitSound = document.getElementById('hit-sound');
    const backgroundMusic = document.getElementById('background-music');

    // Game variables
    let gameStarted = false;
    let gameOver = false;
    let score = 0;
    let coins = 0;
    let frames = 0;
    const coinValue = 5;
    let highScore = localStorage.getItem("highScore") ? parseInt(localStorage.getItem("highScore")) : 0;

    // Load images
    const birdImage = new Image();
    birdImage.src = '/assets/bird.png'; 
    
    const pipeTopImage = new Image();
    pipeTopImage.src = '/assets/cloud.jpg'; 
    
    const pipeBottomImage = new Image();
    pipeBottomImage.src = '/assets/cloud.jpg';
    
    const coinImage = new Image();
    coinImage.src = '/assets/coin.png'; 
    
    const backgroundImage = new Image();
    backgroundImage.src = '/assets/background.png'; 
    
    const groundImage = new Image();
    groundImage.src = '/assets/ground.png';

 // Sound functions
    function playFlapSound() {
        // Clone the audio element to allow overlapping sounds
        const flapSoundClone = flapSound.cloneNode();
        flapSoundClone.volume = 0.5; // Set volume (0.0 to 1.0)
        flapSoundClone.play().catch(e => console.log("Audio play failed:", e));
    }

    function playCoinSound() {
        const coinSoundClone = coinSound.cloneNode();
        coinSoundClone.volume = 0.7;
        coinSoundClone.play().catch(e => console.log("Audio play failed:", e));
    }

    function playHitSound() {
        hitSound.volume = 0.8;
        hitSound.play().catch(e => console.log("Audio play failed:", e));
    }

    function playBackgroundMusic() {
        backgroundMusic.volume = 0.7; 
        backgroundMusic.play().catch(e => console.log("Background music play failed:", e));
    }
    
    function stopBackgroundMusic() {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0; 
    }

    // Bird properties
    const bird = {
        x: 50,
        y: 150,
        width: 34,
        height: 24,
        gravity: 0.5,
        jump: 6.6,
        velocity: 0,
        
        draw: function() {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Rotate bird based on velocity
            this.rotation = Math.min(Math.PI/4, Math.max(-Math.PI/4, this.velocity * 0.04));
            ctx.rotate(this.rotation);
            
            // Draw the bird image instead of shapes
            ctx.drawImage(birdImage, -this.width/2, -this.height/2, this.width, this.height);
            
            // Add custom drawings on the placeholder
            if (!birdImage.complete) {
                // Yellow bird body
                ctx.fillStyle = '#f39c12';
                ctx.beginPath();
                ctx.arc(-this.width/4, 0, this.height/2, 0, Math.PI * 2);
                ctx.fill();
                
                // Eye
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(0, -this.height/4, this.height/5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(0, -this.height/4, this.height/10, 0, Math.PI * 2);
                ctx.fill();
                
                // Beak
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.moveTo(this.width/4, 0);
                ctx.lineTo(this.width/2, -this.height/6);
                ctx.lineTo(this.width/2, this.height/6);
                ctx.closePath();
                ctx.fill();
                
                // Wing
                ctx.fillStyle = '#e67e22';
                ctx.beginPath();
                ctx.ellipse(-this.width/4, this.height/4, this.width/4, this.height/6, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        },
        
        flap: function() {
            this.velocity = -this.jump;
        },
        
        update: function() {
            // Apply gravity and update position
            this.velocity += this.gravity;
            this.y += this.velocity;
            
            // Check for collision with ground
            if (this.y + this.height/2 >= canvas.height - foreground.height) {
                this.y = canvas.height - foreground.height - this.height/2;
                if (gameStarted && !gameOver) {
                    gameOverHandler();
                }
            }
            
            // Check for collision with ceiling
            if (this.y - this.height/2 <= 0) {
                this.y = this.height/2;
                this.velocity = 0;
            }
        }
    };

    // Coins properties
    const rewards = {
        position: [],
        size: 15,
        value: coinValue,
        rotation: 0,
        
        draw: function() {
            // Rotate all coins for spinning effect
            this.rotation += 0.05;
            
            for (let i = 0; i < this.position.length; i++) {
                let c = this.position[i];
                
                if (c.collected) continue;
                
                ctx.save();
                ctx.translate(c.x, c.y);
                ctx.rotate(this.rotation);
                
                // Draw the coin image
                ctx.drawImage(coinImage, -this.size, -this.size, this.size * 2, this.size * 2);
                
                // Add custom drawing on placeholder
                if (!coinImage.complete) {
                    // Gold coin
                    ctx.fillStyle = '#f1c40f';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Shine
                    ctx.fillStyle = '#ffd700';
                    ctx.beginPath();
                    ctx.arc(-this.size/3, -this.size/3, this.size/3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Dollar sign
                    // ctx.fillStyle = '#7d6608';
                    // ctx.font = '15px Arial';
                    // ctx.fillText('$', -5, 5);
                }
                
                ctx.restore();
                
                // Move coins to the left
                if (gameStarted && !gameOver) {
                    c.x -= 2;
                }
                
                // Check for collection
                const dx = bird.x - c.x;
                const dy = bird.y - c.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < this.size + 10 && !c.collected) {
                    c.collected = true;
                    coins += 1;
                    playCoinSound();
                }
                
                // Remove coins once they're off screen
                if (c.x + this.size <= 0) {
                    this.position.splice(i, 1);
                    i--;
                }
            }
        },
        
        update: function() {
            // Add new coin every 150 frames
            if (frames % 150 === 0 && Math.random() > 0.3) {
                this.position.push({
                    x: canvas.width,
                    y: 100 + Math.random() * (canvas.height - 200 - foreground.height),
                    collected: false
                });
            }
        }
    };

    // Pipes properties
    const pipes = {
        position: [],
        width: 52,
        height: 320,
        gap: 120,
        // Adjusted pipe positioning
        minYPosition: -250,
        maxYPosition: -80,
        
        draw: function() {
            for (let i = 0; i < this.position.length; i++) {
                let p = this.position[i];
                
                // Top pipe
                ctx.save();
                ctx.drawImage(pipeTopImage, p.x, p.y, this.width, this.height);
                
                // Custom pipe drawing if image not loaded
                if (!pipeTopImage.complete) {
                    ctx.fillStyle = '#2ecc71';
                    ctx.fillRect(p.x, p.y, this.width, this.height);
                    
                    // Border for pipe
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(p.x, p.y, this.width, this.height);
                    
                    // Top cap
                    ctx.fillStyle = '#27ae60';
                    ctx.fillRect(p.x - 3, p.y, this.width + 6, 20);
                    ctx.strokeRect(p.x - 3, p.y, this.width + 6, 20);
                }
                ctx.restore();
                
                // Bottom pipe
                ctx.save();
                ctx.drawImage(pipeBottomImage, p.x, p.y + this.height + this.gap, this.width, this.height);
                
                // Custom pipe drawing if image not loaded
                if (!pipeBottomImage.complete) {
                    ctx.fillStyle = '#2ecc71';
                    ctx.fillRect(p.x, p.y + this.height + this.gap, this.width, this.height);
                    
                    // Border for pipe
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(p.x, p.y + this.height + this.gap, this.width, this.height);
                    
                    // Bottom cap
                    ctx.fillStyle = '#27ae60';
                    ctx.fillRect(p.x - 3, p.y + this.height + this.gap, this.width + 6, 20);
                    ctx.strokeRect(p.x - 3, p.y + this.height + this.gap, this.width + 6, 20);
                }
                ctx.restore();
                
                // Move pipes to the left
                if (gameStarted && !gameOver) {
                    p.x -= 2;
                }
                
                // Remove pipes once they're off screen
                if (p.x + this.width <= 0) {
                    this.position.shift();
                    // Add point when passing pipe
                    score += 1;
                }
                
                // Check for collision
                if (
                    bird.x + bird.width/2 > p.x && 
                    bird.x - bird.width/2 < p.x + this.width && 
                    (
                        bird.y - bird.height/2 < p.y + this.height || 
                        bird.y + bird.height/2 > p.y + this.height + this.gap
                    )
                ) {
                    if (!gameOver) {
                        gameOverHandler();
                    }
                }
            }
        },
        
        update: function() {
            // Add new pipe every 100 frames
            if (frames % 100 === 0) {
                // Generate Y position within reasonable range
                const randomY = this.minYPosition + Math.random() * (this.maxYPosition - this.minYPosition);
                this.position.push({
                    x: canvas.width,
                    y: randomY
                });
            }
        }
    };

    // Foreground properties
    const foreground = {
        height: 100,
        
        draw: function() {
            // Draw the ground image across the bottom
            ctx.drawImage(groundImage, 0, canvas.height - this.height, canvas.width, this.height);
            
            // Add custom ground if image not loaded
            if (!groundImage.complete) {
                ctx.fillStyle = '#debb87';
                ctx.fillRect(0, canvas.height - this.height, canvas.width, this.height);
                
                // Add texture
                ctx.fillStyle = '#c19a67';
                for (let i = 0; i < canvas.width; i += 20) {
                    ctx.fillRect(i, canvas.height - this.height + 15, 10, 5);
                    ctx.fillRect(i + 10, canvas.height - this.height + 35, 12, 5);
                }
                
                // Add top border
                ctx.fillStyle = '#8e7554';
                ctx.fillRect(0, canvas.height - this.height, canvas.width, 5);
            }
        }
    };

    // Background properties
    const background = {
        draw: function() {
            // Draw background image
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
            
            // Add custom background if image not loaded
            if (!backgroundImage.complete) {
                // Sky
                ctx.fillStyle = '#70c5ce';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Clouds
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(80, 80, 30, 0, Math.PI * 2);
                ctx.arc(120, 70, 40, 0, Math.PI * 2);
                ctx.arc(160, 85, 25, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(240, 100, 25, 0, Math.PI * 2);
                ctx.arc(280, 90, 35, 0, Math.PI * 2);
                ctx.arc(320, 110, 20, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    // Draw score and coins
    function drawScore() {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.font = '25px Arial';
        
        // Draw score
        ctx.fillText("Score: " + score, 10, 30);
        ctx.strokeText("Score: " + score, 10, 30);
        
        // Draw coins
        ctx.fillText("Coins: " + coins, 10, 60);
        ctx.strokeText("Coins: " + coins, 10, 60);
        
        // Draw total
        const total = score + (coins * coinValue);
        ctx.fillText("Total: " + total, 10, 90);
        ctx.strokeText("Total: " + total, 10, 90);

        // Max point
        ctx.fillText("High Score: " + highScore, 10, 120);
        ctx.strokeText("High Score: " + highScore, 10, 120);
    }

    // Animation frame counter for bird animation
    let animationFrame = 0;

    // Game loop
    function gameLoop() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw game elements
        background.draw();
        pipes.draw();
        rewards.draw();
        bird.draw();
        foreground.draw();
        drawScore();
        
        if (gameStarted && !gameOver) {
            // Update game elements
            bird.update();
            pipes.update();
            rewards.update();
            frames++;
            
            // Update animation frame
            if (frames % 5 === 0) {
                animationFrame = (animationFrame + 1) % 3;
            }
        }
        
        requestAnimationFrame(gameLoop);
    }

    // Game over handler
    function gameOverHandler() {
        gameOver = true;
        finalScoreElement.textContent = score;
        finalCoinsElement.textContent = coins;
        finalTotalElement.textContent = score + (coins * coinValue);
        finalHighScoreElement.textContent = highScore;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore); // Save in localStorage
        }
        gameOverScreen.style.display = 'flex';
        playHitSound();
        stopBackgroundMusic();
    }

    // Reset game
    function resetGame() {
        // Calculate total before resetting
        const total = score + (coins * coinValue);
        
        // Update high score if total exceeds current high score
        if (total > highScore) {
            highScore = total;
            localStorage.setItem("highScore", highScore);
        }
        gameOver = false;
        gameStarted = true;
        score = 0;
        coins = 0;
        frames = 0;
        bird.y = 150;
        bird.velocity = 0;
        pipes.position = [];
        rewards.position = [];
        gameOverScreen.style.display = 'none';
        playBackgroundMusic();
    }

    // Event listeners
    startButton.addEventListener('click', function() {
        gameStarted = true;
        startScreen.style.display = 'none';
        playBackgroundMusic();
    });

    restartButton.addEventListener('click', function() {
        resetGame();
    });

    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space') {
            if (!gameStarted) {
                gameStarted = true;
                startScreen.style.display = 'none';
                playBackgroundMusic();
            } else if (!gameOver) {
                bird.flap();
                playFlapSound();
            }
        }
    });

    canvas.addEventListener('click', function() {
        if (!gameOver && gameStarted) {
            bird.flap();
            playFlapSound();
        }
    });

    // Start game loop
    gameLoop();