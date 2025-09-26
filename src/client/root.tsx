import { useSnapshot } from 'valtio';
import { Game } from './game/game';
import { settings } from './game/store/settings';
import { Canvas } from './ui/canvas';
import { Controls } from './ui/controls';
import { MobileControls } from './ui/mobile-controls';
import { SpinControl } from './ui/spin-control';
import { UIContainer } from './ui/ui-container';

const game = new Game();

export const Root = () => {
  const { canvasEnabled } = useSnapshot(settings);

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
