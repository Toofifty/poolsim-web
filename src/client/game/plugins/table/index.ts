import { ECS, Plugin } from '@common/ecs';
import { CushionSetupSystem } from './cushion-setup.system';
import { PocketSetupSystem } from './pocket-setup.system';

export class TablePlugin extends Plugin {
  public install(ecs: ECS): void {
    ecs.addStartupSystem(new CushionSetupSystem());
    ecs.addStartupSystem(new PocketSetupSystem());
  }
}
