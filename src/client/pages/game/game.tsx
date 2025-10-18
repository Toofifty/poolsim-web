import { notifications } from '@mantine/notifications';
import { useEffect, useMemo } from 'react';
import { useSnapshot } from 'valtio';
import type { LobbyData } from '../../../common/data';
import { params } from '../../../common/simulation/physics';
import { createECS } from '../../game/ecs';
import { Game } from '../../game/game';
import { settings } from '../../game/store/settings';
import { socket } from '../../socket';
import { Canvas } from '../../ui/canvas';
import { Controls } from '../../ui/controls';
import { QuickControls } from '../../ui/quick-controls';
import { SpinControl } from '../../ui/spin-control';
import { UIContainer } from '../../ui/ui-container';
import { GameContext } from '../../util/game-provider';
import { useLobby } from '../../util/use-lobby';

let lastBootstrappedFor: string | undefined = undefined;
let game: Game | undefined = undefined;

const bootstrapGame = (lobby: LobbyData | undefined) => {
  if (game && lastBootstrappedFor === lobby?.id) {
    return game;
  }

  lastBootstrappedFor = lobby?.id;
  const [ecs, _destroy] = lobby
    ? createECS(lobby.params, socket, lobby)
    : createECS(params);
  game = ecs.game;
  return game;
};

export const GamePage = () => {
  const { canvasEnabled } = useSnapshot(settings);
  const { lobby } = useLobby();

  const game = useMemo(() => {
    return bootstrapGame(lobby);
  }, [lobby]);

  useEffect(() => {
    if (window.innerHeight > window.innerWidth) {
      notifications.show({
        message: 'Rotate your device for the best experience',
      });
    }
  }, []);

  return (
    <GameContext.Provider value={game}>
      {canvasEnabled && <Canvas game={game} />}
      <UIContainer
        bottom={
          <>
            <span />
            <QuickControls />
            <SpinControl />
          </>
        }
      >
        <Controls />
      </UIContainer>
    </GameContext.Provider>
  );
};
