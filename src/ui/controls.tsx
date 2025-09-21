import { Button } from './button';
import { Surface } from './surface';
import { PowerBar } from './power-bar';
import './controls.scss';
import { useSnapshot } from 'valtio';
import { AimAssistMode, Players, settings } from '../game/store/settings';
import { Game } from '../game/game';
import { gameStore } from '../game/store/game';
import { GameState } from '../game/game-manager';
import { useState } from 'react';
import { theme } from '../game/store/theme';

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
  const { state, analysisProgress } = useSnapshot(gameStore);

  const [showUI, setShotUI] = useState(true);

  return (
    <div className="controls">
      <div className="group">
        <Surface>
          <div className="group lower">
            <span>Status: </span>
            <span>
              {getStateName(state)}
              {state === GameState.AIShoot && (
                <code> {analysisProgress.toFixed(0)}%</code>
              )}
            </span>
          </div>
        </Surface>
        <Button surface onClick={() => setShotUI((v) => !v)}>
          Toggle UI
        </Button>
        <Surface className="grow">
          <PowerBar />
        </Surface>
      </div>
      {showUI && (
        <>
          <div className="group ">
            <Surface>
              <div className="group">
                <GraphicsControls />
                <ThemeControls />
              </div>
            </Surface>
            <Surface>
              <div className="group">
                <AimAssistControls />
                <PlayerControls />
              </div>
            </Surface>
          </div>
          <div className="group space-between">
            <Surface>
              <div className="group lower">
                <Button onClick={() => Game.resetCamera()}>Reset camera</Button>
                <Button onClick={() => Game.focusCueBall()}>
                  Focus cue ball
                </Button>
                <Button onClick={() => Game.manager.setup8Ball()}>
                  8 ball
                </Button>
                <Button onClick={() => Game.manager.setup9Ball()}>
                  9 ball
                </Button>
                <Button onClick={() => Game.manager.setupDebugGame()}>
                  Debug
                </Button>
              </div>
            </Surface>
            <Surface>
              <DebugControls />
            </Surface>
          </div>
        </>
      )}
    </div>
  );
};

const GraphicsControls = () => {
  const { ortho, highDetail } = useSnapshot(settings);

  return (
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
        active={highDetail}
        onClick={() => {
          settings.highDetail = !highDetail;
        }}
      >
        HD
      </Button>
    </div>
  );
};

const AimAssistControls = () => {
  const { aimAssistMode } = useSnapshot(settings);

  return (
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
        Simple
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
  );
};

const PlayerControls = () => {
  const { players } = useSnapshot(settings);

  return (
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
  );
};

const DebugControls = () => {
  const {
    canvasEnabled,
    pauseSimulation,
    lockCue,
    debugLights,
    debugBalls,
    debugCollisionBoxes,
    enableProfiler,
  } = useSnapshot(settings);

  return (
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
        active={pauseSimulation}
        onClick={() => {
          settings.pauseSimulation = !pauseSimulation;
        }}
      >
        Pause simulation
      </Button>
      <Button
        active={lockCue}
        onClick={() => {
          settings.lockCue = !lockCue;
        }}
      >
        Lock cue <kbd>L</kbd>
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
  );
};

const ThemeControls = () => {
  const { table } = useSnapshot(theme);

  return (
    <div className="group lower">
      <span>Theme</span>
      <div className="group">
        {(['green', 'blue', 'red', 'purple'] as const).map((v) => (
          <Button
            key={v}
            active={table === v}
            onClick={() => (theme.table = v)}
          >
            {v[0].toLocaleUpperCase() + v.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>
    </div>
  );
};
