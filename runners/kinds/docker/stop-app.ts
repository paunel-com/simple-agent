import {intoMachine} from '../../services/ssh';
import {APP, VM} from '../../../config';

class StopApp {

  async stopApp($, app) {
    try {
      await $`(docker rm -f ${app.internalHostname}) && echo "docker rm"`;
      await $`docker image rm -f ${app.imageUrl}`;
      await $`docker image prune -a -f`;
    } catch (err) {
      console.log('error in running scripts in vm', err)
    }
  }

  async run(app, vm) {
    await intoMachine(vm, ($) => this.stopApp($, app));
  }
}

const runner = new StopApp();

console.log('running remove script', APP._id, VM._id);
runner.run(APP, VM)
  .then(() => {
    console.log('finished')
  })
  .catch((err) => {
    console.log('failed', err)
  })