import { ECS, Plugin } from '@common/ecs';
import { CushionSetupSystem } from './cushion-setup.system';
import { PocketSetupSystem } from './pocket-setup.system';
import { TableParamUpdateSystem } from './table-param-update.system';
import { TableSetupSystem } from './table-setup.system';

export class TablePlugin extends Plugin {
  public install(ecs: ECS): void {
    ecs.addStartupSystem(new CushionSetupSystem());
    ecs.addStartupSystem(new PocketSetupSystem());
    ecs.addStartupSystem(new TableSetupSystem());
    ecs.addEventSystem(new TableParamUpdateSystem());
  }
}
