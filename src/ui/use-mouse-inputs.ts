import { useCallback } from 'react';
import { constrain } from '../game/math';

export const useMouseInputs = (
  fn: (mouse: { x: number; y: number; rect: DOMRect }) => void,
  deps: unknown[]
) => {
  const onClick = useCallback((event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    fn({ x, y, rect });
  }, deps);

  const onMouseDown = useCallback(
    (event: React.MouseEvent) => {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      event.preventDefault();

      const onMouseMove = (event: MouseEvent) => {
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        fn({ x: constrain(x, 0, 1), y: constrain(y, 0, 1), rect });

        event.preventDefault();
        event.stopPropagation();
        return false;
      };

      const onMouseUp = (event: MouseEvent) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [deps]
  );

  return { onClick, onMouseDown };
};
