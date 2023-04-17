import {intoMachine} from '../../services/ssh';
import {SCRIPT, VM} from '../../../config';
import {IBashScript} from '../../../types/bash-script';

class RemoteRun {
  async runBashScript ($, bashScript: IBashScript){
    try {
      const envs = bashScript.envs?.map(env => `export ${env.key}="${env.value}"`).join('; ') || 'echo "no envs"';
      await $`eval ${envs} && eval ${bashScript.script.filter(Boolean).join(' \\n')}`;
    } catch (err) {
      console.log('error in running scripts in vm', err)
    }
  }

  async run(bashScript: IBashScript, vm) {
    await intoMachine(vm, ($) => this.runBashScript($, bashScript));
  }
}

const runner = new RemoteRun();

console.log('running remote script', SCRIPT.identifier, VM.identifier);
runner.run(SCRIPT, VM)
  .then(() => {
    console.log('finished')
  })
  .catch((err) => {
    console.log('failed', err)
  })