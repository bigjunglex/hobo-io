## Easy to run io sample game
### Drop on any server, run docker compose and enjoy peak gaming

Heavily inspired by [Victor Zhou](https://victorzhou.com/blog/) blog post about io game development

### Start up: 
```cd code && npm install```

```USER=$(id -u):$(id -g) docker compose up```


### Test:
``` npm run test50```
- naive test with 200 connections

#### Built with 
* WebSockets - [Socket.io](https://socket.io/)
* Render - [Kaplay](https://kaplayjs.com/)
* Assets - [Kaplay/Crew](https://kaplayjs.com/crew/)