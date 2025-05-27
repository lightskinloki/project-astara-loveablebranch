// Game Constants
const Constants = {
    // World & Tile Configuration
    TILE_SIZE: 32,
    CHUNK_WIDTH_TILES: 32, // Width of a single chunk in tiles
    CHUNK_HEIGHT_TILES: 60, // Height of a single chunk in tiles
    TILE_IDS: {
        AIR: -1,
        SURFACE_FOREST: 0,
        UNDERGROUND_FOREST: 1,
        SURFACE_DESERT: 2,
        UNDERGROUND_DESERT: 3,
        DEEP_STONE: 3, // Currently same as UNDERGROUND_DESERT
        TREE_TRUNK: 4,
        TREE_FOLIAGE: 5,
        BUSH_CORE_GREEN: 6,
        BUSH_CORE_LIGHTGREEN: 7,
        BUSH_BRANCH_LEFT_GREEN: 8,
        BUSH_BRANCH_RIGHT_GREEN: 9,
        BUSH_FLOWER_ACCENT_RED: 10,
        BUSH_FLOWER_ACCENT_YELLOW: 11,
        FLOWER_RED: 12,
        FLOWER_YELLOW: 13,
        FERN_BASE_GREEN: 14,
        FERN_FROND_LEFT: 15,
        FERN_FROND_RIGHT: 16,
        MUSHROOM_RED_CAP: 17,
        MUSHROOM_BROWN_CAP: 18,
        MUSHROOM_STEM_LIGHT: 19,
        VINE_GREEN_1: 20,
        VINE_GREEN_2: 21,
        TALL_GRASS_1: 22, // base
        TALL_GRASS_2: 23, // top
        MOSS_PATCH: 24,
        CLOVER_PATCH: 25,
        FALLEN_LOG_HORIZONTAL: 26,
        BERRY_RED_ACCENT: 27,
        BERRY_BLUE_ACCENT: 28,
        SHELF_FUNGI_BROWN: 29,
        SHELF_FUNGI_ORANGE: 30,
        BROADLEAF_PLANT_BASE: 31,
        BROADLEAF_PLANT_TOP: 32,
    },
    // Player Physics & Movement
    PLAYER_SPEED: 200,
    JUMP_STRENGTH: -500, // Phaser uses negative Y for up
    GRAVITY: 1000,

    // Interaction
    MAX_INTERACTION_DISTANCE: 5, // In tiles

    // Biomes & Resources (Placeholders)
    BIOME_TYPES: ['forest', 'desert'],
    RESOURCE_TYPES: {
        forest: ['stone', 'dirt', 'wood'], // wood from surface_forest
        desert: ['stone', 'sand'] // sand from surface_desert, stone from underground_desert
    },

    // Health & Damage
    PLAYER_MAX_HEALTH: 100,
    TOXIC_DAMAGE_PER_FRAME: 0.1,
    ENEMY_CONTACT_DAMAGE_PER_SECOND: 1,

    // Enemy Config
    ENEMY_AGGRO_RANGE: 10, // In tiles
    ENEMY_SPEED: 100,
};

// Make constants available for import
export default Constants;
