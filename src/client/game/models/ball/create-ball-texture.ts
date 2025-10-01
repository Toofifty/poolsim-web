import { CanvasTexture, Color, SRGBColorSpace } from 'three';
import { settings } from '../../store/settings';
import type { ThemeObject } from '../../store/theme';

const hex = (color: Color) => '#' + color.getHexString();

export function createBallTexture(
  theme: ThemeObject,
  {
    color,
    number,
  }: {
    color: Color;
    number: number;
  }
): CanvasTexture {
  const tsize = settings.highDetail ? 256 : 64;

  const canvas = document.createElement('canvas');
  canvas.width = tsize * 2;
  canvas.height = tsize;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = hex(color);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // todo: noise/variance

  if (number === 0) {
    const dotSize = tsize / 16;

    // Red dots and stripes for cue ball
    ctx.fillStyle = hex(theme.balls.colorCueBallAccent);
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.ellipse(
        (tsize / 2) * k,
        tsize / 2,
        dotSize,
        dotSize,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.fillRect(0, 0, tsize * 2, dotSize);
    ctx.fillRect(0, tsize - dotSize, tsize * 2, dotSize);
  } else {
    const numberSize = tsize / 8;

    // Numbered balls
    ctx.fillStyle = hex(theme.balls.colorBallCircle);
    ctx.beginPath();
    ctx.ellipse(
      tsize / 2,
      tsize / 2,
      numberSize,
      numberSize,
      0,
      0,
      Math.PI * 2
    );
    ctx.ellipse(
      (tsize * 3) / 2,
      tsize / 2,
      numberSize,
      numberSize,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = hex(theme.balls.colorBallNumber);
    ctx.font = `bold ${tsize / 5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const offsetY = settings.highDetail ? 4 : 1;
    for (let k = 0; k < 2; k++) {
      ctx.fillText(String(number), tsize / 2 + k * tsize, tsize / 2 + offsetY);
    }

    if (number >= 9) {
      ctx.fillStyle = hex(theme.balls.colorBallCircle);
      ctx.fillRect(0, 0, tsize * 2, tsize / 4);
      ctx.fillRect(0, (tsize * 3) / 4, tsize * 2, tsize / 4);
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
