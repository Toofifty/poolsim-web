import {
  CanvasTexture,
  NearestFilter,
  NearestMipMapNearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';

export const createUVDebugTexture = (
  width: number,
  height: number,
  scale: number = 1000,
  cells: number = 16
) => {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;

  const cellSize = Math.max(canvas.width, canvas.height) / cells;

  const cellsY = Math.ceil(canvas.height / cellSize);
  const cellsX = Math.ceil(canvas.width / cellSize);

  ctx.font = `${Math.floor(cellSize / 4)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let y = 0; y < cellsY; y++) {
    for (let x = 0; x < cellsX; x++) {
      const isWhite = (x + y) % 2 === 0;
      ctx.fillStyle = isWhite ? '#ffffff' : '#444444';
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

      ctx.fillStyle = isWhite ? '#444444' : '#ffffff';
      ctx.fillText(
        `${x},${y}`,
        x * cellSize + cellSize / 2,
        y * cellSize + cellSize / 2
      );
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestMipMapNearestFilter;

  return texture;
};
