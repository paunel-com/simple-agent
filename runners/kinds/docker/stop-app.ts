import {intoMachine} from '../../services/ssh';
import {APP, VM} from '../../../config';
import {IApp} from '../../../types/app';

class StopApp {
  async stopApp($, app: IApp) {
    try {
      await $`(docker rm -f ${app.internalHostname}) && echo "docker rm"`;
      await $`docker image rm -f ${app.imageUrl}`;
      await $`docker image prune -a -f`;
    } catch (err) {
      console.log('error in running scripts in vm', err)
    }
  }

  async run(app: IApp, vm) {
    await intoMachine(vm, ($) => this.stopApp($, app));
  }
}

const runner = new StopApp();

console.log('running remove script', APP.identifier, VM.identifier);
runner.run(APP, VM)
  .then(() => {
    console.log('finished')
  })
  .catch((err) => {
    console.log('failed', err)
  })