import { Button } from './button';
import { Surface } from './surface';
import { PowerBar } from './power-bar';
import './controls.scss';
import { useSnapshot } from 'valtio';
import { settings } from '../game/settings';
import { Game } from '../game/game';

export const Controls = () => {
  const {
    canvasEnabled,
    debugLights,
    debugBalls,
    debugCollisionBoxes,
    enableProfiler,
  } = useSnapshot(settings);

  return (
    <div className="controls">
      <PowerBar />
      <div className="group space-between">
        <div className="group">
          <Button surface onClick={() => Game.resetCamera()}>
            Reset camera
          </Button>
          <Button surface onClick={() => Game.manager.setup8Ball()}>
            Setup 8 ball
          </Button>
          <Button surface onClick={() => Game.manager.setup9Ball()}>
            Setup 9 ball
          </Button>
          <Button surface onClick={() => Game.manager.setupDebugGame()}>
            Setup single ball
          </Button>
        </div>
        <Surface>
          <div className="group space-between">
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
