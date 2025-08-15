import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.currentLevel = 1;
        this.highScores = {};
        this.sceneStartTime = 0;
        this.lives = 3; // Player starts with 3 lives
    }

    createLivesIcons() {
        // Remove old icons
        if (this.livesIcons && Array.isArray(this.livesIcons)) {
            this.livesIcons.forEach(icon => icon.destroy());
        }
        this.livesIcons = [];

        // If heart texture isn't loaded or invalid, keep text fallback
        if (!this.isHeartTextureValid()) {
            // Fallback: show Unicode hearts in text
            if (this.livesText) {
                this.livesText.setVisible(true);
                this.livesText.setText(this.getHeartsString());
            }
            return;
        }

        // Hide numeric text and draw heart icons
        if (this.livesText) {
            this.livesText.setVisible(false);
        }
        // Compute heart icon scale to fit inside the nude panel height
        const baseTextureSize = 32; // fallback if source size isn't available
        let texSize = baseTextureSize;
        try {
            const img = this.textures.get('heart').getSourceImage();
            texSize = Math.max(img.width, img.height) || baseTextureSize;
        } catch (e) {}
        // Target height: panel height minus margins
        const topMargin = 6;
        const bottomMargin = 8;
        const targetHeight = Math.max(1, (this.uiPanel?.height || 90) - topMargin - bottomMargin);
        const iconScale = targetHeight / texSize;
        const baseX = (this.uiPanel?.x || 10) + 6;
        const baseY = (this.uiPanel?.y || 10) + topMargin;
        const spacing = Math.ceil((texSize * iconScale) + 10); // spacing based on scaled width + padding
        for (let i = 0; i < this.lives; i += 1) {
            const icon = this.add.image(baseX + i * spacing, baseY, 'heart')
                .setOrigin(0, 0)
                .setScrollFactor(0)
                .setDepth(11)
                .setScale(iconScale);
            this.livesIcons.push(icon);
        }
    }

    // Ensure the 'heart' texture is present and valid; if not, inject a tiny base64 PNG fallback
    prepareHeartTexture() {
        if (this.isHeartTextureValid()) {
            return;
        }
        // Remove any broken texture and add a base64 fallback (32x32 red heart)
        if (this.textures.exists('heart')) {
            this.textures.remove('heart');
        }
        const base64Heart = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAIFJREFUWEftlEEKwCAMBPUH/qpv7q/8gUXRIuvFpAcpjBcJJNnNKInh8ImH9QMGIAABCPyWQOkbdAyg8faC9RAod0pN4Mq53RKbepqS+1ivAR2zGzL1NCVPgosJj3jt5zVQa/UpXL1cRTMJ+Yzbn28kfjVgFtQCDEAAAhCAAAQg8AAf5BYhkDsv/wAAAABJRU5ErkJggg=='
        this.textures.addBase64('heart', base64Heart);
    }

    // Validates that the 'heart' texture exists and has a usable base frame
    isHeartTextureValid() {
        if (!this.textures.exists('heart')) return false;
        const tex = this.textures.get('heart');
        if (!tex) return false;
        const base = tex.frames && tex.frames['__BASE'];
        return !!(base && base.source && base.source.image);
    }

    tryLoadHeartTextureAndRender() {
        // First attempt: use existing or base64 fallback
        this.prepareHeartTexture();
        if (this.isHeartTextureValid()) {
            this.createLivesIcons();
            return;
        }

        // Second attempt: async load from assets path, then render or fallback to text
        if (this.textures.exists('heart')) {
            this.textures.remove('heart');
        }
        this.load.image('heart', 'assets/images/heart.png');
        this.load.once('complete', () => {
            if (this.isHeartTextureValid()) {
                this.createLivesIcons();
            } else {
                // Final fallback: show text hearts
                if (this.livesText) {
                    this.livesText.setVisible(true);
                    this.livesText.setText(this.getHeartsString());
                }
            }
        });
        this.load.start();
    }

    getHeartsString() {
        const full = '❤';
        // Ensure at least 0
        const count = Math.max(0, this.lives | 0);
        return Array(count).fill(full).join(' ');
    }

    init(data) {
        // Set the level from menu selection
        if (data && data.level) {
            this.currentLevel = data.level;
        }
        
        // Handle lives - persist across levels unless starting fresh
        if (data && data.lives !== undefined) {
            this.lives = data.lives;
        } else if (data && data.resetTimer) {
            // If starting fresh from menu, reset lives to 3
            this.lives = 3;
        }
        
        // Reset timer and score immediately when scene initializes
        this.startTime = null;
        this.score = 0;
        this.levelCompleted = false;
        
        // Force timer reset by setting a flag
        this.timerNeedsReset = true;
        
        // Reset all timer-related state
        this.sceneStartTime = 0;
        this.elapsedMs = 0;
        this.lastUpdateMs = 0;
        this.timerDisplayHoldUntil = 0;
        
        // Check if timer should be reset (from menu button click)
        if (data && data.resetTimer) {
            this.timerNeedsReset = true;
            console.log('Timer reset requested from menu button click');
        }
        
        console.log('Scene init - Timer reset for level:', this.currentLevel, 'Lives:', this.lives);
        
        // Load high scores from localStorage
        try {
            const savedScores = localStorage.getItem('jumpingManHighScores');
            console.log('GameScene: Raw saved scores:', savedScores);
            if (savedScores) {
                const parsed = JSON.parse(savedScores);
                // Ensure it's an object, not an array
                if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    // Check if any level keys contain arrays
                    let hasCorruptedData = false;
                    for (const key in parsed) {
                        if (Array.isArray(parsed[key])) {
                            console.log('Found corrupted array data in key:', key, 'value:', parsed[key]);
                            hasCorruptedData = true;
                            break;
                        }
                    }
                    
                    if (hasCorruptedData) {
                        console.log('Corrupted level data found, resetting to empty object');
                        this.highScores = {};
                        localStorage.removeItem('jumpingManHighScores');
                    } else {
                        this.highScores = parsed;
                    }
                } else {
                    console.log('Corrupted high scores data found, resetting to empty object');
                    this.highScores = {};
                    localStorage.removeItem('jumpingManHighScores');
                }
                console.log('GameScene: Parsed high scores:', this.highScores);
            }
        } catch (error) {
            console.log('Could not load high scores:', error);
            this.highScores = {};
        }
    }

    preload() {
        // Load background layers for level 1
        this.load.image('sky', 'assets/images/background/sky.png');
        this.load.image('mountains', 'assets/images/background/mountains.png');
        this.load.image('trees', 'assets/images/background/trees.png');
        this.load.image('path', 'assets/images/background/path.png');
        this.load.image('stone_bottom', 'assets/images/background/stone_bottom.png');

        // Load background layers for level 2
        this.load.image('level2_castle_wall', 'assets/images/background/level2/castle_wall.png');
        this.load.image('level2_path', 'assets/images/background/level2/path.png');
        this.load.image('level2_bottom', 'assets/images/background/level2/bottom.png');

        // Load background layers for level 3
        this.load.image('level3_sky', 'assets/images/background/level3/level3_sky.png');
        this.load.image('level3_mountains', 'assets/images/background/level3/level3_mountains.png');
        this.load.image('level3_path', 'assets/images/background/level3/level3_path.png');
        this.load.image('level3_StoneBottom', 'assets/images/background/level3/level3_StoneBottom.png');
        
        // Load snowball for level 3
        this.load.image('snowball', 'assets/images/background/level3/snowball.png');
        
        // Load Snow Princess for level 3
        this.load.image('snow_princess', 'assets/images/background/level3/SnowPrincess.png');

        // Load character spritesheets (6 frames each, frame 231x500)
        this.load.spritesheet('char_walk', 'assets/images/CharSpriteSheets/walkingSpritesheet.png', {
            frameWidth: 231,
            frameHeight: 500
        });
        this.load.spritesheet('char_jump', 'assets/images/CharSpriteSheets/jumpingSpritesheet.png', {
            frameWidth: 231,
            frameHeight: 500
        });

        // Load other game assets
        this.load.image('rock1', 'assets/images/boulder-stones-clipart-design-illustration-free-png.png');
        this.load.image('rock2', 'assets/images/boulder-stones-clipart-design-illustration-free-png (1).png');
        this.load.image('rock3', 'assets/images/boulder-stones-clipart-design-illustration-free-png (2).png');
        this.load.image('rock4', 'assets/images/boulder-stones-clipart-design-illustration-free-png (3).png');
        this.load.image('rock5', 'assets/images/boulder-stones-clipart-design-illustration-free-png (4).png');
        this.load.image('rock6', 'assets/images/boulder-stones-clipart-design-illustration-free-png (5).png');
        
        // Load ice rocks for level 3
        this.load.image('icerock1', 'assets/images/background/level3/icerock01.png');
        this.load.image('icerock2', 'assets/images/background/level3/icerock02.png');
        this.load.image('icerock3', 'assets/images/background/level3/icerock03.png');
        this.load.image('icerock4', 'assets/images/background/level3/icerock04.png');
        this.load.image('icerock5', 'assets/images/background/level3/icerock05.png');
        this.load.image('explosion_particle', 'assets/images/explosion_particle.png');
        
        // Load rotating barrel frames
        this.load.image('barrel001', 'assets/images/RotatingBarrel/barrel001.png');
        this.load.image('barrel002', 'assets/images/RotatingBarrel/barrel002.png');
        this.load.image('barrel003', 'assets/images/RotatingBarrel/barrel003.png');
        this.load.image('barrel004', 'assets/images/RotatingBarrel/barrel004.png');
        
        // Do not preload heart here to avoid console errors if the file is missing/corrupt.
        // The HUD will handle loading a base64 fallback or the file at runtime.

        // Load castle images
        this.load.image('dvorac', 'assets/images/dvorac.png');
        this.load.image('wizard', 'assets/images/wizard.png');
        

    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const platformRaise = 130; // 100 + 30
        const bgYOffset = 0;

        // Reset timer unconditionally when a level (scene) starts
        this.sceneStartTime = this.time.now;
        this.startTime = this.sceneStartTime;
        // Use an accumulated timer so time spent in other scenes does not count
        this.elapsedMs = 0;
        this.lastUpdateMs = this.time.now;
        // Hold the on-screen timer at 0 briefly so it visibly resets
        this.timerDisplayHoldUntil = this.time.now + 300; // ms
        this.timerNeedsReset = false;
        console.log('Create method - Timer hard reset - startTime:', this.startTime, 'for level:', this.currentLevel);
        
        // Reset score and level completion status
        this.score = 0;
        this.levelCompleted = false;

        // Helper to create a tileSprite and always show the bottom of the image
        function addBottomAnchoredTileSprite(scene, key) {
            const tex = scene.textures.get(key).getSourceImage();
            const imgH = tex.height;
            const layer = scene.add.tileSprite(0, height - bgYOffset, width, height, key)
                .setOrigin(0, 1)
                .setScrollFactor(0);
            // Set initial tilePositionY so the bottom of the image is at the bottom of the window
            layer.tilePositionY = imgH - height;
            return layer;
        }

        // Create background based on current level
        if (this.currentLevel === 1) {
            this.sky = addBottomAnchoredTileSprite(this, 'sky');
            this.mountains = addBottomAnchoredTileSprite(this, 'mountains');
            this.trees = addBottomAnchoredTileSprite(this, 'trees');
            this.path = addBottomAnchoredTileSprite(this, 'path');
            this.stoneBottom = addBottomAnchoredTileSprite(this, 'stone_bottom');
        } else if (this.currentLevel === 2) {
            this.castleWall = addBottomAnchoredTileSprite(this, 'level2_castle_wall');
            this.level2Path = addBottomAnchoredTileSprite(this, 'level2_path');
            this.level2Bottom = addBottomAnchoredTileSprite(this, 'level2_bottom');
        } else if (this.currentLevel === 3) {
            this.level3Sky = addBottomAnchoredTileSprite(this, 'level3_sky');
            this.level3Mountains = addBottomAnchoredTileSprite(this, 'level3_mountains');
            this.level3Path = addBottomAnchoredTileSprite(this, 'level3_path');
            this.level3StoneBottom = addBottomAnchoredTileSprite(this, 'level3_StoneBottom');
        }

        // Handle Phaser scale resize (avoid manual window sizing)
        const resize = (gameSize) => {
            const newWidth = gameSize.width;
            const newHeight = gameSize.height;
            
            if (this.currentLevel === 1) {
                [this.sky, this.mountains, this.trees, this.path, this.stoneBottom].forEach(layer => {
                    const tex = layer.texture.getSourceImage();
                    const imgH = tex.height;
                    layer.setSize(newWidth, newHeight);
                    layer.setPosition(0, newHeight - bgYOffset);
                    layer.tilePositionY = imgH - newHeight;
                });
            } else if (this.currentLevel === 2) {
                [this.castleWall, this.level2Path, this.level2Bottom].forEach(layer => {
                    const tex = layer.texture.getSourceImage();
                    const imgH = tex.height;
                    layer.setSize(newWidth, newHeight);
                    layer.setPosition(0, newHeight - bgYOffset);
                    layer.tilePositionY = imgH - newHeight;
                });
            } else if (this.currentLevel === 3) {
                [this.level3Sky, this.level3Mountains, this.level3Path, this.level3StoneBottom].forEach(layer => {
                    const tex = layer.texture.getSourceImage();
                    const imgH = tex.height;
                    layer.setSize(newWidth, newHeight);
                    layer.setPosition(0, newHeight - bgYOffset);
                    layer.tilePositionY = imgH - newHeight;
                });
            }
            // Reposition and redraw UI
            if (this.uiBackground && this.uiPanel) {
                this.uiBackground.clear();
                this.uiBackground.fillStyle(0xDEB887, 0.8);
                this.uiBackground.fillRoundedRect(this.uiPanel.x, this.uiPanel.y, this.uiPanel.width, this.uiPanel.height, 15);
            }
            if (this.timerText && this.uiPanel) {
                this.timerText.setPosition(this.uiPanel.x + 6, this.uiPanel.y + 6);
            }
            if (this.livesText && this.uiPanel) {
                this.livesText.setPosition(this.uiPanel.x + 6, this.uiPanel.y + 48);
            }
            // Recreate heart icons to maintain fit in panel
            if (this.livesIcons) {
                this.createLivesIcons();
            }
        };
        this.scale.on('resize', resize);
        // Clean up the resize listener to avoid accessing destroyed textures after scene switch
        this.events.once('shutdown', () => this.scale.off('resize', resize));
        this.events.once('destroy', () => this.scale.off('resize', resize));

        // Create barrel rolling animation (before obstacles)
        this.anims.create({
            key: 'barrelRoll',
            frames: [
                { key: 'barrel004' },
                { key: 'barrel003' },
                { key: 'barrel002' },
                { key: 'barrel001' }
            ],
            frameRate: 4,
            repeat: -1
        });
        
        // Create obstacles first (before castle)
        this.obstacles = this.physics.add.group();

        let lastRockX = 0;

        // Determine number of obstacles based on level
        const obstacleCount = this.currentLevel === 3 ? 14 : 10; // 14 for Level 3 (9 ice rocks + 5 snowballs), 10 for others
        
        for (let i = 0; i < obstacleCount; i++) {
            let x, y;
            
            if (this.currentLevel === 1) {
                // Level 1: Static rocks with equal spacing
                x = 400 + i * 450;
                y = height - 100 - platformRaise;
            } else if (this.currentLevel === 2) {
                // Level 2: Barrels spawn off-screen to the right
                x = 800 + i * 300; // Start further right and closer spacing
                y = height - 100 - platformRaise;
                          } else if (this.currentLevel === 3) {
                  // Level 3: Mix of static ice rocks and flying snowballs
                  if (i < 9) {
                      // First 9 obstacles are static ice rocks
                      x = 400 + i * 450;
                      y = height - 100 - platformRaise;
                  } else {
                      // Last 5 obstacles are flying snowballs
                      x = 800 + (i - 9) * 700; // Increased spacing from 500 to 700
                      y = height - 500 - platformRaise; // Much higher in the air (increased from 300 to 500)
                  }
            }
            
            let obstacle;
            if (this.currentLevel === 1) {
                // Level 1: Use rocks
                const rockTypes = ['rock1', 'rock2', 'rock3', 'rock4', 'rock5', 'rock6'];
                const rockType = Phaser.Math.RND.pick(rockTypes);
                obstacle = this.obstacles.create(x, y, rockType);
                obstacle.setScale(Phaser.Math.FloatBetween(0.4, 0.6));
            } else if (this.currentLevel === 2) {
                // Level 2: Use barrels
                obstacle = this.obstacles.create(x, y, 'barrel001');
                obstacle.setScale(0.2);
                // Add consistent movement speed for barrels
                const speed = -100; // Negative for leftward movement
                obstacle.setVelocityX(speed);
                // Start the rolling animation
                obstacle.play('barrelRoll');
                          } else if (this.currentLevel === 3) {
                  // Level 3: Mix of ice rocks and snowballs
                  if (i < 9) {
                      // First 9 obstacles are ice rocks
                      const iceRockTypes = ['icerock1', 'icerock2', 'icerock3', 'icerock4', 'icerock5'];
                      const iceRockType = Phaser.Math.RND.pick(iceRockTypes);
                      obstacle = this.obstacles.create(x, y, iceRockType);
                      obstacle.setScale(Phaser.Math.FloatBetween(0.08, 0.12)); // Even smaller ice rocks
                  } else {
                      // Last 5 obstacles are flying snowballs
                      obstacle = this.obstacles.create(x, y, 'snowball');
                      obstacle.setScale(0.3); // Snowball scale
                      // Add movement speed for snowballs (flying towards player)
                      const speed = -120; // Negative for leftward movement
                      obstacle.setVelocityX(speed);
                      obstacle.setVelocityY(0); // Keep them at constant height
                  }
            }
            
            obstacle.setData('cleared', false);
            obstacle.setOrigin(0.5, 1);
            obstacle.setDepth(5); // Ensure obstacles appear in front of background but behind castle
            obstacle.body.updateFromGameObject();
            obstacle.body.setImmovable(true);
            obstacle.body.setAllowGravity(false);
            lastRockX = x;
        }

        // Create final obstacle (castle/wizard) based on level
        const castleX = lastRockX + 600;  // Position castle 600px from the last obstacle
        const castleY = height - 100 - platformRaise;  // Same level as obstacles
        
        const castleImage = this.currentLevel === 1 ? 'dvorac' : (this.currentLevel === 2 ? 'wizard' : 'snow_princess');
        console.log('Creating', castleImage, 'obstacle at:', castleX, castleY, 'lastRockX:', lastRockX);
        
        // Create castle/wizard as an obstacle
        if (this.textures.exists(castleImage)) {
            this.castle = this.obstacles.create(castleX, castleY, castleImage);
            this.castle.setOrigin(0.5, 1); // Anchor to bottom center
            // Scale based on level: castle stays 0.96, wizard is smaller, Level 3 Snow Princess is 0.6
            const scale = this.currentLevel === 1 ? 0.96 : (this.currentLevel === 2 ? 0.25 : 0.6);
            this.castle.setScale(scale);
            this.castle.setDepth(5); // Same depth as other obstacles
            this.castle.setData('cleared', false);
            this.castle.body.updateFromGameObject();
            this.castle.body.setImmovable(true);
            this.castle.body.setAllowGravity(false);
            console.log(castleImage, 'obstacle created successfully, scale:', this.castle.scale, 'size:', this.castle.width, 'x', this.castle.height);
        } else {
            // Fallback: create a simple colored rectangle as castle
            console.log(castleImage, 'texture not found, creating fallback castle obstacle');
            this.castle = this.obstacles.create(castleX, castleY, 'char_walk'); // Use player sheet as fallback
            this.castle.setOrigin(0.5, 1);
            this.castle.setScale(0.5);
            this.castle.setDepth(5);
            this.castle.setTint(0x8B4513); // Brown color for castle
            this.castle.setData('cleared', false);
            this.castle.body.updateFromGameObject();
            this.castle.body.setImmovable(true);
            this.castle.body.setAllowGravity(false);
        }
        
        console.log(castleImage, 'obstacle created at:', this.castle.x, this.castle.y, 'Scale:', this.castle.scale, 'Visible:', this.castle.visible);
        
        // Create a long ground plane that extends past the castle
        const groundWidth = lastRockX + 800;
        const ground = this.add.rectangle(0, height - 100 - platformRaise, groundWidth, 100, 0x964B00).setOrigin(0, 0);
        this.physics.add.existing(ground, true);
        ground.setVisible(false);

        this.player = this.physics.add.sprite(100, height - 300 - platformRaise, 'char_walk', 0);
        this.player.setScale(0.32); // Character scale (60% bigger)
        this.player.setDepth(5); // Ensure player appears in front of background but behind castle
        this.player.body.setSize(this.player.width, this.player.height);
        this.player.setVisible(true); // Explicitly ensure player is visible
        this.player.isJumping = false; // Track jump state
        this.player.hasReachedJumpPeak = false; // Track if jump animation should end
        console.log('Player created at:', this.player.x, this.player.y, 'Scale:', this.player.scale, 'Visible:', this.player.visible);
        
        // Create walking animation from spritesheet
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('char_walk', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        // Create idle animation (first frame of walking sheet)
        this.anims.create({
            key: 'idle',
            frames: [{ key: 'char_walk', frame: 0 }],
            frameRate: 1
        });

        // Create jump animation from spritesheet
        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('char_jump', { start: 0, end: 5 }),
            frameRate: 12,
            repeat: 0
        });
        

         
        // Set stronger gravity
        this.physics.world.gravity.y = 1400;
        
        // World and camera bounds should extend past the castle
        this.physics.world.setBounds(0, 0, groundWidth, height);
        this.cameras.main.setBounds(0, 0, groundWidth, height);
        this.player.setCollideWorldBounds(true);
        
        // Now check if castle is within camera bounds (after camera is set up)
        const cameraBounds = this.cameras.main.getBounds();
        console.log('Camera bounds after setup:', cameraBounds);
        console.log('Castle within camera bounds:', cameraBounds.contains(this.castle.x, this.castle.y));
        console.log('Castle position:', this.castle.x, this.castle.y);

        this.physics.add.collider(this.player, ground);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        this.physics.add.collider(this.player, this.obstacles, (player, obstacle) => {
            // Regular obstacle collision (rocks/barrels)
            const onTop = player.body.touching.down && obstacle.body.touching.up;

            if (onTop) {
                // Decrease lives
                this.lives--;
                if (this.livesText) {
                    this.livesText.setText(this.getHeartsString());
                }
                this.prepareHeartTexture();
                this.createLivesIcons();
                
                // Hide player and disable physics temporarily
                player.setVisible(false);
                player.body.enable = false;

                // Create explosion effect (if particle exists)
                try {
                    const emitter = this.add.particles(player.x, player.y, 'explosion_particle', {
                        speed: { min: 100, max: 300 },
                        scale: { min: 0.05, max: 0.15 },
                        alpha: { start: 1, end: 0 },
                        blendMode: 'SCREEN',
                        lifespan: 600,
                        emitting: false
                    });

                    emitter.explode(32);
                } catch (error) {
                    console.log('Explosion particle not available, skipping effect');
                }

                // Check if game over
                if (this.lives <= 0) {
                    // Game over - show game over screen
                    this.time.delayedCall(1000, () => this.showGameOverScreen());
                } else {
                    // Respawn player at the beginning of the level
                    this.time.delayedCall(1000, () => this.respawnPlayer());
                }
            }
        });

        // Set text color based on level
        const textColor = this.currentLevel === 3 ? '#000' : '#fff'; // Black for Level 3, white for others
        // Do not touch the heart texture here; the HUD loader will manage readiness to avoid console warnings.
        
        // Create rounded background for timer and lives
        const uiBackground = this.add.graphics();
        this.uiPanel = { x: 10, y: 10, width: 250, height: 90 };
        uiBackground.fillStyle(0xDEB887, 0.8); // Light brown with transparency
        uiBackground.fillRoundedRect(this.uiPanel.x, this.uiPanel.y, this.uiPanel.width, this.uiPanel.height, 15);
        uiBackground.setScrollFactor(0);
        uiBackground.setDepth(10); // Ensure it's above background but below text
        this.uiBackground = uiBackground;
        
        // Add timer display - ensure it starts at 0:00.000
        this.timerText = this.add.text(this.uiPanel.x + 6, this.uiPanel.y + 6, 'Time: 0:00.000', { fontSize: '24px', fill: textColor });
        this.timerText.setScrollFactor(0);
        this.timerText.setDepth(11); // Ensure text is above background
        
        // Add lives display (fallback hearts text). If a heart texture exists, icons will replace this.
        this.livesText = this.add.text(this.uiPanel.x + 6, this.uiPanel.y + 48, this.getHeartsString(), { fontSize: '24px', fill: textColor });
        this.livesText.setScrollFactor(0);
        this.livesText.setDepth(11); // Ensure text is above background
        // Try to load and render heart icons; fallback to text if needed
        this.tryLoadHeartTextureAndRender();
        
        // Ensure display shows 0 on first render
        if (this.timerText) {
            this.timerText.setText('Time: 0:00.000');
        }
    }

    levelComplete() {
        // Stop player movement and disable input
        this.player.setVelocity(0);
        this.player.body.enable = false;
        
        // Disable cursor keys
        this.cursors.left.enabled = false;
        this.cursors.right.enabled = false;
        this.cursors.up.enabled = false;
        this.cursors.down.enabled = false;
        
        // Flag to indicate level is complete
        this.levelCompleted = true;
        
        // Calculate final time using accumulated scene time
        const finalTime = (this.elapsedMs || 0) / 1000;
        const minutes = Math.floor(finalTime / 60);
        const seconds = Math.floor(finalTime % 60);
        const milliseconds = Math.floor((finalTime % 1) * 1000);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
        
        // Check for high score
        const levelKey = `level${this.currentLevel}`;
        const currentHighScore = this.highScores[levelKey] || null;
        let isNewHighScore = false;
        
        console.log('Current high score for', levelKey, ':', currentHighScore);
        console.log('Final time:', finalTime);
        console.log('this.highScores object:', this.highScores);
        console.log('Type of this.highScores:', typeof this.highScores);
        console.log('Is this.highScores an array?', Array.isArray(this.highScores));
        
        // Check if current high score is an object (new format) or number (old format)
        let currentHighScoreTime = null;
        let currentHighScoreSignature = '';
        
        if (currentHighScore) {
            if (typeof currentHighScore === 'object' && currentHighScore.time) {
                // New format with signature
                currentHighScoreTime = currentHighScore.time;
                currentHighScoreSignature = currentHighScore.signature || '';
            } else if (typeof currentHighScore === 'number') {
                // Old format - just time
                currentHighScoreTime = currentHighScore;
            }
        }
        
        if (!currentHighScoreTime || finalTime < currentHighScoreTime) {
            isNewHighScore = true;
            console.log('About to save high score. levelKey:', levelKey, 'finalTime:', finalTime, 'type:', typeof finalTime);
            
            // Show signature input for new high score
            this.showSignatureInput(finalTime, levelKey);
            return; // Exit early, signature input will handle the rest
        }
        
        // Not a new high score, show normal level complete screen
        this.showLevelCompleteScreen(finalTime, false);
    }

    showLevelCompleteScreen(finalTime, isNewHighScore = false) {
        // Add background panel
        const panel = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            700,  // width of panel (increased)
            500,  // height of panel (increased for better text spacing)
            0xDEB887  // wooden table color
        );
        panel.setScrollFactor(0);
        panel.setDepth(20); // Ensure panel appears in front of everything
        
        // Calculate time string
        const minutes = Math.floor(finalTime / 60);
        const seconds = Math.floor(finalTime % 60);
        const milliseconds = Math.floor((finalTime % 1) * 1000);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
        
        // Check for high score display
        const levelKey = `level${this.currentLevel}`;
        const currentHighScore = this.highScores[levelKey] || null;
        let highScoreText = '';
        
        if (isNewHighScore) {
            highScoreText = `🏆 NEW HIGH SCORE! 🏆`;
        } else if (currentHighScore) {
            let currentHighScoreTime = null;
            let currentHighScoreSignature = '';
            
            if (typeof currentHighScore === 'object' && currentHighScore.time) {
                currentHighScoreTime = currentHighScore.time;
                currentHighScoreSignature = currentHighScore.signature || '';
            } else if (typeof currentHighScore === 'number') {
                currentHighScoreTime = currentHighScore;
            }
            
            if (currentHighScoreTime) {
                const highMinutes = Math.floor(currentHighScoreTime / 60);
                const highSeconds = Math.floor(currentHighScoreTime % 60);
                const highMilliseconds = Math.floor((currentHighScoreTime % 1) * 1000);
                const highTimeString = `${highMinutes}:${highSeconds.toString().padStart(2, '0')}.${highMilliseconds.toString().padStart(3, '0')}`;
                const signatureText = currentHighScoreSignature ? ` by ${currentHighScoreSignature}` : '';
                highScoreText = `🏆 Best Time: ${highTimeString}${signatureText} 🏆`;
            }
        }
        
        // Main victory text (score removed)
        const victoryText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 120, `Level Complete!\nTime: ${timeString}`, {
            fontSize: '36px',
            fill: '#000',
            align: 'center',
            lineSpacing: 8
        });
        victoryText.setScrollFactor(0);
        victoryText.setOrigin(0.5);
        victoryText.setDepth(21);

        // High score text
        if (highScoreText) {
            const highScoreDisplay = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 40, highScoreText, {
                fontSize: '32px',
                fill: isNewHighScore ? '#FFD700' : '#FFD700',
                align: 'center',
                stroke: '#000',
                strokeThickness: 2
            });
            highScoreDisplay.setScrollFactor(0);
            highScoreDisplay.setOrigin(0.5);
            highScoreDisplay.setDepth(21);
        }

        // Create Restart Level button with rounded corners
        const restartButton = this.add.graphics();
        restartButton.fillStyle(0x8B4513, 1); // brown color
        restartButton.fillRoundedRect(this.cameras.main.width / 2 - 150 - 100, this.cameras.main.height / 2 + 120 - 30, 200, 60, 15); // 15px corner radius
        restartButton.setScrollFactor(0);
        restartButton.setDepth(21); // Ensure button appears in front of panel
        restartButton.setInteractive(new Phaser.Geom.Rectangle(this.cameras.main.width / 2 - 150 - 100, this.cameras.main.height / 2 + 120 - 30, 200, 60), Phaser.Geom.Rectangle.Contains);
        
        const restartText = this.add.text(
            this.cameras.main.width / 2 - 150,
            this.cameras.main.height / 2 + 120,
            'Restart Level',
            { fontSize: '24px', fill: '#fff' }
        );
        restartText.setScrollFactor(0);
        restartText.setOrigin(0.5);
        restartText.setDepth(22); // Ensure text appears in front of button

        // Create Next Level button with rounded corners
        const nextButton = this.add.graphics();
        nextButton.fillStyle(0x228B22, 1); // green color
        nextButton.fillRoundedRect(this.cameras.main.width / 2 + 150 - 100, this.cameras.main.height / 2 + 120 - 30, 200, 60, 15); // 15px corner radius
        nextButton.setScrollFactor(0);
        nextButton.setDepth(21); // Ensure button appears in front of panel
        nextButton.setInteractive(new Phaser.Geom.Rectangle(this.cameras.main.width / 2 + 150 - 100, this.cameras.main.height / 2 + 120 - 30, 200, 60), Phaser.Geom.Rectangle.Contains);
        
        const nextText = this.add.text(
            this.cameras.main.width / 2 + 150,
            this.cameras.main.height / 2 + 120,
            'Next Level',
            { fontSize: '24px', fill: '#fff' }
        );
        nextText.setScrollFactor(0);
        nextText.setOrigin(0.5);
        nextText.setDepth(22); // Ensure text appears in front of button

        // Add button interactions
        restartButton.on('pointerdown', () => {
            this.levelCompleted = false;
            this.scene.restart({ resetTimer: true, lives: this.lives });
        });

        nextButton.on('pointerdown', () => {
            this.levelCompleted = false;
            const nextLevel = this.currentLevel === 1 ? 2 : (this.currentLevel === 2 ? 3 : 1);
            this.scene.start('GameScene', { level: nextLevel, resetTimer: true, lives: this.lives });
        });

        // Add Main Menu button with rounded corners
        const menuButton = this.add.graphics();
        menuButton.fillStyle(0x4169E1, 1); // blue color
        menuButton.fillRoundedRect(this.cameras.main.width / 2 - 100, this.cameras.main.height / 2 + 190 - 30, 200, 60, 15); // 15px corner radius
        menuButton.setScrollFactor(0);
        menuButton.setDepth(21); // Ensure button appears in front of panel
        menuButton.setInteractive(new Phaser.Geom.Rectangle(this.cameras.main.width / 2 - 100, this.cameras.main.height / 2 + 190 - 30, 200, 60), Phaser.Geom.Rectangle.Contains);
        
        const menuText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 190,
            'Main Menu',
            { fontSize: '24px', fill: '#fff' }
        );
        menuText.setScrollFactor(0);
        menuText.setOrigin(0.5);
        menuText.setDepth(22); // Ensure text appears in front of button

        menuButton.on('pointerdown', () => {
            this.levelCompleted = false;
            this.scene.start('MenuScene');
        });

        menuButton.on('pointerover', () => {
            menuButton.clear();
            menuButton.fillStyle(0x6495ED, 1);
            menuButton.fillRoundedRect(this.cameras.main.width / 2 - 100, this.cameras.main.height / 2 + 190 - 30, 200, 60, 15);
        });
        menuButton.on('pointerout', () => {
            menuButton.clear();
            menuButton.fillStyle(0x4169E1, 1);
            menuButton.fillRoundedRect(this.cameras.main.width / 2 - 100, this.cameras.main.height / 2 + 190 - 30, 200, 60, 15);
        });

        // Add hover effects
        restartButton.on('pointerover', () => {
            restartButton.setFillStyle(0xA0522D);
        });
        restartButton.on('pointerout', () => {
            restartButton.setFillStyle(0x8B4513);
        });

        nextButton.on('pointerover', () => {
            nextButton.setFillStyle(0x32CD32);
        });
        nextButton.on('pointerout', () => {
            nextButton.setFillStyle(0x228B22);
        });
    }

    showSignatureInput(finalTime, levelKey) {
        // Stop player movement and disable input
        this.player.setVelocity(0);
        this.player.body.enable = false;
        
        // Disable cursor keys
        this.cursors.left.enabled = false;
        this.cursors.right.enabled = false;
        this.cursors.up.enabled = false;
        this.cursors.down.enabled = false;
        
        // Flag to indicate level is complete
        this.levelCompleted = true;
        
        // Create signature input panel
        const panel = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            600,
            400,
            0xDEB887
        );
        panel.setScrollFactor(0);
        panel.setDepth(20);
        
        // Title
        const title = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 150,
            '🏆 NEW HIGH SCORE! 🏆',
            {
                fontSize: '32px',
                fill: '#FFD700',
                stroke: '#000',
                strokeThickness: 2
            }
        );
        title.setOrigin(0.5);
        title.setScrollFactor(0);
        title.setDepth(21);
        
        // Time display
        const minutes = Math.floor(finalTime / 60);
        const seconds = Math.floor(finalTime % 60);
        const milliseconds = Math.floor((finalTime % 1) * 1000);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
        
        const timeText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 100,
            `Time: ${timeString}`,
            {
                fontSize: '24px',
                fill: '#000'
            }
        );
        timeText.setOrigin(0.5);
        timeText.setScrollFactor(0);
        timeText.setDepth(21);
        
        // Signature prompt
        const promptText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'Enter your name (max 10 characters):',
            {
                fontSize: '20px',
                fill: '#000'
            }
        );
        promptText.setOrigin(0.5);
        promptText.setScrollFactor(0);
        promptText.setDepth(21);
        
        // Create input field background
        const inputBg = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            300,
            40,
            0xFFFFFF
        );
        inputBg.setScrollFactor(0);
        inputBg.setDepth(21);
        inputBg.setStrokeStyle(2, 0x000000);
        
        // Create input text
        const inputText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            '',
            {
                fontSize: '18px',
                fill: '#000'
            }
        );
        inputText.setOrigin(0.5);
        inputText.setScrollFactor(0);
        inputText.setDepth(22);
        
        // Create submit button
        const submitButton = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 80,
            150,
            50,
            0x228B22
        );
        submitButton.setScrollFactor(0);
        submitButton.setDepth(21);
        submitButton.setInteractive();
        
        const submitText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 80,
            'Submit',
            {
                fontSize: '20px',
                fill: '#fff'
            }
        );
        submitText.setOrigin(0.5);
        submitText.setScrollFactor(0);
        submitText.setDepth(22);
        
        // Handle keyboard input
        let signature = '';
        const maxLength = 10;
        
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') {
                if (signature.trim()) {
                    this.saveHighScoreWithSignature(finalTime, levelKey, signature.trim());
                    document.removeEventListener('keydown', handleKeyDown);
                }
            } else if (event.key === 'Backspace') {
                signature = signature.slice(0, -1);
                inputText.setText(signature);
            } else if (event.key.length === 1 && signature.length < maxLength) {
                // Only allow letters, numbers, and spaces
                if (/^[a-zA-Z0-9\s]$/.test(event.key)) {
                    signature += event.key;
                    inputText.setText(signature);
                }
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Handle submit button click
        submitButton.on('pointerdown', () => {
            if (signature.trim()) {
                this.saveHighScoreWithSignature(finalTime, levelKey, signature.trim());
                document.removeEventListener('keydown', handleKeyDown);
            }
        });
        
        // Add hover effect for submit button
        submitButton.on('pointerover', () => {
            submitButton.setFillStyle(0x32CD32);
        });
        submitButton.on('pointerout', () => {
            submitButton.setFillStyle(0x228B22);
        });
    }
    
    saveHighScoreWithSignature(finalTime, levelKey, signature) {
        // Save high score with signature
        this.highScores[levelKey] = {
            time: finalTime,
            signature: signature,
            date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        };
        
        console.log('New high score saved with signature:', this.highScores[levelKey]);
        
        // Save to localStorage
        try {
            localStorage.setItem('jumpingManHighScores', JSON.stringify(this.highScores));
            console.log('High scores with signatures saved to localStorage:', this.highScores);
        } catch (error) {
            console.log('Could not save high score:', error);
        }
        
        // Clear any existing signature input elements
        this.children.removeAll();
        
        // Show the level complete screen with the new high score
        this.showLevelCompleteScreen(finalTime, true);
    }

    update(time, delta) {
        // If level is completed, don't process game updates
        if (this.levelCompleted) {
            return;
        }
        
        // Update timer display using accumulated time independent of global clock
        if (!this.startTime || this.timerNeedsReset) {
            this.sceneStartTime = this.time.now;
            this.startTime = this.sceneStartTime;
            this.elapsedMs = 0;
            this.lastUpdateMs = this.time.now;
            this.timerNeedsReset = false;
            console.log('Update method - Timer reset; startTime:', this.startTime);
        }

        // Accumulate delta from Phaser's update callback (only runs while this scene is active)
        const deltaMs = typeof delta === 'number' ? delta : 0;
        this.elapsedMs = (this.elapsedMs || 0) + Math.max(0, deltaMs);

        // Calculate elapsed time (clamped to 0 during initial hold so UI always shows 0 at start)
        let elapsedTime = (this.elapsedMs || 0) / 1000;
        if (this.timerDisplayHoldUntil && this.time.now < this.timerDisplayHoldUntil) {
            elapsedTime = 0;
        }
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = Math.floor(elapsedTime % 60);
        const milliseconds = Math.floor((elapsedTime % 1) * 1000);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
        this.timerText.setText(`Time: ${timeString}`);
        
        // Debug: Log timer reset on first frame
        if (elapsedTime < 0.1) {
            console.log('Timer started - elapsedTime:', elapsedTime, 'timeString:', timeString);
        }
        
        // Parallax effect: move the background layers at different speeds
        const scrollX = this.cameras.main.scrollX;
        
        if (this.currentLevel === 1) {
            this.sky.tilePositionX = scrollX * 0.4;
            this.mountains.tilePositionX = scrollX * 0.5;
            this.trees.tilePositionX = scrollX * 0.6;
            this.path.tilePositionX = scrollX * 0.7;
            this.stoneBottom.tilePositionX = scrollX * 0.3;
        } else if (this.currentLevel === 2) {
            this.castleWall.tilePositionX = scrollX * 0.3;
            this.level2Path.tilePositionX = scrollX * 0.7;
            this.level2Bottom.tilePositionX = scrollX * 0.3;
        } else if (this.currentLevel === 3) {
            this.level3Sky.tilePositionX = scrollX * 0.4;
            this.level3Mountains.tilePositionX = scrollX * 0.5;
            this.level3Path.tilePositionX = scrollX * 0.7;
            this.level3StoneBottom.tilePositionX = scrollX * 0.3;
        }

        // Check if player landed (was jumping but now on ground)
        if (this.player.isJumping && this.player.body.blocked.down) {
            this.player.isJumping = false;
            this.player.hasReachedJumpPeak = false;
            // Return to idle animation when landing
            this.player.play('idle', true);
        }
        
        // Check if player has reached jump peak (velocityY becomes positive = falling)
        if (this.player.isJumping && !this.player.hasReachedJumpPeak && this.player.body.velocity.y > 0) {
            this.player.hasReachedJumpPeak = true;
            // Switch back to walking/idle animation when falling
            if (this.cursors.left.isDown || this.cursors.right.isDown) {
                this.player.play('walk', true);
            } else {
                this.player.play('idle', true);
            }
        }

        if (this.cursors.left.isDown) {
            // Reduce speed when in air (40% slower)
            const speed = this.player.body.blocked.down ? -800 : -480;
            this.player.setVelocityX(speed);
            this.player.flipX = true;
            // Play walking animation when moving (only if not jumping or if past jump peak)
            if ((this.player.body.blocked.down && !this.player.isJumping) || 
                (this.player.isJumping && this.player.hasReachedJumpPeak)) {
                this.player.play('walk', true);
            }
        } else if (this.cursors.right.isDown) {
            // Reduce speed when in air (40% slower)
            const speed = this.player.body.blocked.down ? 900 : 540;
            this.player.setVelocityX(speed);
            this.player.flipX = false;
            // Play walking animation when moving (only if not jumping or if past jump peak)
            if ((this.player.body.blocked.down && !this.player.isJumping) || 
                (this.player.isJumping && this.player.hasReachedJumpPeak)) {
                this.player.play('walk', true);
            }
        } else {
            this.player.setVelocityX(0);
            // Play idle animation when not moving and on ground (only if not jumping or if past jump peak)
            if ((this.player.body.blocked.down && !this.player.isJumping) || 
                (this.player.isJumping && this.player.hasReachedJumpPeak)) {
                this.player.play('idle', true);
            }
        }

        if (this.cursors.up.isDown && this.player.body.blocked.down && !this.player.isJumping) {
            this.player.setVelocityY(-800); // Much higher jump velocity to compensate for stronger gravity
            this.player.isJumping = true;
            this.player.hasReachedJumpPeak = false;
            // Play jump animation
            this.player.play('jump', true);
        }

        this.obstacles.getChildren().forEach(obstacle => {
            // Scoring removed
            
            // Check if player has reached the end of the level
            if (this.currentLevel === 3) {
                // Level 3: End closer to the Snow Princess
                if (this.player.x >= this.castle.x - 200) { // Much closer to the Snow Princess
                    this.levelComplete();
                    return;
                }
            } else {
                // Level 1 & 2: Standard distance
                if (this.player.x >= this.castle.x - 300) { // Standard distance for castle/wizard
                    this.levelComplete();
                    return;
                }
            }
            
            // Handle moving barrels in Level 2
            if (this.currentLevel === 2 && obstacle.active) {
                // Reset barrel position when it goes completely off-screen to the left
                if (obstacle.x < this.cameras.main.scrollX - 100) {
                    // Find the rightmost barrel to maintain 300px spacing
                    let rightmostBarrel = 0;
                    this.obstacles.getChildren().forEach(barrel => {
                        if (barrel.active && barrel.x > rightmostBarrel) {
                            rightmostBarrel = barrel.x;
                        }
                    });
                    
                    // Spawn at 300px to the right of the rightmost barrel, or 1200px ahead of player if no barrels
                    const spawnX = Math.max(rightmostBarrel + 300, this.player.x + 1200);
                    obstacle.setPosition(spawnX, obstacle.y);
                    obstacle.setData('cleared', false); // Reset scoring flag
                    // Keep the same consistent speed
                    obstacle.setVelocityX(-100);
                    // Restart the rolling animation
                    obstacle.play('barrelRoll');
                }
            }
            
            // Handle flying snowballs in Level 3
            if (this.currentLevel === 3 && obstacle.active && obstacle.texture.key === 'snowball') {
                // Add wobbling effect to snowballs
                const time = this.time.now * 0.004; // Slightly faster wobble
                const wobbleOffset = Math.sin(time + obstacle.x * 0.01) * 108; // 108px wobble amplitude (increased by 100px)
                obstacle.setVelocityY(wobbleOffset * 3); // Apply wobble as vertical velocity (increased multiplier)
                
                // Reset snowball position when it goes completely off-screen to the left
                if (obstacle.x < this.cameras.main.scrollX - 100) {
                    // Find the rightmost snowball to maintain 300px spacing
                    let rightmostSnowball = 0;
                    this.obstacles.getChildren().forEach(snowball => {
                        if (snowball.active && snowball.texture.key === 'snowball' && snowball.x > rightmostSnowball) {
                            rightmostSnowball = snowball.x;
                        }
                    });
                    
                    // Spawn at 700px to the right of the rightmost snowball, or 1200px ahead of player if no snowballs
                    const spawnX = Math.max(rightmostSnowball + 700, this.player.x + 1200);
                    obstacle.setPosition(spawnX, obstacle.y);
                    obstacle.setData('cleared', false); // Reset scoring flag
                    // Keep the same consistent speed
                    obstacle.setVelocityX(-120);
                }
            }
        });
    }

    respawnPlayer() {
        // Reset player position to the beginning of the level
        const height = window.innerHeight;
        const platformRaise = 130;
        this.player.setPosition(100, height - 300 - platformRaise);
        this.player.setVisible(true);
        this.player.body.enable = true;
        this.player.setVelocity(0, 0);
        
        // Reset player state
        this.player.isJumping = false;
        this.player.hasReachedJumpPeak = false;
        
        // Play idle animation
        this.player.play('idle', true);
        
        // Reset camera to follow player
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        
        console.log(`Player respawned. Lives remaining: ${this.lives}`);
    }

    showGameOverScreen() {
        // Stop player movement and disable input
        this.player.setVelocity(0);
        this.player.body.enable = false;
        
        // Disable cursor keys
        this.cursors.left.enabled = false;
        this.cursors.right.enabled = false;
        this.cursors.up.enabled = false;
        this.cursors.down.enabled = false;
        
        // Flag to indicate game is over
        this.levelCompleted = true;
        
        // Create game over panel
        const panel = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            700,
            500,
            0x8B0000  // Dark red color for game over
        );
        panel.setScrollFactor(0);
        panel.setDepth(20);
        
        // Game over title
        const title = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 150,
            'GAME OVER',
            {
                fontSize: '48px',
                fill: '#FF0000',
                stroke: '#000',
                strokeThickness: 4
            }
        );
        title.setOrigin(0.5);
        title.setScrollFactor(0);
        title.setDepth(21);
        
        // Final score
        // Score display removed
        
        // Level reached
        const levelReached = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 20,
            `Level Reached: ${this.currentLevel}`,
            {
                fontSize: '24px',
                fill: '#fff',
                stroke: '#000',
                strokeThickness: 1
            }
        );
        levelReached.setOrigin(0.5);
        levelReached.setScrollFactor(0);
        levelReached.setDepth(21);
        
        // Restart game button
        const restartButton = this.add.graphics();
        restartButton.fillStyle(0x228B22, 1); // Green color
        restartButton.fillRoundedRect(this.cameras.main.width / 2 - 100, this.cameras.main.height / 2 + 50 - 30, 200, 60, 15);
        restartButton.setScrollFactor(0);
        restartButton.setDepth(21);
        restartButton.setInteractive(new Phaser.Geom.Rectangle(this.cameras.main.width / 2 - 100, this.cameras.main.height / 2 + 50 - 30, 200, 60), Phaser.Geom.Rectangle.Contains);
        
        const restartText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            'Restart Game',
            { fontSize: '24px', fill: '#fff' }
        );
        restartText.setScrollFactor(0);
        restartText.setOrigin(0.5);
        restartText.setDepth(22);
        
        // Main menu button
        const menuButton = this.add.graphics();
        menuButton.fillStyle(0x4169E1, 1); // Blue color
        menuButton.fillRoundedRect(this.cameras.main.width / 2 - 100, this.cameras.main.height / 2 + 130 - 30, 200, 60, 15);
        menuButton.setScrollFactor(0);
        menuButton.setDepth(21);
        menuButton.setInteractive(new Phaser.Geom.Rectangle(this.cameras.main.width / 2 - 100, this.cameras.main.height / 2 + 130 - 30, 200, 60), Phaser.Geom.Rectangle.Contains);
        
        const menuText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 130,
            'Main Menu',
            { fontSize: '24px', fill: '#fff' }
        );
        menuText.setScrollFactor(0);
        menuText.setOrigin(0.5);
        menuText.setDepth(22);
        
        // Button interactions
        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene', { level: 1, resetTimer: true });
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Hover effects
        restartButton.on('pointerover', () => {
            restartButton.clear();
            restartButton.fillStyle(0x32CD32, 1);
            restartButton.fillRoundedRect(this.cameras.main.width / 2 - 100, this.cameras.main.height / 2 + 50 - 30, 200, 60, 15);
        });
        restartButton.on('pointerout', () => {
            restartButton.clear();
            restartButton.fillStyle(0x228B22, 1);
            restartButton.fillRoundedRect(this.cameras.main.width / 2 - 100, this.cameras.main.height / 2 + 50 - 30, 200, 60, 15);
        });
        
        menuButton.on('pointerover', () => {
            menuButton.clear();
            menuButton.fillStyle(0x6495ED, 1);
            menuButton.fillRoundedRect(this.cameras.main.width / 2 - 100, this.cameras.main.height / 2 + 130 - 30, 200, 60, 15);
        });
        menuButton.on('pointerout', () => {
            menuButton.clear();
            menuButton.fillStyle(0x4169E1, 1);
            menuButton.fillRoundedRect(this.cameras.main.width / 2 - 100, this.cameras.main.height / 2 + 130 - 30, 200, 60, 15);
        });
        
        console.log('Game Over! Level Reached:', this.currentLevel);
    }
} 