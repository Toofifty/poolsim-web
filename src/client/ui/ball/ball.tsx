import cx from 'classnames';
import { useEffect, useMemo, useRef } from 'react';
import { useSnapshot } from 'valtio';
import { createBallCanvas } from '../../game/models/ball/create-ball-texture';
import { makeTheme, theme } from '../../game/store/theme';
import './ball.scss';

export const RenderedBall = ({
  id,
  size = 32,
  offset = 0.1,
  shadowed,
}: {
  id?: number;
  size?: number;
  offset?: number;
  shadowed?: boolean;
}) => {
  const themeSnapshot = useSnapshot(theme);
  const root = useRef<HTMLDivElement>(null);

  const canvas = useMemo(() => {
    if (id === undefined) return;
    let textureSize = size * window.devicePixelRatio;
    if (textureSize <= 32) textureSize *= 4;
    return createBallCanvas(makeTheme(), id, {
      height: textureSize,
      width: textureSize,
    });
  }, [id, themeSnapshot]);

  useEffect(() => {
    if (!canvas) return;

    root.current?.appendChild(canvas);

    return () => {
      root.current?.removeChild(canvas);
    };
  }, [canvas]);

  return (
    <div
      className={cx('ball__container', shadowed && 'ball__container--shadowed')}
      style={{
        ['--rendered-ball-size' as any]: `${size}px`,
        ['--rendered-ball-offset' as any]: offset,
      }}
    >
      {id !== undefined && <div ref={root} className="ball" />}
    </div>
  );
};
