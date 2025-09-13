import { Canvas } from './ui/canvas';
import { PowerBar } from './ui/power-bar';
import { Game } from './game/game';
import { UIContainer } from './ui/ui-container';

const game = new Game();

export const Root = () => {
  return (
    <div className="root-container">
      <Canvas game={game} />
      <UIContainer>
        <PowerBar />
      </UIContainer>
    </div>
  );
};
