import type { ECS } from './main';

export abstract class Plugin {
  public abstract install(ecs: ECS): void;
}
