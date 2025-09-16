import { Button } from './button';
import { Surface } from './surface';
import { PowerBar } from './power-bar';
import './controls.scss';
import { useSnapshot } from 'valtio';
import { AimAssistMode, settings } from '../game/settings';
import { Game } from '../game/game';

export const Controls = () => {
  const {
    aimAssistMode,
    highDetail,
    canvasEnabled,
    debugLights,
    debugBalls,
    debugCollisionBoxes,
    enableProfiler,
  } = useSnapshot(settings);

  return (
    <div className="controls">
      <div className="group ">
        <Surface>
          <div className="group lower">
            <span>Graphics</span>
            <Button
              active={!highDetail}
              onClick={() => {
                settings.highDetail = false;
              }}
            >
              Low detail
            </Button>
            <Button
              active={highDetail}
              onClick={() => {
                settings.highDetail = true;
              }}
            >
              High detail
            </Button>
          </div>
        </Surface>
        <Surface>
          <div className="group lower">
            <span>Aim assist</span>
            <Button
              active={aimAssistMode === AimAssistMode.Off}
              onClick={() => {
                settings.aimAssistMode = AimAssistMode.Off;
              }}
            >
              Off
            </Button>
            <Button
              active={aimAssistMode === AimAssistMode.FirstContact}
              onClick={() => {
                settings.aimAssistMode = AimAssistMode.FirstContact;
              }}
            >
              First contact
            </Button>
            <Button
              active={aimAssistMode === AimAssistMode.Full}
              onClick={() => {
                settings.aimAssistMode = AimAssistMode.Full;
              }}
            >
              Full
            </Button>
          </div>
        </Surface>
        <Surface className="grow">
          <PowerBar />
        </Surface>
      </div>
      <div className="group space-between">
        <div className="group">
          <Button surface onClick={() => Game.resetCamera()}>
            Reset camera
          </Button>
          <Button surface onClick={() => Game.focusCueBall()}>
            Focus cue ball
          </Button>
          <Button surface onClick={() => Game.manager.setup8Ball()}>
            8 ball
          </Button>
          <Button surface onClick={() => Game.manager.setup9Ball()}>
            9 ball
          </Button>
          <Button surface onClick={() => Game.manager.setupDebugGame()}>
            Debug
          </Button>
        </div>
        <Surface>
          <div className="group">
            <div className="group lower">
              <span>Debug</span>
              <Button
                active={canvasEnabled}
                onClick={() => {
                  settings.canvasEnabled = !canvasEnabled;
                }}
              >
                {settings.canvasEnabled ? 'Disable' : 'Enable'} canvas
              </Button>
              <Button
                active={debugLights}
                onClick={() => {
                  settings.debugLights = !debugLights;
                }}
              >
                Debug lights
              </Button>
              <Button
                active={debugBalls}
                onClick={() => {
                  settings.debugBalls = !debugBalls;
                }}
              >
                Debug balls
              </Button>
              <Button
                active={debugCollisionBoxes}
                onClick={() => {
                  settings.debugCollisionBoxes = !debugCollisionBoxes;
                }}
              >
                Debug collision boxes
              </Button>
              <Button
                active={enableProfiler}
                onClick={() => {
                  settings.enableProfiler = !enableProfiler;
                }}
              >
                {enableProfiler ? 'Disable' : 'Enable'} profiler
              </Button>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
};
