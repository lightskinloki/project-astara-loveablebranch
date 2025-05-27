// Placeholder for Inventory management class
// Will handle adding/removing resources and checking crafting recipes

class Inventory {
    constructor() {
        this.items = {
            stone: 0,
            dirt: 0,
            wood: 0, // Was potentially grass before, now explicitly wood for forest surface
            sand: 0,
            leaves: 0, // New resource
            red_petals: 0,
            yellow_petals: 0,
            plant_fibers: 0, // For ferns
            red_mushroom: 0,
            brown_mushroom: 0,
            vine_segment: 0,
            grass_blades: 0,
            moss_clump: 0,
            clover_leaf: 0,
            decayed_wood: 0,
            red_berries: 0,
            blue_berries: 0,
            shelf_fungus_cap: 0,
            large_leaf: 0,
            basic_block: 0, // Example crafted item
        };
        console.log('Inventory initialized');
    }

    addResource(resourceType, amount = 1) {
        if (this.items.hasOwnProperty(resourceType)) {
            this.items[resourceType] += amount;
            console.log(`Added ${amount} ${resourceType}. Total: ${this.items[resourceType]}`);
            // Trigger UI update if needed
        } else {
            console.warn(`Unknown resource type: ${resourceType}`);
        }
    }

    removeResource(resourceType, amount = 1) {
         if (this.items.hasOwnProperty(resourceType) && this.items[resourceType] >= amount) {
            this.items[resourceType] -= amount;
            console.log(`Removed ${amount} ${resourceType}. Total: ${this.items[resourceType]}`);
             // Trigger UI update if needed
            return true;
        }
        console.log(`Not enough ${resourceType} to remove ${amount}.`);
        return false;
    }

    hasResources(requirements) {
        // requirements = { stone: 2 }
        for (const resourceType in requirements) {
            if (!this.items.hasOwnProperty(resourceType) || this.items[resourceType] < requirements[resourceType]) {
                return false;
            }
        }
        return true;
    }

    craftItem(recipe) {
        // recipe = { ingredients: { stone: 2 }, result: { item: 'basic_block', amount: 1 } }
        if (this.hasResources(recipe.ingredients)) {
            // Remove ingredients
            for (const resourceType in recipe.ingredients) {
                this.removeResource(resourceType, recipe.ingredients[resourceType]);
            }
            // Add result
            this.addResource(recipe.result.item, recipe.result.amount);
            console.log(`Crafted ${recipe.result.amount} ${recipe.result.item}`);
            return true;
        }
        console.log('Cannot craft: Insufficient resources.');
        return false;
    }

    getInventoryState() {
        // Return a copy or formatted string for UI display
        return { ...this.items };
    }
}
export default Inventory; // Make class available for import
