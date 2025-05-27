
import Phaser from 'https://esm.sh/phaser@3.80.1';
import Constants from 'constants';

class WorldGenerator {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.biome = options.biome || 'forest';
        this.seed = options.seed || Math.random() * 1000;
    }

    noise2D(x, y) {
        // Simple noise function - you can replace with more sophisticated noise later
        const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (hash - Math.floor(hash)) * 2 - 1;
    }

    createDynamicTileset() {
        const tileSize = Constants.TILE_SIZE;
        const tilesPerRow = 8;
        const totalTiles = 33; // Based on your TILE_IDS
        const rows = Math.ceil(totalTiles / tilesPerRow);
        
        const canvas = this.scene.textures.createCanvas('dynamicTiles', 
            tilesPerRow * tileSize, rows * tileSize);
        const ctx = canvas.getContext('2d');

        // Generate tiles with different colors based on type
        const tileColors = {
            [Constants.TILE_IDS.SURFACE_FOREST]: '#228B22',
            [Constants.TILE_IDS.UNDERGROUND_FOREST]: '#8B4513',
            [Constants.TILE_IDS.SURFACE_DESERT]: '#F4A460',
            [Constants.TILE_IDS.UNDERGROUND_DESERT]: '#CD853F',
            [Constants.TILE_IDS.TREE_TRUNK]: '#654321',
            [Constants.TILE_IDS.TREE_FOLIAGE]: '#006400'
        };

        for (let i = 0; i < totalTiles; i++) {
            const x = (i % tilesPerRow) * tileSize;
            const y = Math.floor(i / tilesPerRow) * tileSize;
            
            ctx.fillStyle = tileColors[i] || '#808080';
            ctx.fillRect(x, y, tileSize, tileSize);
            
            // Add border for visibility
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, tileSize, tileSize);
        }

        canvas.refresh();
    }

    generate(chunkX, chunkY) {
        const mainTerrainData = [];
        const lowFloraData = [];
        const canopyData = [];

        for (let y = 0; y < Constants.CHUNK_HEIGHT_TILES; y++) {
            mainTerrainData[y] = [];
            lowFloraData[y] = [];
            canopyData[y] = [];
            
            for (let x = 0; x < Constants.CHUNK_WIDTH_TILES; x++) {
                const worldX = chunkX * Constants.CHUNK_WIDTH_TILES + x;
                const worldY = chunkY * Constants.CHUNK_HEIGHT_TILES + y;
                
                // Simple terrain generation
                const surfaceLevel = 30 + this.noise2D(worldX * 0.1, 0) * 5;
                
                if (worldY < surfaceLevel) {
                    mainTerrainData[y][x] = Constants.TILE_IDS.AIR;
                } else if (worldY < surfaceLevel + 5) {
                    mainTerrainData[y][x] = this.biome === 'forest' ? 
                        Constants.TILE_IDS.SURFACE_FOREST : Constants.TILE_IDS.SURFACE_DESERT;
                } else {
                    mainTerrainData[y][x] = this.biome === 'forest' ? 
                        Constants.TILE_IDS.UNDERGROUND_FOREST : Constants.TILE_IDS.UNDERGROUND_DESERT;
                }
                
                lowFloraData[y][x] = Constants.TILE_IDS.AIR;
                canopyData[y][x] = Constants.TILE_IDS.AIR;
            }
        }

        return {
            mainTerrainData,
            lowFloraData,
            canopyData
        };
    }
}

export default WorldGenerator;
