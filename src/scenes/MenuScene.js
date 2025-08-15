import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
        this.menuElapsedMs = 0; // local clock for menu parallax
    }

    preload() {
        // Load background for menu (using level 1 background)
        this.load.image('menu_sky', 'assets/images/background/sky.png');
        this.load.image('menu_mountains', 'assets/images/background/mountains.png');
        this.load.image('menu_trees', 'assets/images/background/trees.png');
        this.load.image('menu_path', 'assets/images/background/path.png');
        this.load.image('menu_stone_bottom', 'assets/images/background/stone_bottom.png');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const bgYOffset = 0;

        // Helper to create a tileSprite for menu background
        function addBottomAnchoredTileSprite(scene, key) {
            const tex = scene.textures.get(key).getSourceImage();
            const imgH = tex.height;
            const layer = scene.add.tileSprite(0, height - bgYOffset, width, height, key)
                .setOrigin(0, 1)
                .setScrollFactor(0);
            layer.tilePositionY = imgH - height;
            return layer;
        }

        // Create menu background
        this.menuSky = addBottomAnchoredTileSprite(this, 'menu_sky');
        this.menuMountains = addBottomAnchoredTileSprite(this, 'menu_mountains');
        this.menuTrees = addBottomAnchoredTileSprite(this, 'menu_trees');
        this.menuPath = addBottomAnchoredTileSprite(this, 'menu_path');
        this.menuStoneBottom = addBottomAnchoredTileSprite(this, 'menu_stone_bottom');

        // Game title
        const title = this.add.text(width / 2, height / 4, 'JUMPING MAN', {
            fontSize: '72px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        title.setScrollFactor(0);

        // Subtitle
        const subtitle = this.add.text(width / 2, height / 4 + 80, 'Choose Your Adventure', {
            fontSize: '32px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2
        });
        subtitle.setOrigin(0.5);
        subtitle.setScrollFactor(0);

        // Play button with rounded corners
        const playButton = this.add.graphics();
        playButton.fillStyle(0x228B22, 1); // green color
        playButton.fillRoundedRect(width / 2 - 200 - 150, height / 2 + 50 - 40, 300, 80, 15); // 15px corner radius
        playButton.setScrollFactor(0);
        playButton.setInteractive(new Phaser.Geom.Rectangle(width / 2 - 200 - 150, height / 2 + 50 - 40, 300, 80), Phaser.Geom.Rectangle.Contains);
        
        const playText = this.add.text(
            width / 2 - 200,
            height / 2 + 50,
            'Play\nStart from Level 1',
            { 
                fontSize: '24px', 
                fill: '#fff',
                align: 'center'
            }
        );
        playText.setScrollFactor(0);
        playText.setOrigin(0.5);

        // Levels button with rounded corners
        const levelsButton = this.add.graphics();
        levelsButton.fillStyle(0x8B4513, 1); // brown color
        levelsButton.fillRoundedRect(width / 2 + 200 - 150, height / 2 + 50 - 40, 300, 80, 15); // 15px corner radius
        levelsButton.setScrollFactor(0);
        levelsButton.setInteractive(new Phaser.Geom.Rectangle(width / 2 + 200 - 150, height / 2 + 50 - 40, 300, 80), Phaser.Geom.Rectangle.Contains);
        
        const levelsText = this.add.text(
            width / 2 + 200,
            height / 2 + 50,
            'Levels\nChoose Any Level',
            { 
                fontSize: '24px', 
                fill: '#fff',
                align: 'center'
            }
        );
        levelsText.setScrollFactor(0);
        levelsText.setOrigin(0.5);

        // High Scores button with rounded corners
        const highScoresButton = this.add.graphics();
        highScoresButton.fillStyle(0xFFD700, 1); // gold color
        highScoresButton.fillRoundedRect(width / 2 - 150, height / 2 + 150 - 40, 300, 80, 15); // 15px corner radius
        highScoresButton.setScrollFactor(0);
        highScoresButton.setInteractive(new Phaser.Geom.Rectangle(width / 2 - 150, height / 2 + 150 - 40, 300, 80), Phaser.Geom.Rectangle.Contains);
        
        const highScoresText = this.add.text(
            width / 2,
            height / 2 + 150,
            '🏆 High Scores 🏆\nView Best Times',
            { 
                fontSize: '24px', 
                fill: '#000',
                align: 'center',
                fontStyle: 'bold'
            }
        );
        highScoresText.setScrollFactor(0);
        highScoresText.setOrigin(0.5);

        // Instructions
        const instructions = this.add.text(width / 2, height * 0.85, 
            'Use Arrow Keys to move and jump\nJump over obstacles to score points!', {
            fontSize: '20px',
            fill: '#fff',
            align: 'center',
            stroke: '#000',
            strokeThickness: 1
        });
        instructions.setOrigin(0.5);
        instructions.setScrollFactor(0);

        // Button interactions
        playButton.on('pointerdown', () => {
            // Explicit timer reset request
            this.scene.start('GameScene', { level: 1, resetTimer: true });
        });

        levelsButton.on('pointerdown', () => {
            this.scene.start('LevelsScene');
        });

        highScoresButton.on('pointerdown', () => {
            this.scene.start('HighScoresScene');
        });

        // Hover effects
        playButton.on('pointerover', () => {
            playButton.clear();
            playButton.fillStyle(0x32CD32, 1);
            playButton.fillRoundedRect(width / 2 - 200 - 150, height / 2 + 50 - 40, 300, 80, 15);
        });
        playButton.on('pointerout', () => {
            playButton.clear();
            playButton.fillStyle(0x228B22, 1);
            playButton.fillRoundedRect(width / 2 - 200 - 150, height / 2 + 50 - 40, 300, 80, 15);
        });

        levelsButton.on('pointerover', () => {
            levelsButton.clear();
            levelsButton.fillStyle(0xA0522D, 1);
            levelsButton.fillRoundedRect(width / 2 + 200 - 150, height / 2 + 50 - 40, 300, 80, 15);
        });
        levelsButton.on('pointerout', () => {
            levelsButton.clear();
            levelsButton.fillStyle(0x8B4513, 1);
            levelsButton.fillRoundedRect(width / 2 + 200 - 150, height / 2 + 50 - 40, 300, 80, 15);
        });

        highScoresButton.on('pointerover', () => {
            highScoresButton.clear();
            highScoresButton.fillStyle(0xFFA500, 1);
            highScoresButton.fillRoundedRect(width / 2 - 150, height / 2 + 150 - 40, 300, 80, 15);
        });
        highScoresButton.on('pointerout', () => {
            highScoresButton.clear();
            highScoresButton.fillStyle(0xFFD700, 1);
            highScoresButton.fillRoundedRect(width / 2 - 150, height / 2 + 150 - 40, 300, 80, 15);
        });

        // Handle Phaser scale resize
        const resize = (gameSize) => {
            const newWidth = gameSize.width;
            const newHeight = gameSize.height;
            
            [this.menuSky, this.menuMountains, this.menuTrees, this.menuPath, this.menuStoneBottom].forEach(layer => {
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
        // Simple parallax effect for menu background using a local timer
        this.menuElapsedMs += delta;
        const t = this.menuElapsedMs * 0.001;
        this.menuSky.tilePositionX = t * 10;
        this.menuMountains.tilePositionX = t * 20;
        this.menuTrees.tilePositionX = t * 30;
        this.menuPath.tilePositionX = t * 40;
        this.menuStoneBottom.tilePositionX = t * 50;
    }
} 