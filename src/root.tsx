import { Canvas } from './ui/canvas';
import { Game } from './game/game';
import { UIContainer } from './ui/ui-container';
import { canvasEnabledAtom, Controls } from './ui/controls';
import { useAtom } from 'jotai';

const game = new Game();

export const Root = () => {
  const [canvasEnabled] = useAtom(canvasEnabledAtom);

  return (
    <div className="root-container">
      {canvasEnabled && <Canvas game={game} />}
      <UIContainer>
        <Controls />
      </UIContainer>
    </div>
  );
};
