
class Inventory {
    constructor() {
        this.items = {
            wood: 0,
            stone: 0,
            dirt: 0,
            sand: 0,
            leaves: 0
        };
    }

    addResource(type, amount = 1) {
        if (this.items.hasOwnProperty(type)) {
            this.items[type] += amount;
            console.log(`Added ${amount} ${type}. Total: ${this.items[type]}`);
        } else {
            this.items[type] = amount;
            console.log(`Added new resource: ${amount} ${type}`);
        }
    }

    removeResource(type, amount = 1) {
        if (this.items.hasOwnProperty(type) && this.items[type] >= amount) {
            this.items[type] -= amount;
            return true;
        }
        return false;
    }

    getResource(type) {
        return this.items[type] || 0;
    }

    getInventoryState() {
        return { ...this.items };
    }

    hasResource(type, amount = 1) {
        return this.getResource(type) >= amount;
    }
}

export default Inventory;
