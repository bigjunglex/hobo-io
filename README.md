## Easy to run io sample game
### Drop on any server, run docker compose and enjoy peak gaming

Heavily inspired by [Victor Zhou](https://victorzhou.com/blog/) blog post about io game development

## WORK IN PROGRESS
## to check working version with JSON messaging go to JSON branch

### Start up: 
```cd code && npm install```

```USER=$(id -u):$(id -g) docker compose up```

### Status: 

- Main working;
- Socket.io_drop branch  WIP 🚧 - main problem is huje packets (up to 10kb/update on smoke tests), changing messaging

### Test:
``` npm run test50```
- naive test with 200 connections

#### Built with 
* WebSockets: 
    - [Socket.io](https://socket.io/)
    - [uWebSockets.js](https://github.com/uNetworking/uWebSockets.js)
    - [uWebSockets-express](https://github.com/colyseus/uWebSockets-express)
* Render - [Kaplay](https://kaplayjs.com/)
* Assets : 
    [Kaplay/Crew](https://kaplayjs.com/crew/) & [Poof](https://opengameart.org/content/poof-effect-spritesheet) by [jellyfizh](https://opengameart.org/users/jellyfizh)