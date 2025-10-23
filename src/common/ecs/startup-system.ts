import type { ECS } from './main';

export abstract class StartupSystem {
  public abstract run(ecs: ECS): void;
}
