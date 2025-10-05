import { AimAssistMode, RuleSet } from '../../common/simulation/physics';
import { EightBallState } from '../../common/simulation/table-state';

export const getRuleSetName = (ruleSet: RuleSet) => {
  switch (ruleSet) {
    case RuleSet._8Ball:
      return '8 Ball';
    case RuleSet._9Ball:
      return '9 Ball';
    case RuleSet.Sandbox:
    case RuleSet.SandboxSequential:
      return 'sandbox';
  }
};

export const getAimAssistName = (aimAssist: AimAssistMode) => {
  switch (aimAssist) {
    case AimAssistMode.Off:
      return 'Off';
    case AimAssistMode.FirstContact:
      return 'First contact';
    case AimAssistMode.FirstBallContact:
      return 'First ball contact';
    case AimAssistMode.Full:
      return 'Full';
  }
};

export const getEightBallStateName = (eightBallState: EightBallState) => {
  switch (eightBallState) {
    case EightBallState.Open:
      return 'open';
    case EightBallState.Player1Solids:
      return 'solids';
    case EightBallState.Player1Stripes:
      return 'stripes';
  }
};
