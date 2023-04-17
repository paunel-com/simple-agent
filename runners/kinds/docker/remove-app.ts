import {intoMachine} from '../../services/ssh';
import {createNginxConfig, removeAppConfig, runNginxWithConf} from '../../services/nginx-manager';
import {APP, DOCKER_NETWORK_NAME, VM} from '../../../config';
import {IApp} from '../../../types/app';

class RemoveApp {
  async run(app: IApp, vm) {
    await intoMachine(vm, ($) => this.removeApp($, app));
  }

  async removeApp ($, app: IApp) {
    try {
      await $`(docker rm -f ${app.internalHostname}) && echo "docker rm"`;
      await $`docker image rm -f ${app.imageUrl}`;
      await $`docker image prune -a -f`;
    } catch (err) {
      console.log('error in running scripts in vm', err)
    }

    await this.checkGateway($, app);
  }

  async checkGateway($, app: IApp) {
    await createNginxConfig($)
    await removeAppConfig($, app);
    await runNginxWithConf($, DOCKER_NETWORK_NAME);
  }
}

const runner = new RemoveApp();

console.log('running remove script', APP.identifier, VM.identifier);
runner.run(APP, VM)
  .then(() => {
    console.log('finished')
  })
  .catch((err) => {
    console.log('failed', err)
  })