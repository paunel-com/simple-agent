import {readFile} from 'fs/promises';
import {fs} from 'zx';
import {join} from 'path';

const data = {
  machines: {},
  registries: {}
};

async function load() {
  data.machines = await getStore('machines')
  data.registries = await getStore('registries')
}

async function getStore(key) {
  const filePath = join(process.cwd(), 'storage', key + '.json');
  if (await fs.exists(filePath)) {
    return JSON.parse(await readFile(filePath, 'utf-8'))
  }
  return {}
}

load().catch(() => console.log('failed to load storage'));

export function getMachine(id) {
  return data.machines[id];
}

export function getRegistry(id) {
  return data.registries[id];
}


