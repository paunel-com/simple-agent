# Paunel Simple Agent

## Getting started
```bash
export ACCESS_TOKEN=your-jwt-token
export PORT=6666
$ npm start
```

## Call from another service (internally)

```js

fetch('http://127.0.0.1:6666', {
  headers: {
    authorization: 'Bearer ' + jwt.parse({hookUrl: 'your-reply-url-when-runner-finished', hookToken: 'reply-jwt-token'}, ACCESS_TOKEN);
  },
  body: JSON.stringify({
    kind: 'docker',
    runner: 'deploy-app',
    registry: { ... },
    vm: { ... },
    app: { ... } 
  })
})
```

