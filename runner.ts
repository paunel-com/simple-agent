import {spawn} from 'child_process';
import {join} from 'path';
import jwt from 'jsonwebtoken';

const ERROR_MSG = 'error in running scripts in vm';

const INVALID_PATH_CHARS = /[./\\]/;

export function executeRunner({runner, kind, sub, env, hookUrl, hookToken}) {

  if (INVALID_PATH_CHARS.test(runner) || INVALID_PATH_CHARS.test(kind)) {
    return;
  }

  let hasError = false;

  // execute the runner on another process
  const runnerPath = join('runners/kinds', kind, `${runner}.ts`);
  spawn(`tsx`, runnerPath.split(' '), {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
  })
    .on('close', () => {
      // update the hook url when the runner finished
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