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
- current [ WIP ] - aoi-threads - moving AOI managment and packet creation to workerthreads, since its the main CPU heavy bottleneck on high (600+ players) loads 

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


### ideas + thoughs on improvments

- [X] Broad phase collision
- [ ] websocket HOL blocking (on packet drop) mitagation with backup connection pool
- [ ] Some sort of auth
- [ ] Gate server for networking and serialization, mb add room manager?
- [X] Skip late ticks - turns out its bad idea to skip late simulation frames
- [ ] Delta compression on updates + other bandwidth shortag
- [ ] worker threads server side for Area of Interest managment