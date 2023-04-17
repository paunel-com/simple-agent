import {IEnvVar} from './env-var';

export interface IApp {
  identifier: string;
  imageUrl: string;
  internalHostname: string;
  onlyInternal?: boolean;
  hostname?: string;
  port?: string | number;
  envs?: IEnvVar[];
  volumes: Record<string, string>;
}