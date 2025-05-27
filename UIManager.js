// Placeholder for UI Manager class
// Will handle displaying health, inventory, etc. using Phaser text or rexUI

// May need import Phaser from 'phaser' or specific rexUI components later

class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.healthText = null;
        this.inventoryText = null;
        // Add refs for rexUI elements if used
        console.log('UIManager initialized');
    }

    createHealthDisplay(initialHealth) {
        // Use scene.add.text to create a text object
        // Position it using scene.cameras.main.worldView or setScrollFactor(0)
        this.healthText = this.scene.add.text(16, 16, `Health: ${initialHealth}`, {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 5, y: 3 }
        });
        this.healthText.setScrollFactor(0); // Keep UI fixed on screen
        console.log('Health display created');
    }

     createInventoryDisplay(initialInventory) {
         // Use scene.add.text or rexUI grid
         // Example with text:
         let inventoryString = 'Inventory:\n';
         for (const item in initialInventory) {
             inventoryString += `${item}: ${initialInventory[item]}\n`;
         }

         this.inventoryText = this.scene.add.text(16, 50, inventoryString, {
             fontSize: '16px',
             fill: '#ffffff',
             backgroundColor: 'rgba(0,0,0,0.5)',
             padding: { x: 5, y: 3 },
             align: 'left'
         });
         this.inventoryText.setScrollFactor(0);
         console.log('Inventory display created');
     }

    updateHealth(newHealth) {
        if (this.healthText) {
            this.healthText.setText(`Health: ${Math.max(0, Math.round(newHealth))}`); // Ensure health doesn't go below 0 and round it
        }
    }

    updateInventory(newInventory) {
        if (this.inventoryText) {
            let inventoryString = 'Inventory:\n';
             for (const item in newInventory) {
                 if (newInventory[item] > 0) { // Optionally only show items > 0
                    inventoryString += `${item}: ${newInventory[item]}\n`;
                 }
             }
            this.inventoryText.setText(inventoryString);
        }
         // Update rexUI grid if used
    }

    // Method to potentially update all UI elements at once in scene's update loop
    update() {
        // Could poll game state or rely on event-driven updates
    }
}

export default UIManager;
