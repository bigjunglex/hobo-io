## Easy to run io sample game
### Drop on any server, run docker compose and enjoy peak gaming

Heavily inspired by [Victor Zhou](https://victorzhou.com/blog/) blog post about io game development

## CURRENT VERISON: SOCKET.IO + JSON messaging
to use binary messaging without socket.io go to main branch

### Start up: 
```cd code && npm install```

```USER=$(id -u):$(id -g) docker compose up```


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