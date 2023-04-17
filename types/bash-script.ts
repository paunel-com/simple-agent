import {IEnvVar} from './env-var';

export interface IBashScript {
  identifier: string;
  envs?: IEnvVar[];
  script: string[];
}