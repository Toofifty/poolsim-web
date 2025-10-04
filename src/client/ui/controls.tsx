import { ActionIcon, Button } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import {
  IconChevronDown,
  IconChevronUp,
  IconLogout2,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useSnapshot } from 'valtio';
import {
  AimAssistMode,
  params,
  type StaticParams,
} from '../../common/simulation/physics';
import { PlayState } from '../game/controller/game-controller';
import { Game } from '../game/game';
import { gameStore } from '../game/store/game';
import { Players, settings } from '../game/store/settings';
import { socket } from '../socket';
import type { DeepKeyOf } from '../util/types';
import { useLobby } from '../util/use-lobby';
import './controls.scss';
import { OverlayParamEditor } from './overlay-param-editor';
import { PowerBar } from './power-bar';
import { Surface } from './surface';
import { useIsMobile } from './use-media-query';

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
  const { preferencesOpen, paramEditorOpen } = useSnapshot(settings);
  const { state, analysisProgress } = useSnapshot(gameStore);
  const { lobby } = useLobby();
  const isHost = !lobby || lobby?.hostId === socket.id;
  const isMultiplayer = !!lobby;

  const isMobile = useIsMobile();
  const [showUI, setShowUI] = useState(false);

  const localParams = useSnapshot(params);

  const onEdit = (key: DeepKeyOf<StaticParams>, value: unknown) => {
    const path = key.split('.');
    const obj = path.slice(0, -1).reduce((o, prop) => {
      // @ts-ignore
      return o[prop];
    }, params);
    // @ts-ignore
    obj[path.at(-1)] = value;
  };

  return (
    <div className="controls">
      {isHost && <OverlayParamEditor params={localParams} onEdit={onEdit} />}
      <Notifications
        position="top-center"
        classNames={{ notification: 'surface-effects' }}
        // ui-container inset
        top={isMobile ? 4 : 16}
        mt={showUI ? 108 : 50}
        pt="sm"
      />
      <div className="group">
        <ActionIcon
          className="surface button icon"
          size="40"
          onClick={() => {
            window.location.pathname = '/';
          }}
        >
          <IconLogout2 size={16} />
        </ActionIcon>
        <ActionIcon
          className="surface button icon"
          size="40"
          onClick={() => setShowUI((v) => !v)}
        >
          {showUI ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </ActionIcon>
        <Surface>
          <div className="group lower">
            {lobby && <span>{lobby.id}</span>}
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
              <div className="group">
                <div className="group lower">
                  <Button
                    variant={preferencesOpen ? 'filled' : 'default'}
                    onClick={() => (settings.preferencesOpen = true)}
                  >
                    Preferences
                  </Button>
                  {isHost && (
                    <Button
                      variant={paramEditorOpen ? 'filled' : 'default'}
                      onClick={() =>
                        (settings.paramEditorOpen = !paramEditorOpen)
                      }
                    >
                      Parameters
                    </Button>
                  )}
                </div>
                <div className="group lower">
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
                        onClick={() =>
                          Game.instance.controller.setupDebugGame()
                        }
                      >
                        Debug
                      </Button>
                    </>
                  )}
                </div>
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
  const {
    game: { aimAssist },
  } = useSnapshot(params);

  return (
    <div className="group lower">
      <span>Guidelines</span>
      <Button
        variant={aimAssist === AimAssistMode.Off ? 'filled' : 'default'}
        onClick={() => {
          params.game.aimAssist = AimAssistMode.Off;
        }}
      >
        Off
      </Button>
      <Button
        variant={
          aimAssist === AimAssistMode.FirstContact ? 'filled' : 'default'
        }
        onClick={() => {
          params.game.aimAssist = AimAssistMode.FirstContact;
        }}
      >
        First contact
      </Button>
      <Button
        variant={
          aimAssist === AimAssistMode.FirstBallContact ? 'filled' : 'default'
        }
        onClick={() => {
          params.game.aimAssist = AimAssistMode.FirstBallContact;
        }}
      >
        First ball contact
      </Button>
      <Button
        variant={aimAssist === AimAssistMode.Full ? 'filled' : 'default'}
        onClick={() => {
          params.game.aimAssist = AimAssistMode.Full;
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
