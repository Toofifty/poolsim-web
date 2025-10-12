export type GameRules = {
  /** First contact must be one of these balls */
  validTargets: number[];
  /** Hitting one of these balls (at any point) results in a foul */
  invalidTargets: number[];
  /** Potting one of these balls results in another turn */
  validPottable: number[];
  /** Potting one of these balls is OK, but doesn't result in another turn */
  pottable: number[];
  /** Potting one of these balls results in a foul */
  invalidPottable: number[];
};

export type RuleProviderArgs = {
  turn?: 'solids' | 'stripes' | 'open';
  isBreak?: boolean;
};

export type RuleProvider = (
  balls: number[],
  args: RuleProviderArgs
) => GameRules;
