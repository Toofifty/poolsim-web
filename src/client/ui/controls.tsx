import { ActionIcon, Button, Menu } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import {
  IconChevronDown,
  IconChevronUp,
  IconLogout2,
} from '@tabler/icons-react';
import { useSnapshot } from 'valtio';
import {
  params,
  Ruleset,
  type StaticParams,
} from '../../common/simulation/physics';
import { Game } from '../game/game';
import { GameState } from '../game/resources/system-state';
import { gameStore } from '../game/store/game';
import { Players, settings } from '../game/store/settings';
import { socket } from '../socket';
import { getAimAssistName, getAimAssistValues } from '../util/enums';
import { useGameContext } from '../util/game-provider';
import type { DeepKeyOf } from '../util/types';
import { useLobby } from '../util/use-lobby';
import { BallIndicator } from './ball-indicator/ball-indicator';
import './controls.scss';
import { OverlayParamEditor } from './overlay-param-editor';
import { PowerBar } from './power-bar';
import { Surface } from './surface';
import { useGameBinding } from './use-game-binding';
import { useGameNotifications } from './use-game-notifications';
import { useIsMobile } from './use-media-query';

const getStateName = (state: GameState, isCurrentPlayer = false) => {
  switch (state) {
    case GameState.Initializing:
      return 'Initializing';
    case GameState.Playing:
      return isCurrentPlayer
        ? 'Your turn (playing)'
        : "Opponent's turn (playing)";
    case GameState.Shooting:
      return isCurrentPlayer ? 'Your turn' : "Opponent's turn";
    case GameState.BallInHand:
      return isCurrentPlayer
        ? 'You have ball in hand'
        : 'Opponent has ball in hand';
    case GameState.GameOver:
      return 'Game over';
    default:
      return `Unknown ${state}`;
  }
};

export const Controls = () => {
  const ecs = useGameContext().ecs;
  const { preferencesOpen, paramEditorOpen, controlsOpen } =
    useSnapshot(settings);
  const { analysisProgress } = useSnapshot(gameStore);
  const { lobby } = useLobby();
  const isHost = !lobby || lobby?.hostId === socket.id;
  const isMultiplayer = !!lobby;

  const isMobile = useIsMobile();

  const localParams = useSnapshot(params);

  useGameNotifications();

  const gameState = useGameBinding(
    'game/state-update',
    (state) => state,
    GameState.Initializing
  );
  const currentPlayer = useGameBinding(
    'game/current-player-update',
    (p) => p,
    0
  );
  const playerIndex = useGameBinding('game/change-player', (p) => p, 0);

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
        mt={controlsOpen ? 164 : 108}
        pt="sm"
      />
      <BallIndicator />
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
          onClick={() => (settings.controlsOpen = !controlsOpen)}
        >
          {controlsOpen ? (
            <IconChevronUp size={16} />
          ) : (
            <IconChevronDown size={16} />
          )}
        </ActionIcon>
        <Surface>
          <div className="group lower">
            {lobby && <span>{lobby.id}</span>}
            <span>
              {getStateName(gameState, currentPlayer === playerIndex)}
              {/* {gameState === GameState.Shooting && (
                <code> {analysisProgress.toFixed(0)}%</code>
              )} */}
            </span>
          </div>
        </Surface>
        <Surface className="grow">
          <div className="group">
            <PowerBar />
          </div>
        </Surface>
      </div>
      {controlsOpen && (
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
                        onClick={() =>
                          ecs.emit('input/setup-game', {
                            ruleset: Ruleset._8Ball,
                          })
                        }
                      >
                        8 ball
                      </Button>
                      <Button
                        onClick={() =>
                          ecs.emit('input/setup-game', {
                            ruleset: Ruleset._9Ball,
                          })
                        }
                      >
                        9 ball
                      </Button>
                      <Menu shadow="md">
                        <Menu.Target>
                          <Button className="button">Sandbox</Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            onClick={() =>
                              ecs.emit('input/setup-game', {
                                ruleset: Ruleset.Sandbox,
                                sandbox: 'debug',
                              })
                            }
                          >
                            Debug
                          </Menu.Item>
                          <Menu.Item
                            onClick={() =>
                              ecs.emit('input/setup-game', {
                                ruleset: Ruleset.SandboxSequential,
                                sandbox: 'cubicle-troll',
                              })
                            }
                          >
                            Cubicle troll
                          </Menu.Item>
                          <Menu.Item
                            onClick={() =>
                              ecs.emit('input/setup-game', {
                                ruleset: Ruleset.Sandbox,
                                sandbox: 'newtons-cradle',
                              })
                            }
                          >
                            Newton's cradle
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
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
      <Menu shadow="md">
        <Menu.Target>
          <Button className="button">{getAimAssistName(aimAssist)}</Button>
        </Menu.Target>
        <Menu.Dropdown>
          {getAimAssistValues().map((value) => (
            <Menu.Item
              key={value}
              onClick={() => (params.game.aimAssist = value)}
            >
              {getAimAssistName(value)}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
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
