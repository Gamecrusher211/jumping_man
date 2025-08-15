import Phaser from 'phaser';

export default class HighScoresScene extends Phaser.Scene {
    constructor() {
        super('HighScoresScene');
    }

    preload() {
        // Load background for high scores screen (using level 1 background)
        this.load.image('highscores_sky', 'assets/images/background/sky.png');
        this.load.image('highscores_mountains', 'assets/images/background/mountains.png');
        this.load.image('highscores_trees', 'assets/images/background/trees.png');
        this.load.image('highscores_path', 'assets/images/background/path.png');
        this.load.image('highscores_stone_bottom', 'assets/images/background/stone_bottom.png');
    }

    create() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const bgYOffset = 0;

        // Helper to create a tileSprite for high scores background
        function addBottomAnchoredTileSprite(scene, key) {
            const tex = scene.textures.get(key).getSourceImage();
            const imgH = tex.height;
            const layer = scene.add.tileSprite(0, height - bgYOffset, width, height, key)
                .setOrigin(0, 1)
                .setScrollFactor(0);
            layer.tilePositionY = imgH - height;
            return layer;
        }

        // Create high scores background
        this.highscoresSky = addBottomAnchoredTileSprite(this, 'highscores_sky');
        this.highscoresMountains = addBottomAnchoredTileSprite(this, 'highscores_mountains');
        this.highscoresTrees = addBottomAnchoredTileSprite(this, 'highscores_trees');
        this.highscoresPath = addBottomAnchoredTileSprite(this, 'highscores_path');
        this.highscoresStoneBottom = addBottomAnchoredTileSprite(this, 'highscores_stone_bottom');

        // Title
        const title = this.add.text(width / 2, height / 6, '🏆 HIGH SCORES 🏆', {
            fontSize: '64px',
            fill: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        title.setScrollFactor(0);

        // Load high scores from localStorage
        let highScores = {};
        try {
            const savedScores = localStorage.getItem('jumpingManHighScores');
            console.log('Raw saved scores:', savedScores);
            if (savedScores) {
                const parsed = JSON.parse(savedScores);
                // Ensure it's an object, not an array
                if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    highScores = parsed;
                } else {
                    console.log('Corrupted high scores data found, resetting to empty object');
                    highScores = {};
                    localStorage.removeItem('jumpingManHighScores');
                }
                console.log('Parsed high scores:', highScores);
            }
        } catch (error) {
            console.log('Could not load high scores:', error);
        }

        // Create main panel with rounded corners
        const mainPanel = this.add.graphics();
        mainPanel.fillStyle(0xDEB887, 1); // wooden table color
        mainPanel.fillRoundedRect(width / 2 - 600, height / 2 - 400, 1200, 800, 20); // 20px corner radius
        mainPanel.setScrollFactor(0);
        mainPanel.setDepth(10);

        // Panel title
        const panelTitle = this.add.text(width / 2, height / 2 - 350, 'Best Times', {
            fontSize: '48px',
            fill: '#000',
            fontStyle: 'bold'
        });
        panelTitle.setOrigin(0.5);
        panelTitle.setScrollFactor(0);
        panelTitle.setDepth(11);

        // Helper function to format time and signature
        const formatTimeAndSignature = (highScoreData) => {
            console.log('formatTimeAndSignature called with:', highScoreData, 'type:', typeof highScoreData);
            
            if (!highScoreData) {
                console.log('Returning "No record" for null/undefined data');
                return 'No record';
            }
            
            let timeInSeconds = null;
            let signature = '';
            
            if (typeof highScoreData === 'object' && highScoreData.time) {
                // New format with signature
                timeInSeconds = highScoreData.time;
                signature = highScoreData.signature || '';
            } else if (typeof highScoreData === 'number') {
                // Old format - just time
                timeInSeconds = highScoreData;
            } else {
                console.log('Returning "No record" for invalid data format');
                return 'No record';
            }
            
            if (!timeInSeconds || isNaN(timeInSeconds)) {
                console.log('Returning "No record" for invalid time:', timeInSeconds);
                return 'No record';
            }
            
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
            
            const result = signature ? `${timeString} by ${signature}` : timeString;
            console.log('Formatted time and signature result:', result);
            return result;
        };

        // Level 1 score
        console.log('Raw level1 value:', highScores.level1);
        const level1Text = this.add.text(width / 2 - 350, height / 2 - 180, 'Level 1 - Forest Adventure', {
            fontSize: '28px',
            fill: '#000',
            fontStyle: 'bold'
        });
        level1Text.setOrigin(0.5);
        level1Text.setScrollFactor(0);
        level1Text.setDepth(11);

        const level1Score = this.add.text(width / 2 + 350, height / 2 - 180, formatTimeAndSignature(highScores.level1), {
            fontSize: '32px',
            fill: highScores.level1 ? '#FFD700' : '#666',
            fontStyle: 'bold',
            stroke: highScores.level1 ? '#000' : '',
            strokeThickness: highScores.level1 ? 1 : 0
        });
        level1Score.setOrigin(0.5);
        level1Score.setScrollFactor(0);
        level1Score.setDepth(11);

        // Level 2 score
        console.log('Raw level2 value:', highScores.level2);
        const level2Text = this.add.text(width / 2 - 350, height / 2 - 80, 'Level 2 - Castle Challenge', {
            fontSize: '28px',
            fill: '#000',
            fontStyle: 'bold'
        });
        level2Text.setOrigin(0.5);
        level2Text.setScrollFactor(0);
        level2Text.setDepth(11);

        const level2Score = this.add.text(width / 2 + 350, height / 2 - 80, formatTimeAndSignature(highScores.level2), {
            fontSize: '32px',
            fill: highScores.level2 ? '#FFD700' : '#666',
            fontStyle: 'bold',
            stroke: highScores.level2 ? '#000' : '',
            strokeThickness: highScores.level2 ? 1 : 0
        });
        level2Score.setOrigin(0.5);
        level2Score.setScrollFactor(0);
        level2Score.setDepth(11);

        // Level 3 score
        console.log('Raw level3 value:', highScores.level3);
        const level3Text = this.add.text(width / 2 - 350, height / 2 + 20, 'Level 3 - Mountain Adventure', {
            fontSize: '28px',
            fill: '#000',
            fontStyle: 'bold'
        });
        level3Text.setOrigin(0.5);
        level3Text.setScrollFactor(0);
        level3Text.setDepth(11);

        const level3Score = this.add.text(width / 2 + 350, height / 2 + 20, formatTimeAndSignature(highScores.level3), {
            fontSize: '32px',
            fill: highScores.level3 ? '#FFD700' : '#666',
            fontStyle: 'bold',
            stroke: highScores.level3 ? '#000' : '',
            strokeThickness: highScores.level3 ? 1 : 0
        });
        level3Score.setOrigin(0.5);
        level3Score.setScrollFactor(0);
        level3Score.setDepth(11);

        // Clear scores button
        const clearButton = this.add.rectangle(
            width / 2,
            height / 2 + 180,
            200,  // width
            60,   // height
            0xDC143C  // crimson color
        );
        clearButton.setScrollFactor(0);
        clearButton.setDepth(11);
        clearButton.setInteractive();
        
        const clearText = this.add.text(
            width / 2,
            height / 2 + 180,
            'Clear All Scores',
            { fontSize: '20px', fill: '#fff' }
        );
        clearText.setScrollFactor(0);
        clearText.setOrigin(0.5);
        clearText.setDepth(12);

        // Back to Menu button
        const backButton = this.add.rectangle(
            width / 2,
            height / 2 + 260,
            200,  // width
            60,   // height
            0x4169E1  // blue color
        );
        backButton.setScrollFactor(0);
        backButton.setDepth(11);
        backButton.setInteractive();
        
        const backText = this.add.text(
            width / 2,
            height / 2 + 260,
            'Back to Menu',
            { fontSize: '24px', fill: '#fff' }
        );
        backText.setScrollFactor(0);
        backText.setOrigin(0.5);
        backText.setDepth(12);

        // Button interactions
        clearButton.on('pointerdown', () => {
            // Clear all high scores
            localStorage.removeItem('jumpingManHighScores');
            level1Score.setText('No record');
            level1Score.setFill('#666');
            level1Score.setStroke('');
            level1Score.setStrokeThickness(0);
            level2Score.setText('No record');
            level2Score.setFill('#666');
            level2Score.setStroke('');
            level2Score.setStrokeThickness(0);
            level3Score.setText('No record');
            level3Score.setFill('#666');
            level3Score.setStroke('');
            level3Score.setStrokeThickness(0);
        });

        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Hover effects
        clearButton.on('pointerover', () => {
            clearButton.setFillStyle(0xFF4500);
        });
        clearButton.on('pointerout', () => {
            clearButton.setFillStyle(0xDC143C);
        });

        backButton.on('pointerover', () => {
            backButton.setFillStyle(0x6495ED);
        });
        backButton.on('pointerout', () => {
            backButton.setFillStyle(0x4169E1);
        });

        // Handle window resize
        const resize = () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            this.scale.resize(newWidth, newHeight);
            
            [this.highscoresSky, this.highscoresMountains, this.highscoresTrees, this.highscoresPath, this.highscoresStoneBottom].forEach(layer => {
                const tex = layer.texture.getSourceImage();
                const imgH = tex.height;
                layer.setSize(newWidth, newHeight);
                layer.setPosition(0, newHeight - bgYOffset);
                layer.tilePositionY = imgH - newHeight;
            });
        };
        window.addEventListener('resize', resize);
    }

    update() {
        // Simple parallax effect for high scores background
        const time = this.time.now * 0.001;
        this.highscoresSky.tilePositionX = time * 10;
        this.highscoresMountains.tilePositionX = time * 20;
        this.highscoresTrees.tilePositionX = time * 30;
        this.highscoresPath.tilePositionX = time * 40;
        this.highscoresStoneBottom.tilePositionX = time * 50;
    }
} 