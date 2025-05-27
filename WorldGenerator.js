// Placeholder for WorldGenerator utility class
// Will handle procedural terrain generation using Simplex Noise
import { createNoise2D } from 'https://esm.sh/simplex-noise@4.0.1';
import Constants from 'constants'; // Assuming constants are available
// Tile Indices are now defined in Constants.TILE_IDS
const DYNAMIC_TILESET_KEY = 'dynamicTiles';
class WorldGenerator {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config; // { biome: 'forest'/'desert' } - width/height are now chunk-based
        this.noise2D = createNoise2D(); // Get the 2D noise function
        // createDynamicTileset should be called by the scene or once globally if it's scene-specific
        // For now, let's assume it's called by the scene before any chunk generation.
        // If WorldGenerator instances are created per chunk, this would be inefficient.
        // Let's leave it here for now, but be mindful if we create many WorldGenerator instances.
        // A better approach might be for PlanetScene to ensure the tileset exists.
        if (!this.scene.textures.exists(DYNAMIC_TILESET_KEY)) {
            this.createDynamicTileset();
        }
        console.log(`WorldGenerator initialized for biome: ${this.config.biome}`);
    }
    createDynamicTileset() {
        const tileSize = Constants.TILE_SIZE;
        const microTileSize = 4;
        const microTilesPerEdge = 8; // 8 * 4 = 32
        // This array still determines the number of macro tiles and their base type/index
        const tileColors = [
            0x228B22, // Base for Forest Green (Grass) - Index 0
            0x8B4513, // Base for Saddle Brown (Dirt) - Index 1
            0xF4A460, // Base for Sandy Brown (Sand) - Index 2
            0x808080, // Base for Grey (Stone) - Index 3
            0x654321, // Placeholder for Tree Trunk (Brown) - Index 4
            0x006400, // Base for Tree Foliage (Dark Green) - Index 5
            0x00CD00, // Base for Bush Core Green - Index 6
            0x98FB98, // Base for Bush Core Light Green - Index 7
            0x008000, // Base for Bush Branch Left Green - Index 8
            0x008000, // Base for Bush Branch Right Green - Index 9
            0xFF4500, // Base for Bush Flower Accent Red - Index 10
            0xFFD700, // Base for Bush Flower Accent Yellow - Index 11
            0xFF0000, // Placeholder for FLOWER_RED - Index 12
            0xFFFF00, // Placeholder for FLOWER_YELLOW - Index 13
            0x006400, // FERN_BASE_GREEN - Index 14 (Dark Green)
            0x2E8B57, // FERN_FROND_LEFT - Index 15 (Sea Green)
            0x2E8B57, // FERN_FROND_RIGHT - Index 16 (Sea Green)
            0xFF0000, // MUSHROOM_RED_CAP - Index 17 (Red)
            0x8B4513, // MUSHROOM_BROWN_CAP - Index 18 (Saddle Brown)
            0xD2B48C, // MUSHROOM_STEM_LIGHT - Index 19 (Tan)
            0x2E8B57, // VINE_GREEN_1 - Index 20 (Sea Green base)
            0x3CB371, // VINE_GREEN_2 - Index 21 (Medium Sea Green base)
            // Add other new TILE_ID base colors here...
            // For TALL_GRASS_1, MOSS_PATCH, etc.
            0x006400, // TALL_GRASS_1 (Dark Green) - Index 22
            0x228B22, // TALL_GRASS_2 (Forest Green) - Index 23
            0x556B2F, // MOSS_PATCH (Dark Olive Green) - Index 24
            0x90EE90, // CLOVER_PATCH (Light Green) - Index 25
            0x8B4513, // FALLEN_LOG_HORIZONTAL (Saddle Brown) - Index 26
            0xFF0000, // BERRY_RED_ACCENT (Red) - Index 27
            0x0000FF, // BERRY_BLUE_ACCENT (Blue) - Index 28
            0x8B4513, // SHELF_FUNGI_BROWN (Saddle Brown) - Index 29
            0xFF8C00, // SHELF_FUNGI_ORANGE (Dark Orange) - Index 30
            0x006400, // BROADLEAF_PLANT_BASE (Dark Green) - Index 31
            0x228B22, // BROADLEAF_PLANT_TOP (Forest Green) - Index 32
        ];
        const textureWidth = tileSize * tileColors.length;
        const textureHeight = tileSize;
        if (this.scene.textures.exists(DYNAMIC_TILESET_KEY)) {
            console.log('Dynamic tileset texture already exists.');
            return;
        }
        console.log('Creating dynamic tileset texture with micro patterns...');
        const canvas = this.scene.textures.createCanvas(DYNAMIC_TILESET_KEY, textureWidth, textureHeight);
        if (!canvas) {
            console.error("Failed to create canvas texture for dynamic tileset.");
            return;
        }
        tileColors.forEach((baseColor, index) => {
            for (let microY = 0; microY < microTilesPerEdge; microY++) {
                for (let microX = 0; microX < microTilesPerEdge; microX++) {
                    let microTileColor;
                    if (index === Constants.TILE_IDS.SURFACE_FOREST) {
                        if ((microX + microY) % 2 === 0) {
                            microTileColor = 0x228B22; // Darker green
                        } else {
                            microTileColor = 0x32CD32; // Lighter green
                        }
                    } else if (index === Constants.TILE_IDS.UNDERGROUND_FOREST) {
                        if (Math.random() < 0.1) { // 10% chance of a darker speck
                            microTileColor = 0x5A3A1A;
                        } else {
                            microTileColor = 0x8B4513; // Main brown
                        }
                    } else if (index === Constants.TILE_IDS.SURFACE_DESERT) {
                        if ((microX % 3 === 0) && (microY % 2 === 0)) {
                            microTileColor = 0xCD853F;
                        } else {
                            microTileColor = 0xF4A460; // Lighter sand
                        }
                    } else if (index === Constants.TILE_IDS.UNDERGROUND_DESERT || index === Constants.TILE_IDS.DEEP_STONE) {
                        const baseGrey = 0x707070;
                        const variation = Math.floor(Math.random() * 4);
                        let finalGrey = baseGrey;
                        if (variation === 0) finalGrey = 0x606060;
                        else if (variation === 1) finalGrey = 0x707070;
                        else if (variation === 2) finalGrey = 0x808080;
                        else finalGrey = 0x888888;
                        microTileColor = finalGrey;
                    } else if (index === Constants.TILE_IDS.TREE_TRUNK) {
                        const darkBark = 0x5D4037; 
                        const midBark = 0x795548;
                        const lightBark = 0x8D6E63;
                        if (microX % 3 === 0) {
                            microTileColor = darkBark;
                        } else if (microX % 3 === 1) {
                            microTileColor = midBark;
                        } else {
                            microTileColor = lightBark;
                        }
                        if (Math.random() < 0.15) {
                            microTileColor = microTileColor === darkBark ? midBark : (microTileColor === midBark ? lightBark : darkBark);
                        }
                    } else if (index === Constants.TILE_IDS.TREE_FOLIAGE) {
                        const darkLeaf = 0x006400; // Dark green
                        const lightLeaf = 0x228B22; // Medium green
                        const transparentColor = 0xFF00FF; // Magenta for transparency
                        
                        // Simple random "clumpy" leaf pattern with transparency
                        const noiseVal = this.noise2D(microX * 0.8, microY * 0.8); // Using noise2D for pattern
                        if (noiseVal > 0.3) { // Dense part of leaf clump
                            microTileColor = Math.random() < 0.7 ? darkLeaf : lightLeaf;
                        } else if (noiseVal > -0.2) { // Sparser part / edges
                            microTileColor = Math.random() < 0.4 ? darkLeaf : lightLeaf;
                        } else { // Transparent gaps
                            microTileColor = transparentColor;
                        }
                        // Ensure edges are more likely to be transparent for a softer look
                        if (microX === 0 || microX === microTilesPerEdge - 1 || microY === 0 || microY === microTilesPerEdge - 1) {
                            if (Math.random() < 0.7) microTileColor = transparentColor;
                        }
                        // Add some more random transparency spots
                        if (Math.random() < 0.25 && microTileColor !== transparentColor) {
                            microTileColor = transparentColor;
                        }
                    } else if (index === Constants.TILE_IDS.BUSH_CORE_GREEN) {
                        const distFromCenter = Math.sqrt(Math.pow(microX - 3.5, 2) + Math.pow(microY - 3.5, 2));
                        if (distFromCenter > 3.8 && Math.random() < 0.6) microTileColor = 0xFF00FF; // More transparent edges
                        else if (distFromCenter > 3.0 && Math.random() < 0.3) microTileColor = 0xFF00FF; // Slightly transparent edges
                        else if (Math.random() < 0.65) microTileColor = 0x006400; // Dark green
                        else microTileColor = 0x228B22; // Medium green
                    } else if (index === Constants.TILE_IDS.BUSH_CORE_LIGHTGREEN) {
                        const distFromCenter = Math.sqrt(Math.pow(microX - 3.5, 2) + Math.pow(microY - 3.5, 2));
                        if (distFromCenter > 3.5 && Math.random() < 0.7) microTileColor = 0xFF00FF; // More transparent edges
                        else if (distFromCenter > 2.5 && Math.random() < 0.4) microTileColor = 0xFF00FF; // Sparseness
                        else if (Math.random() < 0.55) microTileColor = 0x32CD32; // Light green
                        else microTileColor = 0x90EE90; // Very light green
                    } else if (index === Constants.TILE_IDS.BUSH_BRANCH_LEFT_GREEN) {
                        if (microX < 4) { // Left half of the tile
                            // Make it slightly thinner at the very left and at top/bottom edges of the branch
                            if (microX === 0 && (microY < 2 || microY > 5)) microTileColor = 0xFF00FF;
                            else if (microX === 1 && (microY < 1 || microY > 6)) microTileColor = 0xFF00FF;
                            else if (microX === 3 && (microY < 1 || microY > 6) && Math.random() < 0.5) microTileColor = 0xFF00FF; // Taper towards core
                            else if (Math.random() < 0.6) microTileColor = 0x006400; // Dark green
                            else microTileColor = 0x228B22; // Medium green
                        } else {
                            microTileColor = 0xFF00FF; // Right half transparent
                        }
                    } else if (index === Constants.TILE_IDS.BUSH_BRANCH_RIGHT_GREEN) {
                        if (microX >= 4) { // Right half of the tile
                             if (microX === 7 && (microY < 2 || microY > 5)) microTileColor = 0xFF00FF;
                             else if (microX === 6 && (microY < 1 || microY > 6)) microTileColor = 0xFF00FF;
                             else if (microX === 4 && (microY < 1 || microY > 6) && Math.random() < 0.5) microTileColor = 0xFF00FF; // Taper towards core
                             else if (Math.random() < 0.6) microTileColor = 0x006400; // Dark green
                             else microTileColor = 0x228B22; // Medium green
                        } else {
                            microTileColor = 0xFF00FF; // Left half transparent
                        }
                    } else if (index === Constants.TILE_IDS.BUSH_FLOWER_ACCENT_RED) {
                        // Small 3x3 flower in the center of the 8x8 micro-grid
                        if (microX >= 2 && microX <= 4 && microY >= 2 && microY <= 4) {
                            if (microX === 3 && microY === 3) microTileColor = 0xFFFF00; // Yellow center
                            else if (Math.abs(microX - 3) + Math.abs(microY - 3) === 1) microTileColor = 0xFF0000; // Red petals (diamond)
                            else microTileColor = 0xDC143C; // Crimson corners
                        } else {
                            microTileColor = 0xFF00FF; // Transparent around flower
                        }
                    } else if (index === Constants.TILE_IDS.BUSH_FLOWER_ACCENT_YELLOW) {
                         // Small 3x3 flower in the center
                        if (microX >= 2 && microX <= 4 && microY >= 2 && microY <= 4) {
                            if (microX === 3 && microY === 3) microTileColor = 0xA52A2A; // Brown center
                            else if (Math.abs(microX - 3) + Math.abs(microY - 3) === 1) microTileColor = 0xFFFF00; // Yellow petals
                            else microTileColor = 0xFFD700; // Gold corners
                        } else {
                            microTileColor = 0xFF00FF; // Transparent around flower
                        }
                    }  else if (index === Constants.TILE_IDS.FLOWER_RED) {
                        // Red flower: 3x3 red petals, 1 yellow center, tiny green stem
                        const isPetal = (microX >= 2 && microX <= 4 && microY >= 1 && microY <= 3);
                        const isCenter = (microX === 3 && microY === 2);
                        const isStem = (microX === 3 && microY >= 4 && microY <= 7); // Extend stem to bottom
                        if (isCenter) {
                            microTileColor = 0xFFFF00; // Yellow center
                        } else if (isPetal) {
                            microTileColor = 0xFF0000; // Red petal
                        } else if (isStem) {
                            microTileColor = 0x00AA00; // Darker Green stem
                        } else {
                            microTileColor = 0xFF00FF; // Ensure this is the magenta for transparency
                        }
                    } else if (index === Constants.TILE_IDS.FLOWER_YELLOW) {
                        // Yellow flower: 3x3 yellow petals, 1 orange center, tiny green stem
                        const isPetal = (microX >= 2 && microX <= 4 && microY >= 1 && microY <= 3);
                        const isCenter = (microX === 3 && microY === 2);
                        const isStem = (microX === 3 && microY >= 4 && microY <= 7); // Extend stem to bottom
                        if (isCenter) {
                            microTileColor = 0xFFa500; // Orange center
                        } else if (isPetal) {
                            microTileColor = 0xFFFF00; // Yellow petal
                        } else if (isStem) {
                            microTileColor = 0x00AA00; // Darker Green stem
                        } else {
                            microTileColor = 0xFF00FF; // Ensure this is the magenta for transparency
                        }
                    } else if (index === Constants.TILE_IDS.FERN_BASE_GREEN) {
                        // Small cluster of dark green at bottom center
                        if (microY >= 6 && (microX >= 3 && microX <= 4)) {
                            microTileColor = 0x004D00; // Darker green
                        } else if (microY >=5 && microX === 3) {
                             microTileColor = 0x005A00; // Slightly lighter green
                        } else {
                            microTileColor = 0xFF00FF;
                        }
                    } else if (index === Constants.TILE_IDS.FERN_FROND_LEFT) {
                        // Leafy green, left half, curving up. Right half transparent.
                        // Simple diagonal frond shape
                        if (microX < 4 && (microX + microY >= 3 && microX + microY <= 6)) { // Main frond body
                            microTileColor = (microX + microY) % 2 === 0 ? 0x228B22 : 0x3CB371; // Forest Green / Medium Sea Green
                        } else if (microX < 3 && (microX + microY === 2 || microX + microY === 7)) { // Frond edges/tips
                             microTileColor = 0x20B2AA; // Light Sea Green
                        } else {
                            microTileColor = 0xFF00FF;
                        }
                    } else if (index === Constants.TILE_IDS.FERN_FROND_RIGHT) {
                        // Mirror of FERN_FROND_LEFT
                        const mirroredMicroX = microTilesPerEdge - 1 - microX;
                        if (mirroredMicroX < 4 && (mirroredMicroX + microY >= 3 && mirroredMicroX + microY <= 6)) {
                            microTileColor = (mirroredMicroX + microY) % 2 === 0 ? 0x228B22 : 0x3CB371;
                        } else if (mirroredMicroX < 3 && (mirroredMicroX + microY === 2 || mirroredMicroX + microY === 7)) {
                             microTileColor = 0x20B2AA;
                        } else {
                            microTileColor = 0xFF00FF;
                        }
                    } else if (index === Constants.TILE_IDS.MUSHROOM_RED_CAP) {
                        // Semi-circular red cap, shifted to bottom half of its tile
                        const centerX = 3.5, centerY = 5.5, radius = 3; // centerY was 1.5
                        const distSq = Math.pow(microX - centerX, 2) + Math.pow(microY - centerY, 2);
                        if (microY >= 4 && distSq <= radius * radius) { // microY condition was < 4
                            microTileColor = (distSq < radius * radius * 0.5) ? 0xDC143C : 0xFF0000; // Crimson / Red
                            // Add a few lighter spots
                            if (Math.random() < 0.15) microTileColor = 0xFF6347; // Tomato
                        } else {
                            microTileColor = 0xFF00FF;
                        }
                    } else if (index === Constants.TILE_IDS.MUSHROOM_BROWN_CAP) {
                        // Semi-circular brown cap, shifted to bottom half of its tile
                        const centerX = 3.5, centerY = 5.5, radius = 3; // centerY was 1.5
                        const distSq = Math.pow(microX - centerX, 2) + Math.pow(microY - centerY, 2);
                        if (microY >= 4 && distSq <= radius * radius) { // microY condition was < 4
                            microTileColor = (distSq < radius * radius * 0.5) ? 0x8B4513 : 0xA0522D; // SaddleBrown / Sienna
                            // Add a few lighter spots
                            if (Math.random() < 0.15) microTileColor = 0xD2691E; // Chocolate
                        } else {
                            microTileColor = 0xFF00FF;
                        }
                    } else if (index === Constants.TILE_IDS.MUSHROOM_STEM_LIGHT) {
                        // Thin vertical stem in center, 2 micro-tiles wide
                        if (microX >= 3 && microX <= 4 && microY >= 0 && microY < microTilesPerEdge) { // Full height stem
                            microTileColor = (microX === 3) ? 0xF5F5DC : 0xD2B48C; // Beige / Tan
                        } else {
                            microTileColor = 0xFF00FF;
                        }
                    } else if (index === Constants.TILE_IDS.VINE_GREEN_1) {
                        // Thin, slightly winding vertical vine segment. More sparse.
                        const vineCenterX = 3; // Center on microX=3
                        const vineWobble = Math.sin(microY * 0.5) * 1; // Sinusoidal wobble
                        if (Math.abs(microX - (vineCenterX + vineWobble)) < 1.5) { // Vine thickness around 1-2 pixels
                             microTileColor = (microY % 3 === 0) ? 0x2E8B57 : 0x3CB371; // Alternating shades
                             // Tiny leaves
                             if ((microY % 4 === 1 && microX < vineCenterX + vineWobble && Math.random() < 0.4) ||
                                 (microY % 4 === 3 && microX > vineCenterX + vineWobble && Math.random() < 0.4)) {
                                 microTileColor = 0x228B22; // Darker green for leaf
                             }
                        } else {
                            microTileColor = 0xFF00FF; // Transparent
                        }
                         // Ensure some transparency even on the vine itself for a "thinner" look
                        if (microTileColor !== 0xFF00FF && Math.random() < 0.2) {
                            microTileColor = 0xFF00FF;
                        }
                    } else if (index === Constants.TILE_IDS.VINE_GREEN_2) {
                        // Thicker, more leafy vertical vine segment.
                        const vineCenterX = 3.5; // Centered
                        const vineWobble = Math.cos(microY * 0.4) * 1.5;
                        if (Math.abs(microX - (vineCenterX + vineWobble)) < 2) { // Vine thickness around 2-3 pixels
                             microTileColor = (microY % 2 === 0) ? 0x3CB371 : 0x2E8B57; // Alternating shades
                             // More prominent leaves
                             if ((microY % 3 === 0 && Math.abs(microX - (vineCenterX + vineWobble -1)) < 1 && Math.random() < 0.6) ||
                                 (microY % 3 === 1 && Math.abs(microX - (vineCenterX + vineWobble +1)) < 1 && Math.random() < 0.6)) {
                                 microTileColor = 0x556B2F; // Dark Olive for denser leaf
                             }
                        } else {
                            microTileColor = 0xFF00FF; // Transparent
                        }
                        // Add small gaps in the vine
                        if (microTileColor !== 0xFF00FF && Math.random() < 0.15) {
                            microTileColor = 0xFF00FF;
                        }
                    } else if (index === Constants.TILE_IDS.TALL_GRASS_1) { // Dense base of grass
                        const baseGreen = 0x006400; // Dark green
                        const midGreen = 0x008000; // Medium green
                        const lightGreen = 0x228B22; // Forest green
                        // Denser at the bottom (microY > 4)
                        if (microY > 4) {
                            microTileColor = (microX + microY) % 3 === 0 ? baseGreen : midGreen;
                        } else if (microY > 2) {
                            microTileColor = (microX + microY) % 2 === 0 ? midGreen : lightGreen;
                        } else { // Sparser/lighter at the very top
                            if (Math.random() < 0.6) {
                                microTileColor = lightGreen;
                            } else {
                                microTileColor = 0xFF00FF; // Some transparency at the top edge
                            }
                        }
                         // Add vertical "blade" effect with slight transparency variation
                        if (microX % 2 === 0 && Math.random() < 0.15 && microY < 6) {
                           microTileColor = 0xFF00FF;
                        }
                    } else if (index === Constants.TILE_IDS.TALL_GRASS_2) { // Wispy top of grass with seed heads
                        const bladeGreen = 0x228B22; // Forest green for blades
                        const seedHeadYellow = 0xFFFF00; // Yellow for seed head
                        const transparentColor = 0xFF00FF;
                        // Mostly transparent
                        microTileColor = transparentColor;
                        // Thin vertical blades
                        if (microX === 2 || microX === 5 ) { // Two main blade columns
                            if (Math.random() > 0.3) { // 70% chance of being part of a blade
                                microTileColor = bladeGreen;
                            }
                        } else if (microX === 3 || microX === 4) { // Center, slightly sparser
                             if (Math.random() > 0.6) {
                                microTileColor = bladeGreen;
                             }
                        }
                        
                        // Small seed head at the very top (microY < 2)
                        if (microY < 2) {
                            if ((microX === 2 || microX === 5) && Math.random() < 0.4) { // Chance of seed head on main blades
                                microTileColor = seedHeadYellow;
                            } else if (microTileColor !== transparentColor && Math.random() < 0.15) { // Small chance for adjacent seed bits
                                microTileColor = seedHeadYellow;
                            }
                        }
                        
                        // Ensure it's very wispy - add more transparency randomly
                        if (microTileColor !== transparentColor && microTileColor !== seedHeadYellow && Math.random() < 0.75) {
                            microTileColor = transparentColor;
                        }
                         // Ensure top edge is mostly transparent or seed
                        if (microY === 0 && microTileColor === bladeGreen && Math.random() < 0.5) {
                            microTileColor = transparentColor;
                        }
                    } else if (index === Constants.TILE_IDS.MOSS_PATCH) {
                        const darkMossGreen = 0x556B2F; // Dark Olive Green
                        const darkerMossGreen = 0x4A5D23; // Even darker shade
                        const transparentColor = 0xFF00FF;
                        
                        const noiseVal = this.noise2D(microX * 0.6, microY * 0.6);
                        if (noiseVal > 0.1) { // Denser part of moss
                            microTileColor = Math.random() < 0.6 ? darkMossGreen : darkerMossGreen;
                        } else if (noiseVal > -0.4) { // Sparsely clumpy part
                            microTileColor = Math.random() < 0.3 ? darkMossGreen : transparentColor;
                        } else { // Mostly transparent
                            microTileColor = transparentColor;
                        }
                        // Ensure edges are a bit more transparent for a softer look
                        if ((microX < 2 || microX > 5 || microY < 2 || microY > 5) && Math.random() < 0.5) {
                            microTileColor = transparentColor;
                        }
                    } else if (index === Constants.TILE_IDS.CLOVER_PATCH) {
                        const cloverGreen = 0x32CD32; // Bright Lime Green
                        const transparentColor = 0xFF00FF;
                        microTileColor = transparentColor; // Default to transparent
                        // Define positions for two small clovers (each a 3-pixel group)
                        // Clover 1: center approx (2,2)
                        if ((microX === 2 && microY === 1) || (microX === 1 && microY === 2) || (microX === 3 && microY === 2)) {
                            microTileColor = cloverGreen;
                        }
                        // Clover 2: center approx (5,5)
                        if ((microX === 5 && microY === 4) || (microX === 4 && microY === 5) || (microX === 6 && microY === 5)) {
                            microTileColor = cloverGreen;
                        }
                        // Add a tiny bit more randomness to make it less uniform
                        if (microTileColor === cloverGreen && Math.random() < 0.1) {
                            microTileColor = transparentColor;
                        }
                        if (microTileColor === transparentColor && Math.random() < 0.03) { // very sparse single pixels
                             if ((microX > 0 && microX < 7 && microY > 0 && microY < 7) && // not on edge
                                !((microX === 2 && microY === 1) || (microX === 1 && microY === 2) || (microX === 3 && microY === 2)) &&
                                !((microX === 5 && microY === 4) || (microX === 4 && microY === 5) || (microX === 6 && microY === 5))
                             ) {
                                microTileColor = cloverGreen;
                             }
                        }
                    } else {
                        microTileColor = 0xff00ff; // Default magenta for any other unhandled macro tile types
                    }
                    
                    // For magenta (0xFF00FF), we skip drawing to make it transparent.
                    // For Phaser's canvas texture, not drawing means it remains transparent (alpha 0).
                    if (microTileColor !== 0xFF00FF) {
                        canvas.context.fillStyle = Phaser.Display.Color.ValueToColor(microTileColor).rgba;
                        canvas.context.fillRect(
                            index * tileSize + microX * microTileSize, // X pos of micro tile in atlas
                            microY * microTileSize,                    // Y pos of micro tile in atlas (relative to macro tile's top)
                            microTileSize,                             // Width of micro tile
                            microTileSize                              // Height of micro tile
                        );
                    }
                }
            }
            // Draw the border for the macro tile after all its micro tiles are drawn
            canvas.context.strokeStyle = '#000000'; // Black border
            canvas.context.lineWidth = 1;
            canvas.context.strokeRect(index * tileSize + 0.5, 0.5, tileSize - 1, tileSize - 1);
        });
        canvas.refresh();
        console.log('Dynamic tileset texture with micro patterns created.');
    }
    generate(chunkX, chunkY) {
        console.log(`Generating chunk (${chunkX}, ${chunkY}) for biome: ${this.config.biome}`);
        const chunkWidthTiles = Constants.CHUNK_WIDTH_TILES;
        const chunkHeightTiles = Constants.CHUNK_HEIGHT_TILES;
        // 1. Initialize data arrays for each layer
        const mainTerrain_data = [];
        const lowFlora_data = [];
        const canopy_data = [];
        for (let y = 0; y < chunkHeightTiles; y++) {
            mainTerrain_data[y] = new Array(chunkWidthTiles).fill(Constants.TILE_IDS.AIR);
            lowFlora_data[y] = new Array(chunkWidthTiles).fill(Constants.TILE_IDS.AIR);
            canopy_data[y] = new Array(chunkWidthTiles).fill(Constants.TILE_IDS.AIR);
        }
        // 2. Define Global Surface Level and Noise Parameters (was 4)
        const worldSurfaceLevelTiles = Constants.CHUNK_HEIGHT_TILES * 5 + Math.floor(Constants.CHUNK_HEIGHT_TILES / 2); // Align surface with player's starting chunk (Y=5)
        const noiseScaleX = 60; // Slightly smoother hills
        const amplitude = Constants.CHUNK_HEIGHT_TILES * 0.3;   // Reduced amplitude for less extreme hills initially.
        const surfaceDepth = 8; // A bit deeper surface layer (dirt/sand)
        const caveNoiseScale = 30; // Larger scale for caves, making them a bit broader and less frequent.
        const caveThreshold = 0.65; // Slightly higher threshold, making caves a bit rarer.
        const surfaceTileIndex = this.config.biome === 'forest' ? Constants.TILE_IDS.SURFACE_FOREST : Constants.TILE_IDS.SURFACE_DESERT;
        const undergroundTileIndex = this.config.biome === 'forest' ? Constants.TILE_IDS.UNDERGROUND_FOREST : Constants.TILE_IDS.UNDERGROUND_DESERT;
        // 5. Loop through chunk width/height, placing tiles based on noise
        for (let x = 0; x < chunkWidthTiles; x++) {
            const globalTileX = chunkX * chunkWidthTiles + x; // Calculate global X for continuous noise
            
            // Generate noise value between -1 and 1 for surface height
            const surfaceNoiseValue = this.noise2D(globalTileX / noiseScaleX, 50.5); // Using a fixed Y offset for surface noise seed
            
            // Calculate absolute terrain surface height at this global x coordinate
            const currentSurfaceHeightTiles = Math.round(worldSurfaceLevelTiles + surfaceNoiseValue * amplitude);
            for (let y = 0; y < chunkHeightTiles; y++) {
                const globalTileY = chunkY * chunkHeightTiles + y; // Calculate global Y for this tile
                let tileToPlace = Constants.TILE_IDS.AIR; // Default to air
                if (globalTileY > currentSurfaceHeightTiles) {
                    // This is underground
                    if (globalTileY <= currentSurfaceHeightTiles + surfaceDepth) {
                        tileToPlace = undergroundTileIndex; // Shallow underground (e.g., dirt)
                    } else {
                        tileToPlace = Constants.TILE_IDS.DEEP_STONE; // Deeper underground (e.g., stone)
                    }
                    // Cave Generation
                    // map noise from [-1, 1] to [0, 1]
                    const caveNoiseValue = (this.noise2D(globalTileX / caveNoiseScale, globalTileY / caveNoiseScale) + 1) / 2;
                    if (tileToPlace !== Constants.TILE_IDS.AIR && caveNoiseValue > caveThreshold) {
                         // Only carve caves in solid areas, not affecting surface too much directly.
                         // Add more checks if needed, e.g. don't carve caves too close to the surface.
                        if (globalTileY > currentSurfaceHeightTiles + 2) { // Ensure caves are at least 2 tiles below surface
                           tileToPlace = Constants.TILE_IDS.AIR; // Carve a cave
                        }
                    }
                } else if (globalTileY === currentSurfaceHeightTiles) {
                    tileToPlace = surfaceTileIndex; // This is the surface tile
                } else {
                    tileToPlace = Constants.TILE_IDS.AIR; // This is above ground (sky)
                }
                
                if (tileToPlace !== Constants.TILE_IDS.AIR) { // Only place non-air tiles explicitly for main terrain
                    mainTerrain_data[y][x] = tileToPlace;
                }
            }
        }
        // 3. Flora Generation (e.g., Trees in Forest Biome) (was 6)
        if (this.config.biome === 'forest') {
            const treeMinHeight = 3;
            const treeMaxHeight = 6; // Adjusted max height slightly
            const treePlacementChance = 0.8;
            // console.log(`Tree Gen for biome: ${this.config.biome} in C(${chunkX},${chunkY})`);
            
            for (let x = 0; x < chunkWidthTiles; x++) {
                const globalTileX_for_flora = chunkX * chunkWidthTiles + x;
                const surfaceNoiseValue_for_flora = this.noise2D(globalTileX_for_flora / noiseScaleX, 50.5);
                const globalSurfaceY_for_flora = Math.round(worldSurfaceLevelTiles + surfaceNoiseValue_for_flora * amplitude);
                
                const localSurfaceY = globalSurfaceY_for_flora - (chunkY * chunkHeightTiles);
                if (localSurfaceY < 0 || localSurfaceY >= chunkHeightTiles) {
                    continue;
                }
                const surfaceTileIndex = mainTerrain_data[localSurfaceY]?.[x];
                if (surfaceTileIndex === undefined || surfaceTileIndex !== Constants.TILE_IDS.SURFACE_FOREST) {
                    continue;
                }
                
                const firstTrunkSegmentY = localSurfaceY - 1;
                if (firstTrunkSegmentY < 0) {
                    continue;
                }
                if (Math.random() < treePlacementChance) {
                    const treeHeight = Math.floor(Math.random() * (treeMaxHeight - treeMinHeight + 1)) + treeMinHeight;
                    let canPlaceTree = true;
                    // Space check for trunk on mainTerrain_data
                    for (let h = 0; h < treeHeight; h++) {
                        const checkY = firstTrunkSegmentY - h;
                        if (checkY < 0) { 
                            canPlaceTree = false;
                            break;
                        }
                        const tileCheckIndex_main = mainTerrain_data[checkY]?.[x];
                        if (tileCheckIndex_main === undefined || tileCheckIndex_main !== Constants.TILE_IDS.AIR) {
                            canPlaceTree = false;
                            break;
                        }
                    }
                    
                    if (firstTrunkSegmentY - (treeHeight -1) < 0) { // Ensure trunk top isn't above chunk
                        canPlaceTree = false;
                    }
                    if (canPlaceTree) {
                        for (let h = 0; h < treeHeight; h++) {
                            const trunkY = firstTrunkSegmentY - h;
                            if (trunkY >=0) {
                                mainTerrain_data[trunkY][x] = Constants.TILE_IDS.TREE_TRUNK;
                            } else { break; }
                        }
                        const topTrunkTileYLocal = firstTrunkSegmentY - treeHeight + 1;
                        // console.log(`  -> Placed TRUNK at C(${chunkX},${chunkY}) Local(X:${x}, SurfaceY:${localSurfaceY}) Height:${treeHeight} TopTrunkYLocal:${topTrunkTileYLocal}`);
                        
                        // Place foliage on canopy_data
                        for (let fyOffset = -1; fyOffset <= 1; fyOffset++) {
                            for (let fxOffset = -1; fxOffset <= 1; fxOffset++) {
                                const foliageX = x + fxOffset;
                                const foliageY = (topTrunkTileYLocal - 2) + fyOffset;
                                if (foliageX >= 0 && foliageX < chunkWidthTiles && foliageY >= 0 && foliageY < chunkHeightTiles) {
                                    // Place foliage if the spot on canopy_data is AIR
                                    if (canopy_data[foliageY]?.[foliageX] === Constants.TILE_IDS.AIR) {
                                        canopy_data[foliageY][foliageX] = Constants.TILE_IDS.TREE_FOLIAGE;
                                    }
                                }
                            }
                        }
                    }
                } // End of tree placement
                // --- Procedural Bush Generation ---
                // Ensure we are on a valid surface and have space before trying to place a bush.
                // --- Procedural Bush Generation ---
                // surfaceTileIndex and localSurfaceY are already available from tree checks.
                if (surfaceTileIndex === Constants.TILE_IDS.SURFACE_FOREST) {
                    const bushBaseLocalY = localSurfaceY - 1;
                    if (bushBaseLocalY >= 0 && this.noise2D(globalTileX_for_flora * 0.15, chunkY * 0.15 + 150.0) > 0.65) {
                        let bushWidthTiles = 1 + Math.floor((this.noise2D(globalTileX_for_flora * 0.25, chunkY * 0.25 + 250.0) + 1) / 2 * 2);
                        bushWidthTiles = Math.max(1, Math.min(bushWidthTiles, 3));
                        let bushHeightTiles = 1 + Math.floor((this.noise2D(globalTileX_for_flora * 0.35, chunkY * 0.35 + 350.0) + 1) / 2 * 1);
                        bushHeightTiles = Math.max(1, Math.min(bushHeightTiles, 2));
                        const coreTileNoise = this.noise2D(globalTileX_for_flora * 0.45, chunkY * 0.45 + 450.0);
                        let coreTile = (coreTileNoise > 0) ? Constants.TILE_IDS.BUSH_CORE_GREEN : Constants.TILE_IDS.BUSH_CORE_LIGHTGREEN;
                        let canPlaceBush = true;
                        for (let wCheck = 0; wCheck < bushWidthTiles; wCheck++) {
                            const checkX = x + wCheck;
                            if (checkX >= chunkWidthTiles) { canPlaceBush = false; break; }
                            const tileOnMain_UnderBush = mainTerrain_data[localSurfaceY]?.[checkX];
                            if (tileOnMain_UnderBush === undefined || tileOnMain_UnderBush !== Constants.TILE_IDS.SURFACE_FOREST) {
                                canPlaceBush = false; break;
                            }
                            const tileOnMain_AtBushLevel = mainTerrain_data[bushBaseLocalY]?.[checkX];
                            if (tileOnMain_AtBushLevel !== Constants.TILE_IDS.AIR &&
                                tileOnMain_AtBushLevel !== Constants.TILE_IDS.TREE_TRUNK &&
                                tileOnMain_AtBushLevel !== Constants.TILE_IDS.SURFACE_FOREST && // Should be air or trunk mostly
                                tileOnMain_AtBushLevel !== Constants.TILE_IDS.SURFACE_DESERT) { // Cannot grow through solid rock
                                 if (tileOnMain_AtBushLevel === Constants.TILE_IDS.DEEP_STONE ||
                                     tileOnMain_AtBushLevel === Constants.TILE_IDS.UNDERGROUND_FOREST ||
                                     tileOnMain_AtBushLevel === Constants.TILE_IDS.UNDERGROUND_DESERT ) {
                                    canPlaceBush = false; break;
                                 }
                            }
                            const tileOnLowFlora_AtBushLevel = lowFlora_data[bushBaseLocalY]?.[checkX];
                            if (tileOnLowFlora_AtBushLevel === undefined || tileOnLowFlora_AtBushLevel !== Constants.TILE_IDS.AIR) {
                                canPlaceBush = false; break;
                            }
                        }
                        if (canPlaceBush) {
                            // Place Core Bush Tiles on lowFlora_data
                            for (let wOffset = 0; wOffset < bushWidthTiles; wOffset++) {
                                for (let hOffset = 0; hOffset < bushHeightTiles; hOffset++) {
                                    const placeX = x + wOffset;
                                    const placeY = bushBaseLocalY - hOffset;
                                    if (placeX < chunkWidthTiles && placeY >= 0) {
                                        if (lowFlora_data[placeY]?.[placeX] === Constants.TILE_IDS.AIR) {
                                            lowFlora_data[placeY][placeX] = coreTile;
                                        }
                                    }
                                }
                            }
                            // Add Branches on lowFlora_data
                            for (let hOffset = 0; hOffset < bushHeightTiles; hOffset++) {
                                const currentBranchY = bushBaseLocalY - hOffset;
                                if (currentBranchY < 0) continue;
                                if (this.noise2D(globalTileX_for_flora * 0.55, currentBranchY * 0.55 + 550.0) > 0.4) { // Left
                                    const branchActualX = x - 1;
                                    if (branchActualX >= 0 && lowFlora_data[currentBranchY]?.[branchActualX] === Constants.TILE_IDS.AIR) {
                                        lowFlora_data[currentBranchY][branchActualX] = Constants.TILE_IDS.BUSH_BRANCH_LEFT_GREEN;
                                    }
                                }
                                if (this.noise2D(globalTileX_for_flora * 0.65, currentBranchY * 0.65 + 650.0) > 0.4) { // Right
                                    const branchActualX = x + bushWidthTiles;
                                    if (branchActualX < chunkWidthTiles && lowFlora_data[currentBranchY]?.[branchActualX] === Constants.TILE_IDS.AIR) {
                                        lowFlora_data[currentBranchY][branchActualX] = Constants.TILE_IDS.BUSH_BRANCH_RIGHT_GREEN;
                                    }
                                }
                            }
                            // Add Flower Accents on lowFlora_data (overwriting core/branch parts)
                            for (let wOffset = 0; wOffset < bushWidthTiles; wOffset++) {
                                for (let hOffset = 0; hOffset < bushHeightTiles; hOffset++) {
                                    const currentFlowerX = x + wOffset;
                                    const currentFlowerY = bushBaseLocalY - hOffset;
                                    if (currentFlowerX < chunkWidthTiles && currentFlowerY >= 0) {
                                        const tileAtSpot_lowFlora = lowFlora_data[currentFlowerY]?.[currentFlowerX];
                                        if (tileAtSpot_lowFlora === Constants.TILE_IDS.BUSH_CORE_GREEN || tileAtSpot_lowFlora === Constants.TILE_IDS.BUSH_CORE_LIGHTGREEN) {
                                            if (this.noise2D(globalTileX_for_flora + currentFlowerX, currentFlowerY + 750.0) > 0.88) {
                                                const flowerTypeNoise = this.noise2D(globalTileX_for_flora + currentFlowerX, currentFlowerY + 850.0);
                                                const flowerTile = (flowerTypeNoise > 0) ? Constants.TILE_IDS.BUSH_FLOWER_ACCENT_RED : Constants.TILE_IDS.BUSH_FLOWER_ACCENT_YELLOW;
                                                lowFlora_data[currentFlowerY][currentFlowerX] = flowerTile;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } // End of bush generation
                // --- Single Tile Flower Generation ---
                // --- Single Tile Flower Generation on lowFlora_data ---
                if (surfaceTileIndex === Constants.TILE_IDS.SURFACE_FOREST) {
                    const flowerPlacementLocalY = localSurfaceY - 1;
                    if (flowerPlacementLocalY >= 0) {
                        if (this.noise2D(globalTileX_for_flora * 0.7, chunkY * 0.7 + 500.0) > -0.2) {
                            let canPlaceFlower = true;
                            const flowerType = (Math.random() < 0.5) ? Constants.TILE_IDS.FLOWER_RED : Constants.TILE_IDS.FLOWER_YELLOW;
                            const tileOnMain_AtFlowerLevel = mainTerrain_data[flowerPlacementLocalY]?.[x];
                            if (tileOnMain_AtFlowerLevel !== Constants.TILE_IDS.AIR &&
                                tileOnMain_AtFlowerLevel !== Constants.TILE_IDS.TREE_TRUNK &&
                                tileOnMain_AtFlowerLevel !== Constants.TILE_IDS.SURFACE_FOREST && // Allow on surface tile itself if air on lowflora
                                tileOnMain_AtFlowerLevel !== Constants.TILE_IDS.SURFACE_DESERT) {
                                 if (tileOnMain_AtFlowerLevel === Constants.TILE_IDS.DEEP_STONE ||
                                     tileOnMain_AtFlowerLevel === Constants.TILE_IDS.UNDERGROUND_FOREST ||
                                     tileOnMain_AtFlowerLevel === Constants.TILE_IDS.UNDERGROUND_DESERT ) {
                                    canPlaceFlower = false;
                                 }
                            }
                            if (lowFlora_data[flowerPlacementLocalY]?.[x] !== Constants.TILE_IDS.AIR) {
                                canPlaceFlower = false;
                            }
                            if (canPlaceFlower) {
                                lowFlora_data[flowerPlacementLocalY][x] = flowerType;
                                // console.log(`Placed FLOWER C(${chunkX},${chunkY}) Local(X:${x}, Y:${flowerPlacementLocalY}) Type: ${flowerType}`);
                            }
                        }
                    }
                } // End single flower
                // --- Fern Placement Logic ---
                if (surfaceTileIndex === Constants.TILE_IDS.SURFACE_FOREST) {
                    // Using a different noise channel for ferns
                    if (this.noise2D(globalTileX_for_flora * 0.8, chunkY * 0.8 + 600.0) > 0.45) { // Adjusted threshold
                        const fernBaseY = localSurfaceY - 1;
                        if (fernBaseY >= 0 && lowFlora_data[fernBaseY]?.[x] === Constants.TILE_IDS.AIR && mainTerrain_data[fernBaseY]?.[x] === Constants.TILE_IDS.AIR) {
                            lowFlora_data[fernBaseY][x] = Constants.TILE_IDS.FERN_BASE_GREEN;
                            // Optional: Add fronds with noise-based chance
                            // Left Frond
                            if (x > 0 && this.noise2D(globalTileX_for_flora * 1.1, chunkY * 1.1 + 610.0) > 0.3) {
                                const frondY = fernBaseY; // Can vary Y for fronds: fernBaseY - Math.floor(Math.random()*2);
                                if (frondY >= 0 && lowFlora_data[frondY]?.[x-1] === Constants.TILE_IDS.AIR && mainTerrain_data[frondY]?.[x-1] === Constants.TILE_IDS.AIR) {
                                    lowFlora_data[frondY][x-1] = Constants.TILE_IDS.FERN_FROND_LEFT;
                                }
                            }
                            // Right Frond
                            if (x < chunkWidthTiles - 1 && this.noise2D(globalTileX_for_flora * 1.2, chunkY * 1.2 + 620.0) > 0.3) {
                                const frondY = fernBaseY;
                                if (frondY >= 0 && lowFlora_data[frondY]?.[x+1] === Constants.TILE_IDS.AIR && mainTerrain_data[frondY]?.[x+1] === Constants.TILE_IDS.AIR) {
                                    lowFlora_data[frondY][x+1] = Constants.TILE_IDS.FERN_FROND_RIGHT;
                                }
                            }
                        }
                    }
                } // End Fern Placement
                // --- Mushroom Placement Logic ---
                if (surfaceTileIndex === Constants.TILE_IDS.SURFACE_FOREST) {
                     // Using another noise channel for mushrooms
                    if (this.noise2D(globalTileX_for_flora * 0.9, chunkY * 0.9 + 700.0) > 0.6) { // Adjusted threshold
                        const mushroomStemY = localSurfaceY - 1;
                        const mushroomCapY = localSurfaceY - 2;
                        if (mushroomCapY >= 0 && // Ensure cap is within bounds
                            lowFlora_data[mushroomStemY]?.[x] === Constants.TILE_IDS.AIR && mainTerrain_data[mushroomStemY]?.[x] === Constants.TILE_IDS.AIR &&
                            lowFlora_data[mushroomCapY]?.[x] === Constants.TILE_IDS.AIR && mainTerrain_data[mushroomCapY]?.[x] === Constants.TILE_IDS.AIR) {
                            
                            lowFlora_data[mushroomStemY][x] = Constants.TILE_IDS.MUSHROOM_STEM_LIGHT;
                            const capType = (this.noise2D(globalTileX_for_flora * 1.5, chunkY * 1.5 + 750.0) > 0) ? Constants.TILE_IDS.MUSHROOM_RED_CAP : Constants.TILE_IDS.MUSHROOM_BROWN_CAP;
                            lowFlora_data[mushroomCapY][x] = capType;
                            // Small chance for a cluster
                            if (this.noise2D(globalTileX_for_flora * 2.0, chunkY * 2.0 + 780.0) > 0.7) {
                                const side = (Math.random() < 0.5) ? -1 : 1;
                                const adjacentX = x + side;
                                if (adjacentX >= 0 && adjacentX < chunkWidthTiles &&
                                    lowFlora_data[mushroomStemY]?.[adjacentX] === Constants.TILE_IDS.AIR && mainTerrain_data[mushroomStemY]?.[adjacentX] === Constants.TILE_IDS.AIR &&
                                    lowFlora_data[mushroomCapY]?.[adjacentX] === Constants.TILE_IDS.AIR && mainTerrain_data[mushroomCapY]?.[adjacentX] === Constants.TILE_IDS.AIR) {
                                    
                                    lowFlora_data[mushroomStemY][adjacentX] = Constants.TILE_IDS.MUSHROOM_STEM_LIGHT;
                                    const adjacentCapType = (this.noise2D(globalTileX_for_flora + side * 1.5, chunkY * 1.5 + 760.0) > 0) ? Constants.TILE_IDS.MUSHROOM_RED_CAP : Constants.TILE_IDS.MUSHROOM_BROWN_CAP;
                                    lowFlora_data[mushroomCapY][adjacentX] = adjacentCapType;
                                }
                            }
                        }
                    }
                } // End Mushroom Placement
                // --- Tall Grass Placement Logic ---
                if (surfaceTileIndex === Constants.TILE_IDS.SURFACE_FOREST) {
                    // Using noise to determine if tall grass should grow here
                    if (this.noise2D(globalTileX_for_flora * 1.3, chunkY * 1.3 + 800.0) > 0.3) { // Adjusted noise parameters
                        const grassBaseY = localSurfaceY - 1; // TALL_GRASS_1 sits ON the surface, so its base is at localSurfaceY - 1
                        const grassTopY = localSurfaceY - 2;  // TALL_GRASS_2 is above TALL_GRASS_1
                        // Check if base location is suitable (AIR on lowFlora and mainTerrain, and not occupied by other flora)
                        if (grassBaseY >= 0 && lowFlora_data[grassBaseY]?.[x] === Constants.TILE_IDS.AIR && mainTerrain_data[grassBaseY]?.[x] === Constants.TILE_IDS.AIR) {
                            lowFlora_data[grassBaseY][x] = Constants.TILE_IDS.TALL_GRASS_1;
                            // Check if top location is suitable
                            if (grassTopY >= 0 && lowFlora_data[grassTopY]?.[x] === Constants.TILE_IDS.AIR && mainTerrain_data[grassTopY]?.[x] === Constants.TILE_IDS.AIR) {
                                lowFlora_data[grassTopY][x] = Constants.TILE_IDS.TALL_GRASS_2;
                            }
                        }
                    }
                } // End Tall Grass Placement
            } // End of X loop for flora
        } // End of forest biome check for flora
        console.log(`Chunk (${chunkX}, ${chunkY}) generation complete.`);
        // 4. Return the generated data arrays (was 7)
        return {
            mainTerrainData: mainTerrain_data,
            lowFloraData: lowFlora_data,
            canopyData: canopy_data
        };
    }
    // Helper methods can be added later for caves, resources etc.
}
export default WorldGenerator; // Make class available for import
