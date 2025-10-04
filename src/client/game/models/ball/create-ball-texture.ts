import { CanvasTexture, Color, LinearFilter, SRGBColorSpace } from 'three';
import leopardUrl from '../../../assets/leopard.jpg';
import { GraphicsDetail, settings } from '../../store/settings';
import type { ThemeObject } from '../../store/theme';

const img = new Image();
img.src = leopardUrl;

const hex = (color: Color) => '#' + color.getHexString();

const getTextureSize = () => {
  switch (settings.detail) {
    case GraphicsDetail.High:
      return 512;
    case GraphicsDetail.Medium:
      return 256;
    case GraphicsDetail.Low:
      return 64;
  }
};

export function createBallTexture(
  theme: ThemeObject,
  number: number
): CanvasTexture {
  const tsize = getTextureSize();

  const canvas = document.createElement('canvas');
  canvas.width = tsize * 2;
  canvas.height = tsize;
  const ctx = canvas.getContext('2d')!;

  // Background
  if (theme.balls.useLeopardPrint && number !== 0) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = hex(new Color(theme.balls.colors[number]));
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ctx.globalCompositeOperation = 'destination-in';
    // ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  } else {
    ctx.fillStyle = hex(new Color(theme.balls.colors[number]));
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // todo: noise/variance

  if (number === 0) {
    const dotSize = tsize / 32;

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
    const numberSize = tsize / 6;

    // Numbered balls
    ctx.fillStyle = hex(theme.balls.colorBallCircle);
    ctx.strokeStyle = hex(theme.balls.colorBallNumber);
    ctx.lineWidth = tsize / 64;
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
    // ctx.ellipse(
    //   (tsize * 3) / 2,
    //   tsize / 2,
    //   numberSize,
    //   numberSize,
    //   0,
    //   0,
    //   Math.PI * 2
    // );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = hex(theme.balls.colorBallNumber);
    ctx.font = `${tsize / 5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const offsetY = settings.detail === GraphicsDetail.High ? 4 : 1;
    ctx.fillText(String(number), tsize / 2, tsize / 2 + offsetY);

    if (number === 6 || number === 9) {
      ctx.fillStyle = hex(theme.balls.colorBallNumber);
      ctx.beginPath();
      ctx.arc(tsize / 2, tsize / 2, tsize / 10, Math.PI / 3, (Math.PI * 2) / 3);
      ctx.stroke();
    }

    if (number >= 9) {
      ctx.fillStyle = hex(theme.balls.colorBallCircle);
      ctx.fillRect(0, 0, tsize * 2, tsize / 4);
      ctx.fillRect(0, (tsize * 3) / 4, tsize * 2, tsize / 4);
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
