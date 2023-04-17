import 'zx/globals'
import {IBashScript} from './types/bash-script';
import {IVm} from './types/vm';
import {IApp} from './types/app';
import {IDockerRegistry} from './types/registry';

export const APPS: IApp[] | null = JSON.parse(process.env.APPS || 'null')
export const APP: IApp | null = JSON.parse(process.env.APP || 'null')
export const VM: IVm | null = JSON.parse(process.env.VM || 'null')
export const REGISTRY: IDockerRegistry | null = JSON.parse(process.env.REGISTRY || 'null');
export const SCRIPT: IBashScript | null = JSON.parse(process.env.SCRIPT || 'null');

export const DOCKER_NETWORK_NAME = process.env.NETWORK_NAME || 'paunel-bridge';