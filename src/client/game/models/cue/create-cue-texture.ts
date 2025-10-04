import { CanvasTexture, SRGBColorSpace, type Color } from 'three';
import type { Params } from '../../../../common/simulation/physics';
import { GraphicsDetail, settings } from '../../store/settings';
import type { ThemeObject } from '../../store/theme';

const hex = (color: Color) => '#' + color.getHexString();

const getScale = () => {
  switch (settings.detail) {
    case GraphicsDetail.High:
      return 2000;
    case GraphicsDetail.Medium:
      return 500;
    case GraphicsDetail.Low:
      return 200;
  }
};

export const createCueTexture = (params: Params, theme: ThemeObject) => {
  const scale = getScale();

  const canvas = document.createElement('canvas');
  canvas.width = params.cue.handleRadius * 2 * Math.PI * scale;
  canvas.height = params.cue.length * scale;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = hex(theme.cue.colorShaft);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = hex(theme.cue.colorStrip);
  ctx.fillRect(0, 0, canvas.width, canvas.height / 200);

  const spikes = 2;
  const spikeTop = canvas.height / 2;
  // extra .1 ensures it overlaps handle color
  const spikeBottom = (canvas.height * 3.1) / 4;

  ctx.fillStyle = hex(theme.cue.colorHandle);
  ctx.beginPath();
  ctx.moveTo(0, spikeBottom);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo((canvas.width * (i + 0.5)) / spikes, spikeTop);
    ctx.lineTo((canvas.width * (i + 1)) / spikes, spikeBottom);
  }
  ctx.lineTo(0, spikeBottom);
  ctx.closePath();
  ctx.fill();

  ctx.fillRect(0, spikeBottom, canvas.width, canvas.height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};
