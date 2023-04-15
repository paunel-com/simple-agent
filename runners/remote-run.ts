import {intoMachine} from './ssh';
import {SCRIPT, VM} from '../config';

class RemoteRun {
  async runBashScript ($, bashScript){
    try {
      const envs = bashScript.envs?.map(env => `export ${env.key}="${env.value}"`).join('; ') || 'echo "no envs"';
      await $`eval ${envs} && eval ${bashScript.script.filter(Boolean).join(' \\n')}`;
    } catch (err) {
      console.log('error in running scripts in vm', err)
    }
  }

  async run(bashScript, vm) {
    await intoMachine(vm, ($) => this.runBashScript($, bashScript));
  }
}

const runner = new RemoteRun();

console.log('running remote script', SCRIPT._id, VM._id);
runner.run(SCRIPT, VM)
  .then(() => {
    console.log('finished')
  })
  .catch((err) => {
    console.log('failed', err)
  })