import { CanvasTexture } from 'three';

const tsize = 256;

export function createBallTexture({
  color = '#fff',
  number = 1,
  ballVariety = 32,
  darkTheme = false,
}: {
  color?: string;
  number?: number;
  ballVariety?: number;
  darkTheme?: boolean;
}): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = tsize * 2;
  canvas.height = tsize;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // todo: noise/variance

  if (number === -1) {
    const dotSize = tsize / 16;

    // Red dots and stripes for cue ball
    ctx.fillStyle = 'red';
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
    ctx.fillStyle = darkTheme ? '#202020' : '#fff';
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

    ctx.fillStyle = darkTheme ? '#fff' : '#000';
    ctx.font = `${tsize / 5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let k = 0; k < 2; k++) {
      ctx.fillText(String(number), tsize / 2 + k * tsize, tsize / 2);
    }

    if (number >= 9) {
      ctx.fillStyle = darkTheme ? '#202020' : '#fff';
      ctx.fillRect(0, 0, tsize * 2, tsize / 4);
      ctx.fillRect(0, (tsize * 3) / 4, tsize * 2, tsize / 4);
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
