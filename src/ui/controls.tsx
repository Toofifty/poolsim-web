import { Button } from './button';
import { Surface } from './surface';
import './controls.scss';
import { PowerBar } from './power-bar';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const canvasEnabledAtom = atomWithStorage('canvasEnabled', false);

export const Controls = () => {
  const [canvasEnabled, setCanvasEnabled] = useAtom(canvasEnabledAtom);

  return (
    <div className="controls">
      <Surface>
        <div className="group">
          <span>Debug</span>
          <Button
            active={canvasEnabled}
            onClick={() => setCanvasEnabled((v) => !v)}
          >
            {canvasEnabled ? 'Disable' : 'Enable'} canvas
          </Button>
        </div>
      </Surface>
      <PowerBar />
    </div>
  );
};
