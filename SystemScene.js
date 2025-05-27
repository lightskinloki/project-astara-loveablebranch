import Phaser from 'https://esm.sh/phaser@3.80.1';

class SystemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SystemScene' });
    }

    preload() {
        console.log('SystemScene preload');
        // Preload planet sprites or assets for this view
        // Example: this.load.image('forest_planet_icon', 'assets/forest_planet.png');
        // Example: this.load.image('desert_planet_icon', 'assets/desert_planet.png');
    }

    create() {
        console.log('SystemScene create');
        this.cameras.main.setBackgroundColor('#000033'); // Dark space background

        // Add text or instructions
        this.add.text(100, 50, 'Star System View', { fontSize: '32px', fill: '#fff' });
        this.add.text(100, 100, 'Click a planet to visit or press V to return.', { fontSize: '16px', fill: '#fff' });

        // Placeholder for planet sprites/buttons
        const forestPlanetButton = this.add.rectangle(200, 300, 100, 100, 0x00ff00).setInteractive();
        this.add.text(165, 290, 'Forest', { fontSize: '16px', fill: '#000' });

        const desertPlanetButton = this.add.rectangle(600, 300, 100, 100, 0xffcc00).setInteractive();
         this.add.text(565, 290, 'Desert', { fontSize: '16px', fill: '#000' });

        // Event listeners for planet selection
        forestPlanetButton.on('pointerdown', () => {
            this.scene.start('PlanetScene', { planet: 'forest' });
        });

        desertPlanetButton.on('pointerdown', () => {
             this.scene.start('PlanetScene', { planet: 'desert' });
        });

        // Key listener to return to planet (if applicable, maybe should only go from planet -> system?)
        // This might need refinement - how do we know which planet to return to?
        // For now, let's assume 'V' always goes FROM Planet TO System.
        // We could add a key here to switch *back* to the last visited planet if needed.
        // this.input.keyboard.on('keydown-V', () => {
        //    // Need logic to return to the correct planet scene instance
        // });
    }

    update(time, delta) {
        // Any updates needed for the system view (e.g., animations)
    }
}

export default SystemScene;
