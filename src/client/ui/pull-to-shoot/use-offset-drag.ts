import { constrain } from '@common/util';
import React, { useCallback } from 'react';

const relativeMouseXY = (
  event: MouseEvent | React.MouseEvent,
  rect: DOMRect
) => {
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  return { x: constrain(x, 0, 1), y: constrain(y, 0, 1) };
};

const relativeTouchXY = (
  event: TouchEvent | React.TouchEvent,
  rect: DOMRect
) => {
  const touch = event.touches[0];
  const x = (touch.clientX - rect.left) / rect.width;
  const y = (touch.clientY - rect.top) / rect.height;
  return { x: constrain(x, 0, 1), y: constrain(y, 0, 1) };
};

export const useOffsetDrag = (
  {
    update,
    end,
  }: { update: (mouse: { x: number; y: number }) => void; end?: () => void },
  options: { x?: [min: number, max: number]; y?: [min: number, max: number] },
  deps: unknown[]
) => {
  const onMouseDown = useCallback((initialEvent: React.MouseEvent) => {
    const rect = (initialEvent.target as HTMLElement).getBoundingClientRect();
    const start = relativeMouseXY(initialEvent, rect);
    initialEvent.preventDefault();

    const onMouseMove = (event: MouseEvent) => {
      const current = relativeMouseXY(event, rect);
      let x = current.x - start.x;
      let y = current.y - start.y;
      if (options.x) x = constrain(x, ...options.x);
      if (options.y) y = constrain(y, ...options.y);
      update({ x, y });
      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    const onMouseUp = () => {
      end?.();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, deps);

  const onTouchStart = useCallback((initialEvent: React.TouchEvent) => {
    const rect = (initialEvent.target as HTMLElement).getBoundingClientRect();
    const start = relativeTouchXY(initialEvent, rect);
    initialEvent.preventDefault();

    const onTouchMove = (event: TouchEvent) => {
      const current = relativeTouchXY(event, rect);
      let x = current.x - start.x;
      let y = current.y - start.y;
      if (options.x) x = constrain(x, ...options.x);
      if (options.y) y = constrain(y, ...options.y);
      update({ x, y });
      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    const onTouchEnd = () => {
      end?.();
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
  }, deps);

  return { onMouseDown, onTouchStart };
};
