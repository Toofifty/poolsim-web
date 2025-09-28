import { Color } from 'three';

export const properties = {
  useWorkerForAimAssist: true,
  useWorkerForAI: true,

  // physics - cm/s
  frictionSlide: 0.1, // u_s
  frictionSpin: 0.0001, // u_sp
  frictionRoll: 0.1, // u_r
  restitutionBallBall: 0.95, // u_b
  restitutionBallCushion: 0.8, //
  restitutionBallPocket: 0.5,
  restitution: 0.1, // e_b ??
  gravity: 0.01,
  epsilon: 1e-6,
  cueDefaultForce: 0.75,
  cueMaxForce: 3,

  // objects (m)
  ballRadius: 0.028575,
  cueLength: 1.4732,
  cueTipRadius: 0.006,
  cueHandleRadius: 0.01,
  cuePullBackTime: 500,
  cueShootTime: 100,

  // table (m)
  tableWidth: 1.12,
  tableLength: 2.24,
  pocketCornerRadius: 0.07,
  pocketEdgeRadius: 0.06,
  pocketDepth: 0.24,
  pocketOverlap: 0.02,
  pocketCornerOverlap: 0.02,
  pocketCornerGirth: 0.02,
  pocketEdgeOverlap: 0.025,
  pocketBevel: 0.005,
  bumperWidth: 0.04,
  railPadding: 0.02,
  diamondWidth: 0.015,

  // simulation
  maxIterations: 1_000,
  trackingPointDist: 2,
  updatesPerSecond: 300,

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

  // green/brown
  // colorTableCloth: new Color(0x227722),
  // colorTableRail: new Color(0x683104),

  // blue/black
  colorTableCloth: new Color(0x646cff),
  colorTableRail: new Color(0x252525),

  // red/black
  // colorTableCloth: new Color(0xff3232),
  // colorTableRail: new Color(0x252525),

  colorTableRailDiamond: new Color(0xffffff),
  colorPocketLiner: new Color(0x262626),
  colorCueShaft: new Color(0x812e04),
  colorCueTip: new Color(0x8888ff),
  colorCueHandle: new Color(0x000000),
};
