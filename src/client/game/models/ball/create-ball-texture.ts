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

export function createBallCanvas(
  theme: ThemeObject,
  id: number,
  { height, width }: { height: number; width: number }
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  if (theme.balls.useLeopardPrint && id !== 0) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = hex(new Color(theme.balls.colors[id]));
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ctx.globalCompositeOperation = 'destination-in';
    // ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  } else {
    ctx.fillStyle = hex(new Color(theme.balls.colors[id]));
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // todo: noise/variance

  if (id === 0) {
    const dotSize = height / 32;

    // Red dots and stripes for cue ball
    ctx.fillStyle = hex(theme.balls.colorCueBallAccent);
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.ellipse(
        (height / 2) * k,
        height / 2,
        dotSize,
        dotSize,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.fillRect(0, 0, height * 2, dotSize);
    ctx.fillRect(0, height - dotSize, height * 2, dotSize);
  } else {
    const numberSize = height / 6;

    // Numbered balls
    ctx.fillStyle = hex(theme.balls.colorBallCircle);
    ctx.strokeStyle = hex(theme.balls.colorBallNumber);
    ctx.lineWidth = height / 64;
    ctx.beginPath();
    ctx.ellipse(
      height / 2,
      height / 2,
      numberSize,
      numberSize,
      0,
      0,
      Math.PI * 2
    );
    // ctx.ellipse(
    //   (height * 3) / 2,
    //   height / 2,
    //   numberSize,
    //   numberSize,
    //   0,
    //   0,
    //   Math.PI * 2
    // );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = hex(theme.balls.colorBallNumber);
    ctx.font = `${height / 5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const offsetY = settings.detail === GraphicsDetail.High ? 4 : 1;
    ctx.fillText(String(id), height / 2, height / 2 + offsetY);

    if (id === 6 || id === 9) {
      ctx.fillStyle = hex(theme.balls.colorBallNumber);
      ctx.beginPath();
      ctx.arc(
        height / 2,
        height / 2,
        height / 10,
        Math.PI / 3,
        (Math.PI * 2) / 3
      );
      ctx.stroke();
    }

    if (id >= 9) {
      ctx.fillStyle = hex(theme.balls.colorBallCircle);
      ctx.fillRect(0, 0, height * 2, height / 4);
      ctx.fillRect(0, (height * 3) / 4, height * 2, height / 4);
    }
  }

  return canvas;
}

export function createBallTexture(
  theme: ThemeObject,
  id: number
): CanvasTexture {
  const tsize = getTextureSize();
  const texture = new CanvasTexture(
    createBallCanvas(theme, id, { height: tsize, width: tsize * 2 })
  );
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
