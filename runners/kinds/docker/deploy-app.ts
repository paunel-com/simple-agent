import {intoMachine} from '../../services/ssh';
import {addAppConfig, createNginxConfig, removeAppConfig, runNginxWithConf} from '../../services/nginx-manager';
import {APP, DOCKER_NETWORK_NAME, REGISTRY, VM} from '../../../config';
import {IApp} from '../../../types/app';
import {IVm} from '../../../types/vm';
import {IDockerRegistry} from '../../../types/registry';

class DeployApp {
  async run(app: IApp, vm: IVm, registry?: IDockerRegistry) {
    await intoMachine(vm, ($) => this.deployApp($, registry, app));
  }

  async deployApp ($, registry, app: IApp) {
    try {
      await $`docker network create ${DOCKER_NETWORK_NAME}`;
    } catch (e) {
      console.log('did not create network');
    }

    if (registry) {
      try {
        await $`docker login -u "${registry.username}" -p "${registry.password}" ${registry.url}`
      } catch {
        console.log('failed to login to docker registry');
      }
    }

    try {
      await $`docker pull ${app.imageUrl}`;
      await $`(docker rm -f ${app.internalHostname}) && echo "docker rm"`;
      await this.createEnvFile($, app);
      await $`docker run --name ${app.internalHostname} --restart unless-stopped --env-file ${app.internalHostname}.env --network ${DOCKER_NETWORK_NAME} -d ${app.imageUrl}`;
      await $`docker image prune -a -f`;
      await $`rm ${app.internalHostname}.env`
    } catch (err) {
      console.log('error in running scripts in vm', err)
    }

    if (registry) {
      try {
        await $`docker logout`;
      } catch {
        //
      }
    }

    await this.checkGateway($, app);
  }

  async checkGateway($, app: IApp) {
    await createNginxConfig($)
    if (app.onlyInternal) {
      await removeAppConfig($, app);
    } else {
      await addAppConfig($, app);
    }
    await runNginxWithConf($, DOCKER_NETWORK_NAME);
  }

  async createEnvFile($, app: IApp) {
    const envs = (app.envs || []).map(env => `${env.key}=${env.value}`).join('\n');

    await $`echo ${envs} > ${app.internalHostname}.env`;
  }
}

const runner = new DeployApp();

console.log('running deployment script', APP.identifier, VM.identifier);
runner.run(APP, VM, REGISTRY)
  .then(() => {
    console.log('finished')
  })
  .catch((err) => {
    console.log('failed', err)
  })