import { ECS, Plugin } from '@common/ecs';
import { CushionSetupSystem } from './cushion-setup.system';

export class TablePlugin extends Plugin {
  public install(ecs: ECS): void {
    ecs.addStartupSystem(new CushionSetupSystem());
  }
}
