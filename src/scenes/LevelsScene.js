import Phaser from 'phaser';

export default class LevelsScene extends Phaser.Scene {
    constructor() {
        super('LevelsScene');
    }

    preload() {
        // Load background for levels screen (using level 2 background)
        this.load.image('levels_castle_wall', 'assets/images/background/level2/castle_wall.png');
        this.load.image('levels_path', 'assets/images/background/level2/path.png');
        this.load.image('levels_bottom', 'assets/images/background/level2/bottom.png');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const bgYOffset = 0;

        // Helper to create a tileSprite for levels background
        function addBottomAnchoredTileSprite(scene, key) {
            const tex = scene.textures.get(key).getSourceImage();
            const imgH = tex.height;
            const layer = scene.add.tileSprite(0, height - bgYOffset, width, height, key)
                .setOrigin(0, 1)
                .setScrollFactor(0);
            layer.tilePositionY = imgH - height;
            return layer;
        }

        // Create levels background
        this.levelsCastleWall = addBottomAnchoredTileSprite(this, 'levels_castle_wall');
        this.levelsPath = addBottomAnchoredTileSprite(this, 'levels_path');
        this.levelsBottom = addBottomAnchoredTileSprite(this, 'levels_bottom');

        // Title
        const title = this.add.text(width / 2, height / 6, 'SELECT LEVEL', {
            fontSize: '64px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        title.setScrollFactor(0);

        // Level 1 button with rounded corners
        const level1Button = this.add.graphics();
        level1Button.fillStyle(0x228B22, 1); // green color
        level1Button.fillRoundedRect(width / 2 - 300 - 125, height / 2 - 60, 250, 120, 15); // 15px corner radius
        level1Button.setScrollFactor(0);
        level1Button.setInteractive(new Phaser.Geom.Rectangle(width / 2 - 300 - 125, height / 2 - 60, 250, 120), Phaser.Geom.Rectangle.Contains);
        
        const level1Text = this.add.text(
            width / 2 - 300,
            height / 2 - 20,
            'Level 1',
            { 
                fontSize: '32px', 
                fill: '#fff',
                fontStyle: 'bold'
            }
        );
        level1Text.setScrollFactor(0);
        level1Text.setOrigin(0.5);

        const level1Desc = this.add.text(
            width / 2 - 300,
            height / 2 + 20,
            'Forest Adventure\nRock Obstacles',
            { 
                fontSize: '16px', 
                fill: '#fff',
                align: 'center'
            }
        );
        level1Desc.setScrollFactor(0);
        level1Desc.setOrigin(0.5);

        // Level 2 button with rounded corners
        const level2Button = this.add.graphics();
        level2Button.fillStyle(0x8B4513, 1); // brown color
        level2Button.fillRoundedRect(width / 2 + 300 - 125, height / 2 - 60, 250, 120, 15); // 15px corner radius
        level2Button.setScrollFactor(0);
        level2Button.setInteractive(new Phaser.Geom.Rectangle(width / 2 + 300 - 125, height / 2 - 60, 250, 120), Phaser.Geom.Rectangle.Contains);
        
        const level2Text = this.add.text(
            width / 2 + 300,
            height / 2 - 20,
            'Level 2',
            { 
                fontSize: '32px', 
                fill: '#fff',
                fontStyle: 'bold'
            }
        );
        level2Text.setScrollFactor(0);
        level2Text.setOrigin(0.5);

        const level2Desc = this.add.text(
            width / 2 + 300,
            height / 2 + 20,
            'Castle Challenge\nBarrel Obstacles',
            { 
                fontSize: '16px', 
                fill: '#fff',
                align: 'center'
            }
        );
        level2Desc.setScrollFactor(0);
        level2Desc.setOrigin(0.5);

        // Level 3 button with rounded corners
        const level3Button = this.add.graphics();
        level3Button.fillStyle(0x4B0082, 1); // purple color
        level3Button.fillRoundedRect(width / 2 - 125, height / 2 + 100, 250, 120, 15); // 15px corner radius
        level3Button.setScrollFactor(0);
        level3Button.setInteractive(new Phaser.Geom.Rectangle(width / 2 - 125, height / 2 + 100, 250, 120), Phaser.Geom.Rectangle.Contains);
        
        const level3Text = this.add.text(
            width / 2,
            height / 2 + 140,
            'Level 3',
            { 
                fontSize: '32px', 
                fill: '#fff',
                fontStyle: 'bold'
            }
        );
        level3Text.setScrollFactor(0);
        level3Text.setOrigin(0.5);

        const level3Desc = this.add.text(
            width / 2,
            height / 2 + 180,
            'Mountain Adventure\nRocks & Flying Snowballs',
            { 
                fontSize: '16px', 
                fill: '#fff',
                align: 'center'
            }
        );
        level3Desc.setScrollFactor(0);
        level3Desc.setOrigin(0.5);

        // Back to Menu button with rounded corners
        const backButton = this.add.graphics();
        backButton.fillStyle(0x4169E1, 1); // blue color
        backButton.fillRoundedRect(width / 2 - 100, height * 0.85 - 30, 200, 60, 15); // 15px corner radius
        backButton.setScrollFactor(0);
        backButton.setInteractive(new Phaser.Geom.Rectangle(width / 2 - 100, height * 0.85 - 30, 200, 60), Phaser.Geom.Rectangle.Contains);
        
        const backText = this.add.text(
            width / 2,
            height * 0.85,
            'Back to Menu',
            { fontSize: '24px', fill: '#fff' }
        );
        backText.setScrollFactor(0);
        backText.setOrigin(0.5);

        // Button interactions
        level1Button.on('pointerdown', () => {
            this.scene.start('GameScene', { level: 1, resetTimer: true });
        });

        level2Button.on('pointerdown', () => {
            this.scene.start('GameScene', { level: 2, resetTimer: true });
        });

        level3Button.on('pointerdown', () => {
            this.scene.start('GameScene', { level: 3, resetTimer: true });
        });

        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Hover effects
        level1Button.on('pointerover', () => {
            level1Button.clear();
            level1Button.fillStyle(0x32CD32, 1);
            level1Button.fillRoundedRect(width / 2 - 300 - 125, height / 2 - 60, 250, 120, 15);
        });
        level1Button.on('pointerout', () => {
            level1Button.clear();
            level1Button.fillStyle(0x228B22, 1);
            level1Button.fillRoundedRect(width / 2 - 300 - 125, height / 2 - 60, 250, 120, 15);
        });

        level2Button.on('pointerover', () => {
            level2Button.clear();
            level2Button.fillStyle(0xA0522D, 1);
            level2Button.fillRoundedRect(width / 2 + 300 - 125, height / 2 - 60, 250, 120, 15);
        });
        level2Button.on('pointerout', () => {
            level2Button.clear();
            level2Button.fillStyle(0x8B4513, 1);
            level2Button.fillRoundedRect(width / 2 + 300 - 125, height / 2 - 60, 250, 120, 15);
        });

        level3Button.on('pointerover', () => {
            level3Button.clear();
            level3Button.fillStyle(0x8A2BE2, 1);
            level3Button.fillRoundedRect(width / 2 - 125, height / 2 + 100, 250, 120, 15);
        });
        level3Button.on('pointerout', () => {
            level3Button.clear();
            level3Button.fillStyle(0x4B0082, 1);
            level3Button.fillRoundedRect(width / 2 - 125, height / 2 + 100, 250, 120, 15);
        });

        backButton.on('pointerover', () => {
            backButton.clear();
            backButton.fillStyle(0x6495ED, 1);
            backButton.fillRoundedRect(width / 2 - 100, height * 0.85 - 30, 200, 60, 15);
        });
        backButton.on('pointerout', () => {
            backButton.clear();
            backButton.fillStyle(0x4169E1, 1);
            backButton.fillRoundedRect(width / 2 - 100, height * 0.85 - 30, 200, 60, 15);
        });

        // Handle Phaser scale resize
        const resize = (gameSize) => {
            const newWidth = gameSize.width;
            const newHeight = gameSize.height;
            
            [this.levelsCastleWall, this.levelsPath, this.levelsBottom].forEach(layer => {
                const tex = layer.texture.getSourceImage();
                const imgH = tex.height;
                layer.setSize(newWidth, newHeight);
                layer.setPosition(0, newHeight - bgYOffset);
                layer.tilePositionY = imgH - newHeight;
            });
        };
        this.scale.on('resize', resize);
        // Clean up listener
        this.events.once('shutdown', () => this.scale.off('resize', resize));
        this.events.once('destroy', () => this.scale.off('resize', resize));
    }

    update(time, delta) {
        // Parallax effect using local time so it doesn't touch gameplay timer
        this._levelsElapsedMs = (this._levelsElapsedMs || 0) + (delta || 0);
        const t = this._levelsElapsedMs * 0.001;
        this.levelsCastleWall.tilePositionX = t * 15;
        this.levelsPath.tilePositionX = t * 25;
        this.levelsBottom.tilePositionX = t * 35;
    }
} 