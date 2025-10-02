import { useMemo } from 'react';
import { proxy, useSnapshot } from 'valtio';
import type { LobbyData } from '../../../common/data';
import { params } from '../../../common/simulation/physics';
import { Game } from '../../game/game';
import { OfflineAdapter } from '../../game/network/offline-adapter';
import { OnlineAdapter } from '../../game/network/online-adapter';
import { settings } from '../../game/store/settings';
import { socket } from '../../socket';
import { Canvas } from '../../ui/canvas';
import { Controls } from '../../ui/controls';
import { MobileControls } from '../../ui/mobile-controls';
import { SpinControl } from '../../ui/spin-control';
import { UIContainer } from '../../ui/ui-container';
import { useLobby } from '../../util/use-lobby';

let lastBootstrappedFor: string | undefined = undefined;
let game: Game | undefined = undefined;

const bootstrapGame = (lobby: LobbyData | undefined) => {
  if (game && lastBootstrappedFor === lobby?.id) {
    return game;
  }

  lastBootstrappedFor = lobby?.id;
  game = new Game(
    lobby ? new OnlineAdapter(socket, lobby) : new OfflineAdapter(),
    lobby?.params ? proxy(lobby.params) : params
  );
  return game;
};

export const GamePage = () => {
  const { canvasEnabled } = useSnapshot(settings);
  const { lobby } = useLobby();

  const game = useMemo(() => {
    return bootstrapGame(lobby);
  }, [lobby]);

  return (
    <>
      {canvasEnabled && <Canvas game={game} />}
      <UIContainer>
        <Controls />
        <MobileControls />
        <SpinControl />
      </UIContainer>
    </>
  );
};
