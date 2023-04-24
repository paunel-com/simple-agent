# Paunel Simple Agent

## Getting started
```bash
export ACCESS_TOKEN=your-jwt-token
export PORT=4444
$ npm start
```

## Call from another service (internally)

```js

fetch('http://127.0.0.1:4444', {
  headers: {
    authorization: 'Bearer ' + jwt.sign({hookUrl: 'your-reply-url-when-runner-finished', hookToken: 'reply-jwt-token'}, ACCESS_TOKEN);
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

