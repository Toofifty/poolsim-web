import { Button } from './button';
import { Surface } from './surface';
import { PowerBar } from './power-bar';
import './controls.scss';
import { useSnapshot } from 'valtio';
import { AimAssistMode, Players, settings } from '../game/store/settings';
import { Game } from '../game/game';
import { gameStore } from '../game/store/game';
import { GameState } from '../game/game-manager';

const getStateName = (state: GameState | undefined) => {
  switch (state) {
    case GameState.AIInPlay:
      return 'AI turn';
    case GameState.AIShoot:
      return 'AI is thinking';
    case GameState.PlayerInPlay:
    case GameState.PlayerShoot:
      return 'Your turn';
    default:
      return 'Unknown';
  }
};

export const Controls = () => {
  const {
    aimAssistMode,
    ortho,
    highDetail,
    players,
    canvasEnabled,
    debugLights,
    debugBalls,
    debugCollisionBoxes,
    enableProfiler,
  } = useSnapshot(settings);

  const { state } = useSnapshot(gameStore);

  return (
    <div className="controls">
      <div className="group">
        <Surface>
          <div className="group lower">
            <span>Status: </span>
            <span>{getStateName(state)}</span>
          </div>
        </Surface>
      </div>
      <div className="group ">
        <Surface>
          <div className="group lower">
            <span>Graphics</span>
            <Button
              active={ortho}
              onClick={() => {
                settings.ortho = !ortho;
              }}
            >
              Ortho
            </Button>
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
          <div className="group">
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
            <div className="group lower">
              <span>Players</span>
              <Button
                active={players === Players.PlayerVsPlayer}
                onClick={() => {
                  settings.players = Players.PlayerVsPlayer;
                }}
              >
                PvP
              </Button>
              <Button
                active={players === Players.PlayerVsAI}
                onClick={() => {
                  settings.players = Players.PlayerVsAI;
                }}
              >
                PvAI
              </Button>
              <Button
                active={players === Players.AIVsAI}
                onClick={() => {
                  settings.players = Players.AIVsAI;
                }}
              >
                AIvAI
              </Button>
            </div>
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
                active={!canvasEnabled}
                onClick={() => {
                  settings.canvasEnabled = !canvasEnabled;
                }}
              >
                Disable canvas
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
