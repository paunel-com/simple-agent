import {spawn} from 'child_process';
import jwt from 'jsonwebtoken';

const ERROR_MSG = 'error in running scripts in vm';

export function executeRunner({runner, sub, env, hookUrl, hookToken}) {
  let hasError = false;
  spawn(`tsx`, `runners/${runner}.ts`.split(' '), {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
  })
    .on('close', () => {
      fetch(hookUrl, {
        headers: {authorization: 'Bearer ' + jwt.sign({runner, sub}, hookToken), 'Content-Type': 'application/json'},
        body: JSON.stringify({success: !hasError})
      }).catch(() => null);
    })
    .stdout
    .on('data', (data = '') => {
      if (!hasError && data.toString().includes(ERROR_MSG)) {
        hasError = true;
      }
    });
}