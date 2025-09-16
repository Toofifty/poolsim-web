import { Color } from 'three';

export const properties = {
  highDetail: true,

  // physics - cm/s
  frictionSlide: 0.1,
  frictionSpin: 0.0001,
  frictionRoll: 0.1,
  restitutionBallBall: 0.95,
  restitutionBallCushion: 0.8,
  restitutionBallPocket: 0.5,
  gravity: 0.01,
  epsilon: 1e-6,
  cueDefaultForce: 0.75,
  cueMaxForce: 2.5,

  // objects (m)
  ballRadius: 0.028575,
  cueLength: 1.2,
  cueTipRadius: 0.006,
  cueHandleRadius: 0.01,
  cuePullBackTime: 500,
  cueShootTime: 100,

  // table (m)
  tableWidth: 1.12,
  tableLength: 2.24,
  pocketCornerRadius: 0.0875,
  pocketEdgeRadius: 0.0675,
  pocketDepth: 0.24,
  pocketOverlap: 0.02,
  pocketCornerOverlap: 0.02,
  pocketEdgeOverlap: 0.02,
  pocketBevel: 0.005,
  bumperWidth: 0.04,
  railPadding: 0.02,
  diamondWidth: 0.015,

  // simulation
  maxIterations: 10_000,
  trackingPointDist: 10,
  updatesPerSecond: 100,

  // visuals
  projectionOpacity: 0.25,
  // colors
  colorCueBall: new Color(0xffffff),
  colorCueBallAccent: new Color(0xff0000),
  colorBallCircle: new Color(0xffffff),
  colorBallNumber: new Color(0x000000),
  color1Ball: new Color(0xffb200),
  color2Ball: new Color(0x002564),
  color3Ball: new Color(0x990100),
  color4Ball: new Color(0x60067f),
  color5Ball: new Color(0xeb5300),
  color6Ball: new Color(0x005900),
  color7Ball: new Color(0x500003),
  color8Ball: new Color(0x010101),
  // 9-15 repeat above colors

  colorTableCloth: new Color(0x227722),
  colorTableCushion: new Color(0x337733),
  colorTableRail: new Color(0x683104),
  colorTableRailDiamond: new Color(0xffffff),
  colorPocketLiner: new Color(0x262626),
};
