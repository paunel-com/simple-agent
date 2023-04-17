import {intoMachine} from '../../services/ssh';
import {addAppConfig, createNginxConfig, runNginxWithConf} from '../../services/nginx-manager';
import {APPS, DOCKER_NETWORK_NAME, VM} from '../../../config';
import {IApp} from '../../../types/app';

class ConfigureNginx {
  async run(apps: IApp[], vm) {
    await intoMachine(vm, ($) => this.configureNginx($, apps));
  }

  async configureNginx ($, apps: IApp[]) {
    try {
      await $`docker network create ${DOCKER_NETWORK_NAME}`;
    } catch (e) {
      console.log('did not create network');
    }
    try {
      await $`rm nginx.conf`;
    } catch {
      //
    }
    await createNginxConfig($);
    for (const app of apps) {
      await addAppConfig($, app);
    }
    await runNginxWithConf($, DOCKER_NETWORK_NAME);
  }
}

const runner = new ConfigureNginx();

console.log('running nginx configure script', VM.identifier);
runner.run(APPS, VM)
  .then(() => {
    console.log('finished')
  })
  .catch((err) => {
    console.log('failed', err)
  })