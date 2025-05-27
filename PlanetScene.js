import Phaser from 'https://esm.sh/phaser@3.80.1';
import Constants from 'constants';
import WorldGenerator from 'WorldGenerator';
import Inventory from 'Inventory';
import UIManager from 'UIManager';

class PlanetScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PlanetScene' });
        this.player = null;
        this.cursors = null;
        this.map = null;
        this.mainTerrainLayer = null;
        this.canopyLayer = null;
        this.lowFloraLayer = null;
        this.inventory = null;
        this.uiManager = null;
        this.currentBiome = 'forest';
        this.worldGen = null;
        this.loadedChunks = new Map(); // Stores WORLD chunk keys "worldX,worldY"
        this.chunkLoadRadius = 2; // Load chunks within X chunks of the player (e.g., 2 means a 5x5 area around player's chunk)
        
        // Active map dimensions in chunks
        this.activeMapChunkWidth = (this.chunkLoadRadius * 2) + 1;
        this.activeMapChunkHeight = (this.chunkLoadRadius * 2) + 1;
        // Player's current WORLD chunk coordinates
        this.playerChunkX = 0; // Initialized in init()
        this.playerChunkY = 0; // Initialized in init()
        // World chunk coordinates of the top-left chunk represented by our activeMap (this.map/this.groundLayer)
        this.mapOriginWorldChunkX = 0;
        this.mapOriginWorldChunkY = 0;
        this.miningLaserLine = null; // Graphics object for the mining laser
        this.chunkDataCache = new Map(); // Cache for chunk tile data
        // this.playerDepth = 10; // Future use for player depth if needed dynamically
    }
    init(data) {
        this.currentBiome = data.planet || 'forest';
        // Initialize player's starting WORLD chunk coordinates
        this.playerChunkX = data.startChunkX || 50; // Default far from 0,0 to test infinite nature
        this.playerChunkY = data.startChunkY || 0;  // Player starts in world chunk Y=0.
                                                    // With worldSurfaceLevelTiles around CHUNK_HEIGHT_TILES * 1,
                                                    // this should mean the surface is generated within chunk Y=0 or Y=1.
        console.log(`Entering planet: ${this.currentBiome}. Player starting in world chunk: ${this.playerChunkX}, ${this.playerChunkY}`);
    }
    preload() {
        // We don't preload the tileset image here anymore,
        // as it's generated dynamically in WorldGenerator.
        console.log('PlanetScene preload');
        // Preload the player spritesheet for idle state
        // Asset: Cyborg_idle.png (192x48). Assuming 4 frames of 48x48.
        this.load.spritesheet('cyborg_idle', 'https://play.rosebud.ai/assets/Cyborg_idle.png?Uddz', { 
            frameWidth: 48, 
            frameHeight: 48 
        });
        // Preload the player spritesheet for running state
        // Asset: Cyborg_run.png (288x48). Assuming 6 frames of 48x48.
        this.load.spritesheet('cyborg_run', 'https://play.rosebud.ai/assets/Cyborg_run.png?TRXF', { 
            frameWidth: 48, 
            frameHeight: 48 
        });
        // Preload the player spritesheet for jumping state
        // Asset: Cyborg_jump.png (192x48). Assuming 4 frames of 48x48.
        this.load.spritesheet('cyborg_jump', 'https://play.rosebud.ai/assets/Cyborg_jump.png?pMuf', { 
            frameWidth: 48, 
            frameHeight: 48 
        });
        // Create a simple particle texture (e.g., a small white square)
        if (!this.textures.exists('particle_pixel')) {
            const particleSize = 4;
            const gfx = this.make.graphics({x:0, y:0, add:false});
            gfx.fillStyle(0xffffff, 1);
            gfx.fillRect(0, 0, particleSize, particleSize);
            gfx.generateTexture('particle_pixel', particleSize, particleSize);
            gfx.destroy();
        }
    }
    create() {
        console.log('PlanetScene create');
        // Calculate dimensions for the finite "active" tilemap
        const activeMapTotalWidthTiles = this.activeMapChunkWidth * Constants.CHUNK_WIDTH_TILES;
        const activeMapTotalHeightTiles = this.activeMapChunkHeight * Constants.CHUNK_HEIGHT_TILES;
        // Set up very large (conceptually infinite) physics and camera bounds
        // Player will collide with tiles, not these outer bounds primarily.
        const BIGNUM = Number.MAX_SAFE_INTEGER / 2; // A very large number
        this.physics.world.setBounds(-BIGNUM, -BIGNUM, BIGNUM * 2, BIGNUM * 2);
        this.cameras.main.setBounds(-BIGNUM, -BIGNUM, BIGNUM * 2, BIGNUM * 2);
        
        const bgColor = this.currentBiome === 'forest' ? '#87CEEB' : '#F0E68C';
        this.cameras.main.setBackgroundColor(bgColor);
        this.worldGen = new WorldGenerator(this, { biome: this.currentBiome });
        if (!this.textures.exists('dynamicTiles')) {
            this.worldGen.createDynamicTileset();
        }
        // Create the finite tilemap for our "active" area
        this.map = this.make.tilemap({
            tileWidth: Constants.TILE_SIZE,
            tileHeight: Constants.TILE_SIZE,
            width: activeMapTotalWidthTiles,
            height: activeMapTotalHeightTiles
        });
        const tileset = this.map.addTilesetImage('dynamicTiles', 'dynamicTiles', Constants.TILE_SIZE, Constants.TILE_SIZE, 0, 0);
        if (!tileset) {
            console.error("Failed to add dynamic tileset to the active map.");
            return;
        }
        this.mainTerrainLayer = this.map.createBlankLayer('MainTerrain', tileset, 0, 0, activeMapTotalWidthTiles, activeMapTotalHeightTiles);
        if (!this.mainTerrainLayer) {
            console.error("Failed to create main terrain layer for active map.");
            return;
        }
        this.mainTerrainLayer.setDepth(0);
        this.canopyLayer = this.map.createBlankLayer('Canopy', tileset, 0, 0, activeMapTotalWidthTiles, activeMapTotalHeightTiles);
        if (!this.canopyLayer) {
            console.error("Failed to create canopy layer for active map.");
            return;
        }
        this.canopyLayer.setDepth(15); // Above player, below UI
        this.lowFloraLayer = this.map.createBlankLayer('LowFlora', tileset, 0, 0, activeMapTotalWidthTiles, activeMapTotalHeightTiles);
        if (!this.lowFloraLayer) {
            console.error("Failed to create low flora layer for active map.");
            return;
        }
        this.lowFloraLayer.setDepth(5); // Between main terrain (0) and player (10)
        
        // Calculate initial player WORLD position
        const initialPlayerWorldX = this.playerChunkX * Constants.CHUNK_WIDTH_TILES * Constants.TILE_SIZE + (Constants.CHUNK_WIDTH_TILES * Constants.TILE_SIZE / 2);
        // Dynamic surface height query for player spawn Y
        const playerSpawnGlobalTileX = this.playerChunkX * Constants.CHUNK_WIDTH_TILES + Math.floor(Constants.CHUNK_WIDTH_TILES / 2);
        const noiseScaleX = 60; // Same as WorldGenerator
        const amplitude = Constants.CHUNK_HEIGHT_TILES * 0.3; // Same as WorldGenerator
        const worldSurfaceLevelTiles = Constants.CHUNK_HEIGHT_TILES * 5 + Math.floor(Constants.CHUNK_HEIGHT_TILES / 2); // Same as WorldGenerator
        
        const surfaceNoiseValue = this.worldGen.noise2D(playerSpawnGlobalTileX / noiseScaleX, 50.5); // Using the same Y offset for noise seed
        const calculatedSurfaceHeightTilesGlobal = Math.round(worldSurfaceLevelTiles + surfaceNoiseValue * amplitude);
        
        // Spawn player 3 tiles above this calculated surface
        const playerSpawnSurfaceWorldY = calculatedSurfaceHeightTilesGlobal * Constants.TILE_SIZE;
        const initialPlayerWorldY = playerSpawnSurfaceWorldY - (3 * Constants.TILE_SIZE); // 3 tiles above surface
        console.log(`Player Spawning: GlobalTileX: ${playerSpawnGlobalTileX}, Noise: ${surfaceNoiseValue.toFixed(3)}, Calculated Global Surface Tile Y: ${calculatedSurfaceHeightTilesGlobal}`);
        console.log(`Player Spawning: Surface World Y: ${playerSpawnSurfaceWorldY.toFixed(2)}, Player Spawn World Y: ${initialPlayerWorldY.toFixed(2)} (at ${this.playerChunkX}, ${this.playerChunkY})`);
        this.player = this.physics.add.sprite(initialPlayerWorldX, initialPlayerWorldY, 'cyborg_idle');
        this.player.setDepth(10); // Player renders above mainTerrainLayer, below canopyLayer
        const playerBodyWidth = 48 * 0.75;
        const playerBodyHeight = 48 * 0.9;
        this.player.body.setSize(playerBodyWidth, playerBodyHeight);
        const offsetX = (48 - playerBodyWidth) / 2;
        const offsetY = (48 - playerBodyHeight) / 2;
        this.player.body.setOffset(offsetX, offsetY);
        this.player.body.setCollideWorldBounds(true); // Collide with physics world bounds (which are now huge)
        this.player.health = Constants.PLAYER_MAX_HEALTH; // Initialize player health
        // Setup initial map origin and groundLayer position, then load initial chunks
        this.mapOriginWorldChunkX = this.playerChunkX - this.chunkLoadRadius;
        this.mapOriginWorldChunkY = this.playerChunkY - this.chunkLoadRadius;
        const mapOriginWorldPixelX = this.mapOriginWorldChunkX * Constants.CHUNK_WIDTH_TILES * Constants.TILE_SIZE;
        const mapOriginWorldPixelY = this.mapOriginWorldChunkY * Constants.CHUNK_HEIGHT_TILES * Constants.TILE_SIZE;
        this.mainTerrainLayer.setPosition(mapOriginWorldPixelX, mapOriginWorldPixelY);
        this.lowFloraLayer.setPosition(mapOriginWorldPixelX, mapOriginWorldPixelY);
        this.canopyLayer.setPosition(mapOriginWorldPixelX, mapOriginWorldPixelY);
        this.performFullChunkReload(); // Load initial set of chunks
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.physics.add.collider(this.player, this.mainTerrainLayer); // Player collides only with main terrain
        // Create animations (same as before)
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('cyborg_idle', { start: 0, end: 3 }),
            frameRate: 5, repeat: -1
        });
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('cyborg_run', { start: 0, end: 5 }),
            frameRate: 10, repeat: -1
        });
        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('cyborg_jump', { start: 0, end: 3 }),
            frameRate: 10, repeat: 0
        });
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) this.handleMining(pointer);
        });
        
        this.inventory = new Inventory();
        this.uiManager = new UIManager(this);
        this.uiManager.createHealthDisplay(this.player.health);
        this.uiManager.createInventoryDisplay(this.inventory.getInventoryState());
        this.miningLaserLine = this.add.graphics();
        this.input.on('pointerup', () => {
            if (this.miningLaserLine) this.miningLaserLine.clear();
        });
        this.player.anims.play('idle', true);
    }
    update(time, delta) {
        // Game loop logic - handle input, movement, collisions, AI, UI updates
        // Game loop logic - handle input, movement, collisions, AI, UI updates
        this.handlePlayerMovement();
        this.updatePlayerChunks(); // New method to manage chunk loading/unloading
        // Mining is now handled by pointerdown event
        // No need to clear laser here if we do it on pointerup
        // if (this.miningLaserLine) {
        //    this.miningLaserLine.clear(); // Clear laser each frame if not using pointerup
        // }
        // Update Enemies - TODO
        // Update UI - TODO
        // if (this.uiManager) this.uiManager.update();
    }
    updatePlayerChunks() {
        if (!this.player || !this.worldGen || !this.mainTerrainLayer || !this.lowFloraLayer || !this.canopyLayer) return;
        const playerWorldTileX = Math.floor(this.player.x / Constants.TILE_SIZE);
        const playerWorldTileY = Math.floor(this.player.y / Constants.TILE_SIZE);
        const newPlayerChunkX = Math.floor(playerWorldTileX / Constants.CHUNK_WIDTH_TILES);
        const newPlayerChunkY = Math.floor(playerWorldTileY / Constants.CHUNK_HEIGHT_TILES);
        if (newPlayerChunkX !== this.playerChunkX || newPlayerChunkY !== this.playerChunkY) {
            console.log(`Player entered new world chunk: Old (${this.playerChunkX},${this.playerChunkY}) -> New (${newPlayerChunkX},${newPlayerChunkY})`);
            this.playerChunkX = newPlayerChunkX;
            this.playerChunkY = newPlayerChunkY;
            const newMapOriginWorldChunkX = this.playerChunkX - this.chunkLoadRadius;
            const newMapOriginWorldChunkY = this.playerChunkY - this.chunkLoadRadius;
            if (newMapOriginWorldChunkX !== this.mapOriginWorldChunkX || newMapOriginWorldChunkY !== this.mapOriginWorldChunkY) {
                console.log(`Map origin shifted. Old (${this.mapOriginWorldChunkX},${this.mapOriginWorldChunkY}) -> New (${newMapOriginWorldChunkX},${newMapOriginWorldChunkY})`);
                this.mapOriginWorldChunkX = newMapOriginWorldChunkX;
                this.mapOriginWorldChunkY = newMapOriginWorldChunkY;
                // Reposition the layers to reflect the new origin
                const newMapOriginWorldPixelX = this.mapOriginWorldChunkX * Constants.CHUNK_WIDTH_TILES * Constants.TILE_SIZE;
                const newMapOriginWorldPixelY = this.mapOriginWorldChunkY * Constants.CHUNK_HEIGHT_TILES * Constants.TILE_SIZE;
                this.mainTerrainLayer.setPosition(newMapOriginWorldPixelX, newMapOriginWorldPixelY);
                this.lowFloraLayer.setPosition(newMapOriginWorldPixelX, newMapOriginWorldPixelY);
                this.canopyLayer.setPosition(newMapOriginWorldPixelX, newMapOriginWorldPixelY);
                this.performFullChunkReload();
            } else {
                // Player moved to a new chunk, but the map origin didn't need to shift.
                // This means we can do an incremental update.
                this.performIncrementalChunkUpdate();
            }
        }
    }
    performFullChunkReload() {
        console.log("Performing full chunk reload for active map.");
        // Clear the entire mainTerrainLayer and canopyLayer by filling it with TILE_AIR (-1)
        this.mainTerrainLayer.fill(-1, 0, 0, this.mainTerrainLayer.width, this.mainTerrainLayer.height);
        this.lowFloraLayer.fill(-1, 0, 0, this.lowFloraLayer.width, this.lowFloraLayer.height); 
        this.canopyLayer.fill(-1, 0, 0, this.canopyLayer.width, this.canopyLayer.height); 
        this.loadedChunks.clear();
        for (let dY = -this.chunkLoadRadius; dY <= this.chunkLoadRadius; dY++) {
            for (let dX = -this.chunkLoadRadius; dX <= this.chunkLoadRadius; dX++) {
                const worldChunkToLoadX = this.playerChunkX + dX;
                const worldChunkToLoadY = this.playerChunkY + dY;
                this.loadChunk(worldChunkToLoadX, worldChunkToLoadY);
                // loadChunk will add to this.loadedChunks
            }
        }
        this.mainTerrainLayer.setCollisionByExclusion([-1, Constants.TILE_IDS.TREE_FOLIAGE]);
        console.log("Full chunk reload complete. Loaded chunks:", Array.from(this.loadedChunks.keys()));
    }
    performIncrementalChunkUpdate() {
        console.log("Performing incremental chunk update.");
        let chunksChanged = false;
        const newChunksToKeep = new Set();
        // Determine which chunks to load
        for (let dY = -this.chunkLoadRadius; dY <= this.chunkLoadRadius; dY++) {
            for (let dX = -this.chunkLoadRadius; dX <= this.chunkLoadRadius; dX++) {
                const worldChunkToConsiderX = this.playerChunkX + dX;
                const worldChunkToConsiderY = this.playerChunkY + dY;
                const chunkKey = `${worldChunkToConsiderX},${worldChunkToConsiderY}`;
                newChunksToKeep.add(chunkKey);
                if (!this.loadedChunks.has(chunkKey)) {
                    this.loadChunk(worldChunkToConsiderX, worldChunkToConsiderY);
                    chunksChanged = true;
                }
            }
        }
        // Determine which chunks to unload
        const currentlyLoaded = Array.from(this.loadedChunks.keys());
        for (const loadedKey of currentlyLoaded) {
            if (!newChunksToKeep.has(loadedKey)) {
                const [worldCX, worldCY] = loadedKey.split(',').map(Number);
                this.unloadChunk(worldCX, worldCY);
                this.loadedChunks.delete(loadedKey); // unloadChunk now handles internal map marking
                chunksChanged = true;
            }
        }
        if (chunksChanged) {
            console.log("Incremental update changed chunks, updating collision map.");
            this.mainTerrainLayer.setCollisionByExclusion([-1, Constants.TILE_IDS.TREE_FOLIAGE]);
        }
        console.log("Incremental chunk update complete. Loaded chunks:", Array.from(this.loadedChunks.keys()));
    }
    loadChunk(worldChunkX, worldChunkY) {
        const worldChunkKey = `${worldChunkX},${worldChunkY}`;
        // Calculate local chunk coordinates within our finite groundLayer
        const localChunkX = worldChunkX - this.mapOriginWorldChunkX;
        const localChunkY = worldChunkY - this.mapOriginWorldChunkY;
        // Ensure the local chunk coordinates are within the bounds of our activeMap
        if (localChunkX < 0 || localChunkX >= this.activeMapChunkWidth ||
            localChunkY < 0 || localChunkY >= this.activeMapChunkHeight) {
            console.warn(`Attempted to load world chunk (${worldChunkX},${worldChunkY}) which is outside the current active map's local range. Local: (${localChunkX},${localChunkY}). This might be okay if map origin just shifted.`);
            return; // This chunk is not part of the current viewable active map area
        }
        
        console.log(`Loading world chunk (${worldChunkX},${worldChunkY}) into local chunk (${localChunkX},${localChunkY}) of active map.`);
        
        const targetLayerTileX = localChunkX * Constants.CHUNK_WIDTH_TILES;
        const targetLayerTileY = localChunkY * Constants.CHUNK_HEIGHT_TILES;
        let currentMainTerrainData, currentLowFloraData, currentCanopyData;
        if (this.chunkDataCache.has(worldChunkKey)) {
            console.log(`Cache hit for chunk ${worldChunkKey}. Loading from cache.`);
            const cachedData = this.chunkDataCache.get(worldChunkKey);
            currentMainTerrainData = cachedData.mainTerrainData;
            currentLowFloraData = cachedData.lowFloraData;
            currentCanopyData = cachedData.canopyData;
        } else {
            console.log(`Cache miss for chunk ${worldChunkKey}. Generating...`);
            const generationResult = this.worldGen.generate(worldChunkX, worldChunkY);
            if (generationResult) {
                currentMainTerrainData = generationResult.mainTerrainData;
                currentLowFloraData = generationResult.lowFloraData;
                currentCanopyData = generationResult.canopyData;
                this.chunkDataCache.set(worldChunkKey, generationResult);
                console.log(`Stored newly generated layered data for chunk ${worldChunkKey} in cache.`);
            } else {
                console.error(`Failed to generate data for world chunk ${worldChunkKey}`);
                // Fill with AIR if generation failed to prevent stale tiles
                for (let y_fill = 0; y_fill < Constants.CHUNK_HEIGHT_TILES; y_fill++) {
                    for (let x_fill = 0; x_fill < Constants.CHUNK_WIDTH_TILES; x_fill++) {
                        const targetX_fill = targetLayerTileX + x_fill;
                        const targetY_fill = targetLayerTileY + y_fill;
                        this.mainTerrainLayer.putTileAt(Constants.TILE_IDS.AIR, targetX_fill, targetY_fill);
                        this.lowFloraLayer.putTileAt(Constants.TILE_IDS.AIR, targetX_fill, targetY_fill);
                        this.canopyLayer.putTileAt(Constants.TILE_IDS.AIR, targetX_fill, targetY_fill);
                    }
                }
                this.loadedChunks.set(worldChunkKey, true); // Still mark as loaded to avoid re-attempting
                return; // Exit if generation failed
            }
        }
        // Now populate the visual layers using the determined data arrays
        for (let y_iter = 0; y_iter < Constants.CHUNK_HEIGHT_TILES; y_iter++) {
            for (let x_iter = 0; x_iter < Constants.CHUNK_WIDTH_TILES; x_iter++) {
                const targetX = targetLayerTileX + x_iter;
                const targetY = targetLayerTileY + y_iter;
                const mainTileIndex = currentMainTerrainData[y_iter] && currentMainTerrainData[y_iter][x_iter] !== undefined ? currentMainTerrainData[y_iter][x_iter] : Constants.TILE_IDS.AIR;
                this.mainTerrainLayer.putTileAt(mainTileIndex, targetX, targetY);
                const lowFloraTileIndex = currentLowFloraData[y_iter] && currentLowFloraData[y_iter][x_iter] !== undefined ? currentLowFloraData[y_iter][x_iter] : Constants.TILE_IDS.AIR;
                this.lowFloraLayer.putTileAt(lowFloraTileIndex, targetX, targetY);
                const canopyTileIndex = currentCanopyData[y_iter] && currentCanopyData[y_iter][x_iter] !== undefined ? currentCanopyData[y_iter][x_iter] : Constants.TILE_IDS.AIR;
                this.canopyLayer.putTileAt(canopyTileIndex, targetX, targetY);
            }
        }
        this.loadedChunks.set(worldChunkKey, true); // Mark as loaded
    }
    unloadChunk(worldChunkX, worldChunkY) {
        const worldChunkKey = `${worldChunkX},${worldChunkY}`;
        if (!this.loadedChunks.has(worldChunkKey)) {
            // console.warn(`Attempted to unload world chunk ${worldChunkKey} not in loadedChunks map.`);
            // This can happen if a full reload cleared it.
            return; 
        }
        const localChunkX = worldChunkX - this.mapOriginWorldChunkX;
        const localChunkY = worldChunkY - this.mapOriginWorldChunkY;
        console.log(`Unloading world chunk (${worldChunkX},${worldChunkY}) from local chunk (${localChunkX},${localChunkY}) of active map.`);
        // Ensure the local chunk coordinates are valid for the groundLayer
        if (localChunkX < 0 || localChunkX >= this.activeMapChunkWidth ||
            localChunkY < 0 || localChunkY >= this.activeMapChunkHeight) {
            console.warn(`World chunk (${worldChunkX},${worldChunkY}) to unload is outside current active map's local range. Local: (${localChunkX},${localChunkY}). No tile clearing needed from groundLayer.`);
            this.loadedChunks.delete(worldChunkKey); // Still remove from tracking
            return;
        }
        
        const targetLayerTileX = localChunkX * Constants.CHUNK_WIDTH_TILES;
        const targetLayerTileY = localChunkY * Constants.CHUNK_HEIGHT_TILES;
        for (let y = 0; y < Constants.CHUNK_HEIGHT_TILES; y++) {
            for (let x = 0; x < Constants.CHUNK_WIDTH_TILES; x++) {
                // Replace tile with an empty one
                this.mainTerrainLayer.putTileAt(Constants.TILE_IDS.AIR, targetLayerTileX + x, targetLayerTileY + y);
                this.lowFloraLayer.putTileAt(Constants.TILE_IDS.AIR, targetLayerTileX + x, targetLayerTileY + y);
                this.canopyLayer.putTileAt(Constants.TILE_IDS.AIR, targetLayerTileX + x, targetLayerTileY + y);
            }
        }
        this.loadedChunks.delete(worldChunkKey); // Remove from our tracking map
    }
    handlePlayerMovement() {
         if (!this.player || !this.cursors) return;
         // Horizontal Movement
         if (this.cursors.left.isDown) {
             this.player.body.setVelocityX(-Constants.PLAYER_SPEED);
             this.player.setFlipX(true); // Flip sprite to face left
             if (this.player.body.blocked.down) { // Only play walk if on ground
                 this.player.anims.play('walk', true);
             }
         } else if (this.cursors.right.isDown) {
             this.player.body.setVelocityX(Constants.PLAYER_SPEED);
             this.player.setFlipX(false); // Sprite faces right by default
             if (this.player.body.blocked.down) { // Only play walk if on ground
                 this.player.anims.play('walk', true);
             }
         } else {
             this.player.body.setVelocityX(0);
             if (this.player.body.blocked.down) { // Only play idle if on ground
                 this.player.anims.play('idle', true);
             }
         }
         // Jumping
         if (this.cursors.up.isDown && this.player.body.blocked.down) {
             this.player.body.setVelocityY(Constants.JUMP_STRENGTH);
             this.player.anims.play('jump', true); // Play jump animation
         }
         // If in the air and not playing jump (e.g., falling or after jump anim finishes)
         // you might want a specific 'falling' or 'airborne_idle' frame/animation.
         // For now, if no other horizontal movement dictates 'walk', it will revert to 'idle' when landing.
         // If the 'jump' animation finishes mid-air, and no other input, it might show its last frame or default to idle.
         // Let's ensure 'idle' only plays if on ground.
         if (!this.player.body.blocked.down && !this.cursors.left.isDown && !this.cursors.right.isDown && this.player.anims.currentAnim?.key !== 'jump') {
            // Optionally set to a specific frame for falling if 'jump' is done
            // For example, this.player.setFrame(desired_falling_frame_index_from_spritesheet);
            // Or a short 'falling' animation if you have one.
            // If 'jump' is non-looping, it will hold its last frame.
            // If we want to revert to 'idle' or a specific pose after 'jump' finishes mid-air, logic here.
            // For simplicity now, if player is falling and not moving horiz, and jump anim not playing,
            // we can let it show the last frame of jump or explicitly set an idle-like frame.
            // If 'jump' anim has repeat: 0, it will stay on its last frame until another anim is played.
         }
    }
    handleMining(pointer) {
        if (!this.player || !this.mainTerrainLayer || !this.lowFloraLayer || !this.canopyLayer || !this.map) return;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // Get tile coordinates LOCAL to the layers.
        // All layers (mainTerrain, lowFlora, canopy) are aligned and use the same world-to-tile conversion
        // because they share the same origin and tile size.
        const localTileX = this.mainTerrainLayer.worldToTileX(worldPoint.x); // Can use any layer here
        const localTileY = this.mainTerrainLayer.worldToTileY(worldPoint.y); // Can use any layer here
        
        // Check distance from player using WORLD tile coordinates
        const playerWorldTileX = Math.floor(this.player.x / Constants.TILE_SIZE);
        const playerWorldTileY = Math.floor(this.player.y / Constants.TILE_SIZE);
        const clickedWorldTileX = Math.floor(worldPoint.x / Constants.TILE_SIZE);
        const clickedWorldTileY = Math.floor(worldPoint.y / Constants.TILE_SIZE);
        const distance = Phaser.Math.Distance.Between(playerWorldTileX, playerWorldTileY, clickedWorldTileX, clickedWorldTileY);
        
        if (distance > Constants.MAX_INTERACTION_DISTANCE) {
            if (this.miningLaserLine) this.miningLaserLine.clear();
            return;
        }
        if (this.miningLaserLine) this.miningLaserLine.clear();
        const playerCenter = this.player.getCenter();
        // 1. Check Canopy Layer First
        const tileAtCanopy = this.canopyLayer.getTileAt(localTileX, localTileY);
        if (tileAtCanopy && tileAtCanopy.index === Constants.TILE_IDS.TREE_FOLIAGE) {
            const tilePixelWorldX = this.canopyLayer.x + tileAtCanopy.pixelX;
            const tilePixelWorldY = this.canopyLayer.y + tileAtCanopy.pixelY;
            const tileCenterWorldX = tilePixelWorldX + tileAtCanopy.width / 2;
            const tileCenterWorldY = tilePixelWorldY + tileAtCanopy.height / 2;
            this.miningLaserLine.lineStyle(2, 0x00ffaa, 0.8);
            this.miningLaserLine.beginPath();
            this.miningLaserLine.moveTo(playerCenter.x, playerCenter.y);
            this.miningLaserLine.lineTo(tileCenterWorldX, tileCenterWorldY);
            this.miningLaserLine.strokePath();
            
            const removedFoliage = this.canopyLayer.removeTileAt(localTileX, localTileY);
            if (removedFoliage) {
                this.updateChunkCacheWithMinedTile(clickedWorldTileX, clickedWorldTileY, Constants.TILE_IDS.AIR, 'canopy');
                this.inventory.addResource('leaves', 1);
                this.createMiningParticles(tileCenterWorldX, tileCenterWorldY, 0x006400);
                if (this.uiManager) this.uiManager.updateInventory(this.inventory.getInventoryState());
            }
            return; 
        }
        // 2. Check Low Flora Layer
        const tileAtLowFlora = this.lowFloraLayer.getTileAt(localTileX, localTileY);
        if (tileAtLowFlora && tileAtLowFlora.index !== Constants.TILE_IDS.AIR) {
            // Check if the tile on lowFloraLayer is one of the harvestable bush parts
            const isHarvestableLowFlora = [
                Constants.TILE_IDS.BUSH_CORE_GREEN,
                Constants.TILE_IDS.BUSH_CORE_LIGHTGREEN,
                Constants.TILE_IDS.BUSH_BRANCH_LEFT_GREEN,
                Constants.TILE_IDS.BUSH_BRANCH_RIGHT_GREEN,
                Constants.TILE_IDS.BUSH_FLOWER_ACCENT_RED,
                Constants.TILE_IDS.BUSH_FLOWER_ACCENT_YELLOW,
                Constants.TILE_IDS.FLOWER_RED,
                Constants.TILE_IDS.FLOWER_YELLOW,
                Constants.TILE_IDS.FERN_BASE_GREEN,
                Constants.TILE_IDS.FERN_FROND_LEFT,
                Constants.TILE_IDS.FERN_FROND_RIGHT,
                Constants.TILE_IDS.MUSHROOM_RED_CAP,
                Constants.TILE_IDS.MUSHROOM_BROWN_CAP,
                Constants.TILE_IDS.MUSHROOM_STEM_LIGHT,
                Constants.TILE_IDS.TALL_GRASS_1,
                Constants.TILE_IDS.TALL_GRASS_2
            ].includes(tileAtLowFlora.index);
            if (isHarvestableLowFlora) {
                const tilePixelWorldX = this.lowFloraLayer.x + tileAtLowFlora.pixelX;
                const tilePixelWorldY = this.lowFloraLayer.y + tileAtLowFlora.pixelY;
                const tileCenterWorldX = tilePixelWorldX + tileAtLowFlora.width / 2;
                const tileCenterWorldY = tilePixelWorldY + tileAtLowFlora.height / 2;
                this.miningLaserLine.lineStyle(2, 0x90EE90, 0.8); // Light green laser for low flora
                this.miningLaserLine.beginPath();
                this.miningLaserLine.moveTo(playerCenter.x, playerCenter.y);
                this.miningLaserLine.lineTo(tileCenterWorldX, tileCenterWorldY);
                this.miningLaserLine.strokePath();
                const removedLowFloraTile = this.lowFloraLayer.removeTileAt(localTileX, localTileY);
                if (removedLowFloraTile) {
                    this.updateChunkCacheWithMinedTile(clickedWorldTileX, clickedWorldTileY, Constants.TILE_IDS.AIR, 'lowFlora');
                    let resourceType = 'leaves'; // Default for most bush parts
                    let particleColor = 0x32CD32; // Default particle color for bush
                    if (removedLowFloraTile.index === Constants.TILE_IDS.BUSH_FLOWER_ACCENT_RED) {
                        resourceType = 'red_petals'; 
                        particleColor = 0xFF4500;
                    } else if (removedLowFloraTile.index === Constants.TILE_IDS.BUSH_FLOWER_ACCENT_YELLOW) {
                        resourceType = 'yellow_petals';
                        particleColor = 0xFFD700;
                    } else if (removedLowFloraTile.index === Constants.TILE_IDS.FLOWER_RED) {
                        resourceType = 'red_petals'; // Or a generic 'flower_red' if different from bush petals
                        particleColor = 0xFF0000;
                    } else if (removedLowFloraTile.index === Constants.TILE_IDS.FLOWER_YELLOW) {
                        resourceType = 'yellow_petals'; // Or a generic 'flower_yellow'
                        particleColor = 0xFFFF00;
                    } else if (removedLowFloraTile.index === Constants.TILE_IDS.FERN_BASE_GREEN ||
                               removedLowFloraTile.index === Constants.TILE_IDS.FERN_FROND_LEFT ||
                               removedLowFloraTile.index === Constants.TILE_IDS.FERN_FROND_RIGHT) {
                        resourceType = 'plant_fibers';
                        particleColor = 0x2E8B57; // Sea Green
                    } else if (removedLowFloraTile.index === Constants.TILE_IDS.MUSHROOM_RED_CAP) {
                        resourceType = 'red_mushroom';
                        particleColor = 0xFF0000; // Red
                    } else if (removedLowFloraTile.index === Constants.TILE_IDS.MUSHROOM_BROWN_CAP) {
                        resourceType = 'brown_mushroom';
                        particleColor = 0x8B4513; // Saddle Brown
                    } else if (removedLowFloraTile.index === Constants.TILE_IDS.MUSHROOM_STEM_LIGHT) {
                        resourceType = 'plant_fibers'; // Using plant_fibers for stems as well
                        particleColor = 0xD2B48C; // Tan
                    } else if (removedLowFloraTile.index === Constants.TILE_IDS.TALL_GRASS_1 ||
                               removedLowFloraTile.index === Constants.TILE_IDS.TALL_GRASS_2) {
                        resourceType = 'grass_blades';
                        particleColor = 0x228B22; // Forest Green
                    }
                    
                    this.inventory.addResource(resourceType, 1);
                    this.createMiningParticles(tileCenterWorldX, tileCenterWorldY, particleColor);
                    if (this.uiManager) this.uiManager.updateInventory(this.inventory.getInventoryState());
                }
                return; // Low flora handled, stop here.
            }
        }
        // 3. Check Main Terrain Layer (if no canopy or low flora was mined)
        const tileOnMain = this.mainTerrainLayer.getTileAt(localTileX, localTileY);
        if (tileOnMain && tileOnMain.index !== Constants.TILE_IDS.AIR) {
            const tilePixelWorldX = this.mainTerrainLayer.x + tileOnMain.pixelX;
            const tilePixelWorldY = this.mainTerrainLayer.y + tileOnMain.pixelY;
            const tileCenterWorldX = tilePixelWorldX + tileOnMain.width / 2;
            const tileCenterWorldY = tilePixelWorldY + tileOnMain.height / 2;
            this.miningLaserLine.lineStyle(2, 0x00ffff, 0.8);
            this.miningLaserLine.beginPath();
            this.miningLaserLine.moveTo(playerCenter.x, playerCenter.y);
            this.miningLaserLine.lineTo(tileCenterWorldX, tileCenterWorldY);
            this.miningLaserLine.strokePath();
            
            const removedMainTile = this.mainTerrainLayer.removeTileAt(localTileX, localTileY);
            if (removedMainTile) {
                this.updateChunkCacheWithMinedTile(clickedWorldTileX, clickedWorldTileY, Constants.TILE_IDS.AIR, 'main');
                
                let resourceType = null;
                const particleOriginX = tileCenterWorldX;
                const particleOriginY = tileCenterWorldY;
                switch(removedMainTile.index) {
                    case Constants.TILE_IDS.SURFACE_FOREST: resourceType = 'wood'; this.createMiningParticles(particleOriginX, particleOriginY, 0x228B22); break;
                    case Constants.TILE_IDS.UNDERGROUND_FOREST: resourceType = 'dirt'; this.createMiningParticles(particleOriginX, particleOriginY, 0x8B4513); break;
                    case Constants.TILE_IDS.SURFACE_DESERT: resourceType = 'sand'; this.createMiningParticles(particleOriginX, particleOriginY, 0xF4A460); break;
                    case Constants.TILE_IDS.UNDERGROUND_DESERT: resourceType = 'stone'; this.createMiningParticles(particleOriginX, particleOriginY, 0x808080); break;
                    case Constants.TILE_IDS.DEEP_STONE: resourceType = 'stone'; this.createMiningParticles(particleOriginX, particleOriginY, 0x707070); break;
                    case Constants.TILE_IDS.TREE_TRUNK: resourceType = 'wood'; this.createMiningParticles(particleOriginX, particleOriginY, 0x654321); break;
                    // Foliage/LowFlora should be handled above
                    default: 
                        console.log(`Unknown main tile type mined: ID ${removedMainTile.index}`);
                        this.createMiningParticles(particleOriginX, particleOriginY, 0xffffff);
                }
                if (resourceType && this.inventory) {
                    this.inventory.addResource(resourceType, 1);
                    if (this.uiManager) {
                        this.uiManager.updateInventory(this.inventory.getInventoryState());
                    }
                }
                this.mainTerrainLayer.setCollisionByExclusion([Constants.TILE_IDS.AIR, Constants.TILE_IDS.TREE_FOLIAGE]);
            }
        }
    }
    updateChunkCacheWithMinedTile(worldTileX, worldTileY, newTileId = Constants.TILE_IDS.AIR, layerHint = 'main') { // layerHint can be 'main', 'lowFlora', or 'canopy'
        const minedChunkX = Math.floor(worldTileX / Constants.CHUNK_WIDTH_TILES);
        const minedChunkY = Math.floor(worldTileY / Constants.CHUNK_HEIGHT_TILES);
        const minedChunkKey = `${minedChunkX},${minedChunkY}`;
        if (this.chunkDataCache.has(minedChunkKey)) {
            const chunkCacheEntry = this.chunkDataCache.get(minedChunkKey);
            const tileXInChunk = worldTileX - (minedChunkX * Constants.CHUNK_WIDTH_TILES);
            const tileYInChunk = worldTileY - (minedChunkY * Constants.CHUNK_HEIGHT_TILES);
            let targetDataArray;
            if (layerHint === 'canopy') {
                targetDataArray = chunkCacheEntry.canopyData;
            } else if (layerHint === 'lowFlora') {
                targetDataArray = chunkCacheEntry.lowFloraData;
            } else { // Default to main terrain
                targetDataArray = chunkCacheEntry.mainTerrainData;
            }
            if (targetDataArray && targetDataArray[tileYInChunk] && targetDataArray[tileYInChunk][tileXInChunk] !== undefined) {
                targetDataArray[tileYInChunk][tileXInChunk] = newTileId; // Set to AIR
                console.log(`Updated cache for chunk ${minedChunkKey} on layer '${layerHint}' at [${tileYInChunk}][${tileXInChunk}] to ${newTileId}.`);
            } else {
                console.warn(`Cache integrity issue for mined tile on layer '${layerHint}' at [${tileYInChunk}][${tileXInChunk}] in chunk ${minedChunkKey}.`);
            }
        } else {
            console.warn(`Mined tile in chunk ${minedChunkKey}, but this chunk was not in chunkDataCache.`);
        }
    }
    createMiningParticles(worldX, worldY, tintColor) { // Takes world coordinates now
        if (!this.textures.exists('particle_pixel')) return;
        
        const particles = this.add.particles(worldX, worldY, 'particle_pixel', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 }, // Emit in all directions
            scale: { start: 1, end: 0 },
            lifespan: { min: 200, max: 500 },
            quantity: 10, // Number of particles in the burst
            blendMode: 'ADD', // Brighter particles
            tint: tintColor, // Color based on the mined tile
            emitting: false // Start off, then explode
        });
        
        particles.explode(10); // Emit all particles at once
        // Automatically destroy the emitter after a short delay
        this.time.delayedCall(600, () => {
            particles.destroy();
        });
    }
    // createPlayerTexture(key) { ... } // This method is no longer needed
    // Add other methods for mining, building, enemy updates etc. later
}
export default PlanetScene;
