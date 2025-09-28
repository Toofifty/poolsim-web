import { useMemo } from 'react';
import { useSnapshot } from 'valtio';
import type { LobbyData } from '../../../common/data';
import { Game } from '../../game/game';
import { LocalNetwork, Network } from '../../game/network';
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

  console.log('bootstrapping game', lobby?.id);
  lastBootstrappedFor = lobby?.id;
  game = new Game(lobby ? new Network(socket, lobby) : new LocalNetwork());
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
