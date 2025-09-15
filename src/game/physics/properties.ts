export const properties = {
  // physics - cm/s
  frictionSlide: 10,
  frictionSpin: 0.01,
  frictionRoll: 10,
  restitutionBallBall: 0.95,
  restitutionBallCushion: 0.8,
  restitutionBallPocket: 0.5,
  gravity: 1,
  epsilon: 1e-4,
  cueDefaultForce: 75,
  cueMaxForce: 150,

  // objects (cm)
  ballRadius: 2.8575,
  cueLength: 120,
  cueTipRadius: 0.6,
  cueHandleRadius: 1,
  cuePullBackTime: 0.1,

  // table (cm)
  tableWidth: 112,
  tableLength: 224,
  pocketCornerRadius: 8.75,
  pocketEdgeRadius: 6.75,
  pocketDepth: 24,
  pocketOverlap: 2,
  pocketCornerOverlap: 1.5,
  pocketEdgeOverlap: 2,
  bumperWidth: 4,

  // simulation
  maxIterations: 10_000,
  trackingPointDist: 10,
  updatesPerSecond: 100,

  // visuals
  projectionOpacity: 0.25,
};
