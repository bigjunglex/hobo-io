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
        TOP_SCORES: 'top_scores',
    }, // remove after socket.io drop finish
    
    TICK_RATE: 1000 / 40,

    NOTIFY_CHANNEL: 'general',

    MAP_SIZE:3000,
    MAP_SIZE_SQ: 3000 ** 2,

    PLAYER_RADIUS: 25,
    PLAYER_MAX_HP: 1000,
    PLAYER_SPEED: 400,
    PLAYER_FIRE_COOLDOWN: 0.4,
    
    BULLET_RADIUS: 3,
    BULLET_SPEED: 800,
    
    BULLET_DAMAGE: 10,
    MELEE_DAMAGE: 30,
    FLAME_DAMAGE: 50,

    BASE_HAZARD_COUNT: 10,

    HAZARD_RADIUS: 15,
    HAZARD_WALL_SIZE: 5,

    HAZARD_BOOST_HEAL: 200,

    HAZARD_BOOST_DURATION: 3000,
    HAZARD_SHIELD_DURATION: 7000,

    SCORE_BULLET_HIT: 20,
    SCORE_PER_SECOND: 1,
    
    CAMER_FLASH_COLOR: '#ff8282',
    
    EVENTS_DURATION: {
        PLAYERS: 8000,
        HAZARDS: 10_000
    },


    PLAYER_SPRITES: ['bean', 'mark', 'ghosty', 'zombean'],
    /**
     * UINT16 max size
     */
    MAX_ID:  65535,
} as const;

export enum HAZARDS {
    Mushroom,
    Portal,
    Spider_Web,
    Steel,
    Flame
}

export enum EFFECTS {
    Null,
    Boost,
    Shield
}

export enum EVENTS {
    Null,
    SLOW_DOWN,
    WEB_WARP,
    FIRE_FORMATION,
    PORTAL_PROPHECY,
    MUSHROOM_MADNESS,
    SHIELD_SLAM,
}

export default CONSTANTS;