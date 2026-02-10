## Easy to run io sample game
### Drop on any server, run docker compose and enjoy peak gaming

Heavily inspired by [Victor Zhou](https://victorzhou.com/blog/) blog post about io game development



### Start up: 
```cd code && npm install```

```USER=$(id -u):$(id -g) docker compose up```

#### to check working version with JSON messaging go to JSON branch

### Status: 
Branches:
- main - working with binary messages without socket.io, to reduce bandwidth;
- JSON - json messging through [Socket.io](https://socket.io/) + [msgpack](https://msgpack.org/);

### Test:
``` npm run test50```
- naive test with 200 connections


#### Built with 
* WebSockets: 
    - [uWebSockets.js](https://github.com/uNetworking/uWebSockets.js)
    - [uWebSockets-express](https://github.com/colyseus/uWebSockets-express)
* Render: [Kaplay](https://kaplayjs.com/)
* Assets : 
    [Kaplay/Crew](https://kaplayjs.com/crew/) & [Poof](https://opengameart.org/content/poof-effect-spritesheet) by [jellyfizh](https://opengameart.org/users/jellyfizh)