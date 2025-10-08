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

export const getAimAssistValues = () => [
  AimAssistMode.Off,
  AimAssistMode.FirstContact,
  AimAssistMode.FirstBallContact,
  AimAssistMode.FirstContactCurve,
  AimAssistMode.FirstBallContactCurve,
  AimAssistMode.Full,
];

export const getAimAssistName = (aimAssist: AimAssistMode) => {
  switch (aimAssist) {
    case AimAssistMode.Off:
      return 'Off';
    case AimAssistMode.FirstContact:
      return 'First contact';
    case AimAssistMode.FirstBallContact:
      return 'First ball contact';
    case AimAssistMode.FirstContactCurve:
      return 'First contact (+ curve)';
    case AimAssistMode.FirstBallContactCurve:
      return 'First ball contact (+ curve)';
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
