import Phaser from 'https://esm.sh/phaser@3.80.1';
import Constants from './constants.js';
import PlanetScene from './PlanetScene.js';
import SystemScene from './SystemScene.js';

// Placeholder check for WebGL support
const supportsWebGL = () => {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
};
const config = {
    type: supportsWebGL() ? Phaser.WEBGL : Phaser.CANVAS,
    width: 800, // Placeholder width
    height: 600, // Placeholder height
    parent: 'renderDiv', // Ensure it targets the div provided by the environment
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: Constants.GRAVITY },
            // debug: true // Optional: uncomment for physics debugging visuals
        }
    },
    scene: [SystemScene, PlanetScene] // Add scenes here - SystemScene first? Or maybe a BootScene later.
};
// Initialize the Phaser Game instance
const game = new Phaser.Game(config);
// We might need to manage the game instance or scenes globally later,
// but for now, just creating it is the first step.
