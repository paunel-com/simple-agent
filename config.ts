import 'zx/globals'

export const APPS = JSON.parse(process.env.APPS || 'null')
export const APP = JSON.parse(process.env.APP || 'null')
export const VM = JSON.parse(process.env.VM || 'null')
export const REGISTRY = JSON.parse(process.env.REGISTRY || 'null');
export const SCRIPT = JSON.parse(process.env.SCRIPT || 'null');

export const DOCKER_NETWORK_NAME = process.env.NETWORK_NAME || 'paunel-bridge';