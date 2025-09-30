import { AimAssistMode } from '../../../client/game/store/settings';
import { RuleSet } from '../table-state';

export const params = {
  game: {
    ruleSet: RuleSet._9Ball,
    aimAssist: AimAssistMode.FirstContact,
  },
  ball: {
    /** M */
    mass: 0.170097,
    /** R */
    radius: 0.028575,
    /** u_s */
    frictionSlide: 0.2,
    /** u_r */
    frictionRoll: 0.01,
    /** u_sp */
    frictionSpin: (0.028575 * 4) / 9,
    /** u_b */
    frictionBall: 0.05,
    /** u_a */
    frictionAir: 0.001,
    /** e_b */
    restitutionBall: 0.95,
    /** e_p */
    restitutionPocket: 0.5,
    /** e_c */
    restitutionCushion: 0.6,
    /** e_s */
    restitutionSlate: 0.5,
    /** f_c */
    frictionCushion: 0.2,
    /** g */
    gravity: 9.81,
    spinMultiplier: 2,
  },
  cushion: {
    /** h = 1.2R */
    width: 0.04,
    baseWidth: 0.01,
    height: 0.028575 * 1.2,
    backHeight: 0.028575 * 1.3,
    cornerRounding: 0.25,
    rounding: 0.005,
  },
  pocket: {
    depth: 0.24,
    rounding: 0.005,
    edge: {
      radius: 0.06,
      overlap: 0.025,
      girth: 0.01,
    },
    corner: {
      radius: 0.07,
      overlap: 0.02,
      girth: 0.02,
    },
  },
  table: {
    length: 2.24,
    width: 1.12,
  },
};

export type Params = typeof params;

if (typeof window !== 'undefined') (window as any).params = params;
