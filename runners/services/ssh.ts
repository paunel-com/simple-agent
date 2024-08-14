// @ts-check
import {Client} from 'ssh2';
import {ProcessPromise, ProcessOutput, $} from 'zx';
import chalk from 'chalk';
import {IVm} from '../../types/vm';


if (process.env.NODE_ENV === 'production' && !process.env.DEBUG) {
  $.verbose = false;
}


/**
 * @typedef {import('ssh2/lib/Channel.js').Channel} Channel)}
 * @typedef {import('./ssh-types').HostConfig} HostConfig
 * @typedef {import('./ssh-types').SshZx} SshZx
 */

/**
 * Example usage:
 *
 * const fredAtExample = {
 *   user: 'fred',
 *   sshKey?: '[ssh-key]',
 *   password?: '[password]',
 *   hostName: 'example.com',
 *   port: 22,
 * };
 *
 * await ssh(fredAtExample, $ => {
 *   $`ls -la`;
 * });
 * @param {HostConfig} hostConfig
 * @param {($: SshZx) => Promise<void>} runner
 */
export async function ssh(hostConfig, runner) {
  const {
    user: username,
    hostName: host = 'localhost',
    port = 22,
    sshKey,
    password,
    passphrase
  } = hostConfig;

  const conn = new Client();

  /**
   * @ts-expect-error I'm not sure what's going on here
   */
  const sshZx = createSshZx(conn, host);

  const {promise, resolve, reject} = (() => {
    let resolve = /** @type {(_value: any) => void} */_value => {
    };
    let reject = /** @type {(ex: any) => void} */() => {
    };
    const promise = new Promise((...args) => ([resolve, reject] = args));
    return {promise, resolve, reject};
  })();

  conn.on('ready', () => {
    runner(sshZx)
      .then(() => {
        resolve(undefined);
      })
      .catch(ex => {
        // @ts-ignore
        reject(ex);
      })
      .finally(() => {
        conn.end();
      });
  });

  const connectData: any = {host, port, username, passphrase};
  if (sshKey) {
    connectData.privateKey = sshKey;
  } else {
    connectData.password = password;
  }
  conn.connect(connectData);

  return promise;
}

/**
 * @param {Client} client
 * @param {string} hostname
 * @returns {SshZx}
 */
function createSshZx(client, hostname) {
  return (pieces, ...args) => {
    const {verbose, prefix} = $;
    const __from = /** @type {string} */ (new Error().stack)
      .split(/^\s*at\s/m)[2]
      .trim();

    let cmd = pieces[0];
    let i = 0;

    while (i < args.length) {
      /** @type {(x: any) => string} */
      const quoteSubst = x => $.quote(substitute(x));
      /** @type {string} */
      const s = Array.isArray(args[i])
        ? args[i].map(quoteSubst).join(' ')
        : quoteSubst(args[i]);
      cmd += s + pieces[++i];
    }

    const {promise, resolve, reject} = (() => {
      let resolve = /** @type {(_value: any) => void} */_value => {
      };
      let reject = /** @type {(ex: any) => void} */() => {
      };
      /**
       * @ts-expect-error Exported zx types don't match the actual types
       */
      const promise = new ProcessPromise(
        /**
         * @ts-expect-error Exported zx types don't match the actual types
         */
        (...args) => ([resolve, reject] = args)
      );
      return {promise, resolve, reject};
    })();

    if (resolve == null || reject == null) {
      throw new Error('resolve or reject is null');
    }

    // @ts-ignore
    promise._run = () => {
      // @ts-ignore
      if (promise.client != null) {
        return;
      }
      if (promise._prerun != null) {
        promise._prerun();
      }
      if (verbose) {
        printCmd(cmd, hostname);
      }

      // @ts-ignore
      if (promise._piped) {
        throw new Error('piped is not supported');
      }

      let stdout = '';
      let stderr = '';
      let combined = '';

      /**
       * @param {Error} err
       * @param {Channel} channel
       */
      function handleExec(err, channel) {
        if (err) {
          // @ts-ignore
          reject(err);
          return;
        }

        /**
         * @param {number} code
         * @param {number | undefined} _signal
         */
        function handleClose(code, _signal) {
          const message =
            `${stderr || '\n'}    at ${__from}\n    exit code: ${code}` +
            (exitCodeInfo(code) ? ` (${exitCodeInfo(code)})` : '');

          // @ts-expect-error Exported zx types don't match the actual types
          const output = new ProcessOutput({
            code,
            stdout,
            stderr,
            combined,
            message,
          });

          // @ts-ignore
          if (code === 0 || promise._nothrow) {
            resolve(output);
          } else {
            // @ts-ignore
            reject(output);
          }
          // @ts-ignore
          promise._resolved = true;
        }

        channel.on('close', handleClose);

        /** @param {string} data */
        function handleStdoutData(data) {
          if (verbose) {
            process.stdout.write(data || '');
          }
          stdout += data;
          combined += data;
        }

        channel.on('data', handleStdoutData);

        /** @param {string} data */
        function handleStderrData(data) {
          if (verbose) {
            process.stderr.write(data || '');
          }
          stderr += data;
          combined += data;
        }

        channel.stderr.on('data', handleStderrData);
      }

      /**
       * @ts-expect-error The exec method does exist because this works
       */
      client.exec(prefix + cmd, handleExec);

      // @ts-ignore
      promise.client = client;
      if (promise._postrun) {
        promise._postrun();
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-argument
    // @ts-ignore
    setTimeout(promise._run, 0); // Make sure all subprocesses started.

    return promise;
  };
}

/**
 * @param {string} cmd
 * @param {string} hostname
 */
function printCmd(cmd, hostname) {
  if (/\n/.test(cmd)) {
    console.log(
      cmd
        .split('\n')
        .map((line, i) => (i === 0 ? '$' : '>') + ' ' + colorize(line))
        .join('\n')
    );
  } else {
    console.log(hostname, '$', colorize(cmd));
  }
}

/**
 * @param {string} cmd
 */
function colorize(cmd) {
  return cmd.replace(/^[\w_.-]+(\s|$)/, substr => {
    return chalk.greenBright(substr);
  });
}

/**
 * @param {any} arg
 */
function substitute(arg) {
  if (arg instanceof ProcessOutput) {
    return arg.stdout.replace(/\n$/, '');
  }
  return `${String(arg)}`;
}

/**
 * @param {number} exitCode
 * @returns {string}
 */
function exitCodeInfo(exitCode) {
  return (
    {
      2: 'Misuse of shell builtins',
      126: 'Invoked command cannot execute',
      127: 'Command not found',
      128: 'Invalid exit argument',
      129: 'Hangup',
      130: 'Interrupt',
      131: 'Quit and dump core',
      132: 'Illegal instruction',
      133: 'Trace/breakpoint trap',
      134: 'Process aborted',
      135: 'Bus error: "access to undefined portion of memory object"',
      136: 'Floating point exception: "erroneous arithmetic operation"',
      137: 'Kill (terminate immediately)',
      138: 'User-defined 1',
      139: 'Segmentation violation',
      140: 'User-defined 2',
      141: 'Write to pipe with no one reading',
      142: 'Signal raised by alarm',
      143: 'Termination (request to terminate)',
      145: 'Child process terminated, stopped (or continued*)',
      146: 'Continue if stopped',
      147: 'Stop executing temporarily',
      148: 'Terminal stop signal',
      149: 'Background process attempting to read from tty ("in")',
      150: 'Background process attempting to write to tty ("out")',
      151: 'Urgent data available on socket',
      152: 'CPU time limit exceeded',
      153: 'File size limit exceeded',
      154: 'Signal raised by timer counting virtual time: "virtual timer expired"',
      155: 'Profiling timer expired',
      157: 'Pollable event',
      159: 'Bad syscall',
    }[exitCode] || `Unknown exit code: ${exitCode}`
  );
}

export async function intoMachine(vm: IVm, callback) {
  try {
    await ssh({
      user: vm.username,
      sshKey: vm.sshKey,
      password: vm.password,
      hostName: vm.address,
    }, async ($) => {
      console.log('logged in to vm');
      await callback($);
      await $`history -c`;
    })
  } catch (e) {
    console.log('failed to login to machine', e);
  }
}