const CONSTANTS = {
    MSG_TYPES: {
        GAME_UPDATE: 'udpate',
        GAME_OVER: 'dead',
        INPUT: 'input',
        JOIN_GAME: 'join_game',
        CHAT_MESSAGE: 'chat_message',
        NOTIFY_JOIN: 'notify_join',
        NOTIFY_LEFT: 'notify_left',
        NOTIFY_EVENT: 'notify_event',
    },
    
    MAP_SIZE:3000,
    MAP_SIZE_SQ: 3000 ** 2,

    PLAYER_RADIUS: 25,
    PLAYER_MAX_HP: 1000,
    PLAYER_SPEED: 400,
    PLAYER_FIRE_COOLDOWN: 0.4,

    PLAYER_EFFECT_BOOST: 'boost',
    PLAYER_EFFECT_SHIELD: 'shield',
    
    BULLET_RADIUS: 3,
    BULLET_SPEED: 800,
    
    BULLET_DAMAGE: 10,
    MELEE_DAMAGE: 30,
    FLAME_DAMAGE: 50,

    BASE_HAZARD_COUNT: 10,

    HAZARD_RADIUS: 15,
    HAZARD_WALL_SIZE: 5,

    HAZARD_WEB_SPRITE: 'spider_web',
    HAZARD_PORTAL_SPRITE: 'portal',
    HAZARD_BOOST_SPRITE: 'mushroom',
    HAZARD_SHIELD_SPRITE: 'steel',
    HAZARD_FLAME_SPRITE: 'flame',

    HAZARD_BOOST_DURATION: 3000,
    HAZARD_SHIELD_DURATION: 7000,

    SCORE_BULLET_HIT: 20,
    SCORE_PER_SECOND: 1,
    
    CAMER_FLASH_COLOR: '#ff8282',
    
    EVENTS_DURATION: {
        SLOWDOWN: 8000,
    }

    /**
     * contanst for spatial hash grid realiztions
     * but atm biggest bottleneck on performance is player.forEach socket.emit() on update
     * createUpdate and applyCollision suprisingly low on cpu time, judging from debugger
     */
    // BOUNDS: {
    //     maxX: 3000,
    //     maxY: 3000,
    //     minY: 0,
    //     minX: 0,
    // },

    // DIMENSIONS: {
        
    // }
} as const;

export default CONSTANTS;