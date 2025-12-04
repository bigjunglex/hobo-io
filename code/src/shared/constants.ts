const CONSTANTS = {
    MSG_TYPES: {
        GAME_UPDATE: 'udpate',
        GAME_OVER: 'dead',
        INPUT: 'input',
        JOIN_GAME: 'join_game'
    },
    
    MAP_SIZE:3000,

    PLAYER_RADIUS: 25,
    PLAYER_MAX_HP: 100,
    PLAYER_SPEED: 400,
    PLAYER_FIRE_COOLDOWN: 0.4,

    BULLET_RADIUS: 3,
    BULLET_SPEED: 800,
    BULLET_DAMAGE: 10,

    HAZARD_RADIUS: 30,
    HAZARD_WEB_SPRITE: 'spider_web',

    SCORE_BULLET_HIT: 20,
    SCORE_PER_SECOND: 1,
    
} as const;

export default CONSTANTS;