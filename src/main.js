import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import LevelsScene from './scenes/LevelsScene';
import HighScoresScene from './scenes/HighScoresScene';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
               scene: [MenuScene, GameScene, LevelsScene, HighScoresScene]
};

window.addEventListener('load', () => {
    new Phaser.Game(config);
});