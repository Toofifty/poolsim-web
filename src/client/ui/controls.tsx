import { ActionIcon, Button } from '@mantine/core';
import { IconChevronUp, IconSettings } from '@tabler/icons-react';
import { useState } from 'react';
import { useSnapshot } from 'valtio';
import { AimAssistMode } from '../../common/simulation/physics';
import { PlayState } from '../game/controller/game-controller';
import { Game } from '../game/game';
import { gameStore } from '../game/store/game';
import { Players, settings } from '../game/store/settings';
import { socket } from '../socket';
import { useLobby } from '../util/use-lobby';
import './controls.scss';
import { PowerBar } from './power-bar';
import { Surface } from './surface';

const getStateName = (state: PlayState | undefined) => {
  switch (state) {
    case PlayState.Initializing:
      return 'Initializing';
    case PlayState.AIInPlay:
      return 'AI turn';
    case PlayState.AIShoot:
      return 'AI is thinking';
    case PlayState.PlayerInPlay:
    case PlayState.PlayerShoot:
      return 'Your turn';
    case PlayState.PlayerBallInHand:
      return 'You have ball in hand';
    case PlayState.OpponentInPlay:
    case PlayState.OpponentShoot:
      return "Opponent's turn";
    case PlayState.OpponentBallInHand:
      return 'Opponent has ball in hand';
    default:
      return `Unknown ${state}`;
  }
};

export const Controls = () => {
  const { state, analysisProgress } = useSnapshot(gameStore);
  const { lobby } = useLobby();
  const isHost = !lobby || lobby?.hostId === socket.id;
  const isMultiplayer = !!lobby;

  const [showUI, setShowUI] = useState(false);

  return (
    <div className="controls">
      <div className="group">
        <ActionIcon
          className="surface button icon"
          size="40"
          onClick={() => setShowUI((v) => !v)}
        >
          {showUI ? <IconChevronUp size={16} /> : <IconSettings size={16} />}
        </ActionIcon>
        <Surface>
          <div className="group lower">
            {lobby && <span>{lobby.id}</span>}
            <span>Status:</span>
            <span>
              {getStateName(state)}
              {state === PlayState.AIShoot && (
                <code> {analysisProgress.toFixed(0)}%</code>
              )}
            </span>
          </div>
        </Surface>
        <Surface className="grow">
          <div className="group">
            <PowerBar />
          </div>
        </Surface>
      </div>
      {showUI && (
        <>
          <div className="group space-between">
            <Surface>
              <div className="group lower">
                <Button onClick={() => (settings.preferencesOpen = true)}>
                  Preferences
                </Button>
                <Button onClick={() => Game.focusCueBall()}>
                  Focus cue ball
                </Button>
                {isHost && (
                  <>
                    <Button
                      onClick={() => Game.instance.controller.setup8Ball()}
                    >
                      8 ball
                    </Button>
                    <Button
                      onClick={() => Game.instance.controller.setup9Ball()}
                    >
                      9 ball
                    </Button>
                    <Button
                      onClick={() => Game.instance.controller.setupDebugGame()}
                    >
                      Debug
                    </Button>
                  </>
                )}
              </div>
            </Surface>

            {!isMultiplayer && (
              <Surface>
                <div className="group">
                  <AimAssistControls />
                  <PlayerControls />
                </div>
              </Surface>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const AimAssistControls = () => {
  const { aimAssistMode } = useSnapshot(settings);

  return (
    <div className="group lower">
      <span>Guidelines</span>
      <Button
        variant={aimAssistMode === AimAssistMode.Off ? 'filled' : 'default'}
        onClick={() => {
          settings.aimAssistMode = AimAssistMode.Off;
        }}
      >
        Off
      </Button>
      <Button
        variant={
          aimAssistMode === AimAssistMode.FirstContact ? 'filled' : 'default'
        }
        onClick={() => {
          settings.aimAssistMode = AimAssistMode.FirstContact;
        }}
      >
        First contact
      </Button>
      <Button
        variant={
          aimAssistMode === AimAssistMode.FirstBallContact
            ? 'filled'
            : 'default'
        }
        onClick={() => {
          settings.aimAssistMode = AimAssistMode.FirstBallContact;
        }}
      >
        First ball contact
      </Button>
      <Button
        variant={aimAssistMode === AimAssistMode.Full ? 'filled' : 'default'}
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
        variant={players === Players.PlayerVsPlayer ? 'filled' : 'default'}
        onClick={() => {
          settings.players = Players.PlayerVsPlayer;
        }}
      >
        PvP
      </Button>
      <Button
        variant={players === Players.PlayerVsAI ? 'filled' : 'default'}
        onClick={() => {
          settings.players = Players.PlayerVsAI;
        }}
      >
        PvAI
      </Button>
      <Button
        variant={players === Players.AIVsAI ? 'filled' : 'default'}
        onClick={() => {
          settings.players = Players.AIVsAI;
        }}
      >
        AIvAI
      </Button>
    </div>
  );
};
