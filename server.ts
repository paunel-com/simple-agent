import {createServer} from 'http';
import jwt from 'jsonwebtoken';
import {ACCESS_TOKEN, PORT} from './server-config';
import {executeRunner} from './runner';
import {getMachine, getRegistry} from './services/local-storage.service';

const server = createServer(async (req, res) => {
  let payload;
  let hookUrl: string = '';
  let hookToken: string = '';
  let sub: string;

  // verify authorization token
  try {
    payload = jwt.verify(req.headers.authorization.split(' ')[1], ACCESS_TOKEN);

    hookUrl = payload.hookUrl;
    hookToken = payload.hookToken;
    sub = payload.sub;
  } catch {
    res.writeHead(401);
    res.end('NOT AUTHORIZED');
    return;
  }

  // read the body
  const buffers = [];
  let data: any = {};
  try {
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    data = JSON.parse(Buffer.concat(buffers).toString());
  } catch {
    res.writeHead(400);
    res.end('DATA NOT VALID');
    return;
  }

  const {app, apps, vm, registry, script, runner, kind} = data;

  const env = {
    ...process.env,
    APP: JSON.stringify(app || 'null'),
    APPS: JSON.stringify(apps || 'null'),
    VM: JSON.stringify(getMachine(vm?.identifier) || vm || 'null'),
    REGISTRY: JSON.stringify(getRegistry(registry?.identifier) || registry || 'null'),
    SCRIPT: JSON.stringify(script),
  }

  // execute the runner
  try {
    await executeRunner({runner, kind, sub, env, hookUrl, hookToken});
    res.writeHead(200);
    res.end('success');
  } catch (err) {
    res.writeHead(500);
    res.end('failed')
    console.log(err);
  }
});

server.listen(PORT, () => {
  console.log('listening on port', PORT)
});