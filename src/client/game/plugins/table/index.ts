import { createPlugin } from '@common/ecs/func';
import type { GameEvents } from '../../events';
import { CushionSetupSystem } from './cushion-setup.system';
import { PocketSetupSystem } from './pocket-setup.system';
import { TableParamUpdateSystem } from './table-param-update.system';
import { TableSetupSystem } from './table-setup.system';

export const tablePlugin = createPlugin<GameEvents>((ecs) => {
  ecs.addStartupSystem(new CushionSetupSystem());
  ecs.addStartupSystem(new PocketSetupSystem());
  ecs.addStartupSystem(new TableSetupSystem());
  const tableParamUpdateSystem = ecs.addEventSystem(
    new TableParamUpdateSystem()
  );

  return () => {
    ecs.removeEventSystem(tableParamUpdateSystem);
  };
});
