import { useCallback } from 'react';
import { constrain } from '../../common/util';

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

  const onMouseDown = useCallback((event: React.MouseEvent) => {
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

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, deps);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      const rect = (event.target as HTMLElement).getBoundingClientRect();

      const onTouchMove = (event: TouchEvent) => {
        const [touch] = event.touches;
        const x = (touch.clientX - rect.left) / rect.width;
        const y = (touch.clientY - rect.top) / rect.height;
        fn({ x: constrain(x, 0, 1), y: constrain(y, 0, 1), rect });
        event.preventDefault();
        event.stopPropagation();
        return false;
      };

      const onTouchEnd = (event: TouchEvent) => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      };

      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd, { passive: false });
    },
    [deps]
  );

  return { onClick, onMouseDown, onTouchStart };
};
