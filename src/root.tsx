import { Game } from './game/game';
import { Canvas } from './ui/canvas';
import { UIContainer } from './ui/ui-container';
import { Controls } from './ui/controls';
import { useSnapshot } from 'valtio';
import { settings } from './game/store/settings';
import { SpinControl } from './ui/spin-control';

const game = new Game();

export const Root = () => {
  const { canvasEnabled } = useSnapshot(settings);

  return (
    <div className="root-container">
      {canvasEnabled && <Canvas game={game} />}
      <UIContainer>
        <Controls />
        <SpinControl />
      </UIContainer>
    </div>
  );
};
