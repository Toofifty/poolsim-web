import {
  CanvasTexture,
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
  type Color,
} from 'three';
import { properties } from '../../../../common/simulation/physics/properties';
import { settings } from '../../store/settings';
import type { ThemeObject } from '../../store/theme';
import { Game } from '../../game';

const hex = (color: Color) => '#' + color.getHexString();

export const createTableClothTexture = (theme: ThemeObject) => {
  const scale = settings.highDetail ? 2000 : 500;

  const tableLength = properties.tableLength * scale;
  const tableWidth = properties.tableWidth * scale;
  const pocketCornerRadius = properties.pocketCornerRadius * scale;

  const canvas = document.createElement('canvas');
  canvas.width = tableLength + pocketCornerRadius * 2;
  canvas.height = tableWidth + pocketCornerRadius * 2;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = hex(theme.table.colorCloth);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff22';
  ctx.strokeStyle = '#ffffff22';
  ctx.lineWidth = 0.002 * scale;
  // head line
  const headX = tableLength / 4 + pocketCornerRadius;
  ctx.fillRect(
    headX,
    pocketCornerRadius * 1.5,
    0.001 * scale,
    tableWidth - pocketCornerRadius
  );
  // head
  ctx.beginPath();
  ctx.ellipse(
    headX,
    tableWidth / 2 + pocketCornerRadius,
    0.002 * scale,
    0.002 * scale,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  // foot
  ctx.beginPath();
  const footX = (tableLength * 3) / 4 + pocketCornerRadius;
  ctx.ellipse(
    footX,
    tableWidth / 2 + pocketCornerRadius,
    0.002 * scale,
    0.002 * scale,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  drawRack(
    ctx,
    scale,
    (tableLength * 3) / 4 + pocketCornerRadius,
    tableWidth / 2 + pocketCornerRadius
  );

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

type XY = { x: number; y: number };

const drawRack = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  cx: number,
  cy: number
) => {
  const r = properties.ballRadius * scale;
  const side = 8.5 * r + 2;
  const height = 4.25 * r * Math.sqrt(3) + 0.5;
  const A = { x: cx, y: cy };
  const B = { x: cx + height, y: cy - side / 2 };
  const C = { x: cx + height, y: cy + side / 2 };

  const perp = (p1: XY, p2: XY) => {
    const dir = { x: p2.x - p1.x, y: p2.y - p1.y };
    const l = Math.hypot(dir.x, dir.y);
    const norm = { x: dir.x / l, y: dir.y / l };
    return { x: -norm.y, y: norm.x };
  };

  const pAB = perp(A, B);
  const pBC = perp(B, C);
  const pCA = perp(C, A);
  const rp = r * 1.1;

  const a1 = { x: A.x - pCA.x * rp, y: A.y - pCA.y * rp };
  const a2 = { x: A.x - pAB.x * rp, y: A.y - pAB.y * rp };
  const b1 = { x: B.x - pAB.x * rp, y: B.y - pAB.y * rp };
  const b2 = { x: B.x - pBC.x * rp, y: B.y - pBC.y * rp };
  const c1 = { x: C.x - pBC.x * rp, y: C.y - pBC.y * rp };
  const c2 = { x: C.x - pCA.x * rp, y: C.y - pCA.y * rp };
  const aa1 = Math.atan2(a1.y - A.y, a1.x - A.x);
  const aa2 = Math.atan2(a2.y - A.y, a2.x - A.x);
  const ba1 = Math.atan2(b1.y - B.y, b1.x - B.x);
  const ba2 = Math.atan2(b2.y - B.y, b2.x - B.x);
  const ca1 = Math.atan2(c1.y - C.y, c1.x - C.x);
  const ca2 = Math.atan2(c2.y - C.y, c2.x - C.x);

  ctx.beginPath();
  ctx.moveTo(a2.x, a2.y);
  ctx.lineTo(b1.x, b1.y);
  ctx.arc(B.x, B.y, rp, ba1, ba2);
  ctx.lineTo(c1.x, c1.y);
  ctx.arc(C.x, C.y, rp, ca1, ca2);
  ctx.lineTo(a1.x, a1.y);
  ctx.arc(A.x, A.y, rp, aa1, aa2);
  ctx.closePath();
  ctx.stroke();
};

export const createTableClothNormalTexture = (
  width?: number,
  height?: number
) => {
  const scale = settings.highDetail ? 2000 : 1000;
  const tableLength = properties.tableLength * scale;
  const tableWidth = properties.tableWidth * scale;
  const pocketCornerRadius = properties.pocketCornerRadius * scale;
  const canvas = document.createElement('canvas');
  canvas.width = (width ?? 0) * scale || tableLength + pocketCornerRadius * 2;
  canvas.height = (height ?? 0) * scale || tableWidth + pocketCornerRadius * 2;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f00';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // overlay subtle noise
  const noise = ctx.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < noise.data.length; i += 4) {
    const val = 128 + Math.random() * 30; // random gray
    noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = val;
    noise.data[i + 3] = 20; // alpha (make it subtle)
  }
  ctx.putImageData(noise, 0, 0);

  const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const dst = ctx.createImageData(canvas.width, canvas.height);

  const strength = 0.005;
  // 2. Convert grayscale → normal map
  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      const i = (y * canvas.width + x) * 4;

      const hL = src.data[i - 4] / 255; // left
      const hR = src.data[i + 4] / 255; // right
      const hU = src.data[i - canvas.width * 4] / 255; // up
      const hD = src.data[i + canvas.width * 4] / 255; // down

      // gradient (scale controls noise frequency, strength controls depth)
      const dx = (hR - hL) * strength;
      const dy = (hD - hU) * strength;

      // normal vector
      let nx = dx;
      let ny = dy;
      let nz = 1.0 / scale;
      const length = Math.hypot(nx, ny, nz);
      nx /= length;
      ny /= length;
      nz /= length;

      // encode [−1,1] → [0,255]
      dst.data[i] = Math.floor((nx * 0.5 + 0.5) * 255);
      dst.data[i + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      dst.data[i + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      dst.data[i + 3] = 255;
    }
  }

  ctx.putImageData(dst, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};
