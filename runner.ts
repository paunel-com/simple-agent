import { spawn } from 'node:child_process';
import { join } from 'node:path';
import jwt from 'jsonwebtoken';
import logger from './services/logger';

const ERROR_MESSAGES = ['failed to login to machine', 'error in running scripts in vm'];

const INVALID_PATH_CHARS = /[./\\]/;

export function executeRunner({ runner, kind, sub, env, hookUrl, hookToken }) {

  logger.log('executing a runner', { runner, kind, sub });

  if (INVALID_PATH_CHARS.test(runner) || INVALID_PATH_CHARS.test(kind)) {
    throw new Error('runner does not exist');
  }

  let hasError = false;

  // execute the runner on another process
  const runnerPath = join('runners/kinds', kind, `${runner}.ts`);
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV !== 'production') {
      resolve(0);
      return;
    }
    logger.log('executing a runner: ', runnerPath)
    const prc = spawn(`tsx`, runnerPath.split(' '), {
      cwd: process.cwd(),
      env,
    })
    prc.on('close', () => {
      // update the hook url when the runner finished
      logger.log('finished runner', { hasError });
      if (hasError) {
        reject(new Error('runner failed'))
      } else {
        resolve({ success: true })
      }
      if (hookUrl) {
        fetch(hookUrl, {
          headers: {
            authorization: 'Bearer ' + jwt.sign({ runner, sub }, hookToken),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ success: !hasError })
        }).catch(() => null);
      }
    })

    prc.stdout.on('data', (data = '') => {
      if (process.env.LOG_LEVEL === 'debug') {
        logger.log(data.toString());
      }
      if (!hasError && ERROR_MESSAGES.find(msg => data.toString().includes(msg))) {
        logger.log('an error occurred: ', data.toString());
        hasError = true;
      }
    });
  })
}