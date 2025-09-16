export const properties = {
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
  cueMaxForce: 1.5,

  // objects (m)
  ballRadius: 0.028575,
  cueLength: 1.2,
  cueTipRadius: 0.006,
  cueHandleRadius: 0.01,
  cuePullBackTime: 0.001,

  // table (m)
  tableWidth: 1.12,
  tableLength: 2.24,
  pocketCornerRadius: 0.0875,
  pocketEdgeRadius: 0.0675,
  pocketDepth: 0.24,
  pocketOverlap: 0.02,
  pocketCornerOverlap: 0.02,
  pocketEdgeOverlap: 0.02,
  bumperWidth: 0.04,
  railPadding: 0.08,

  // simulation
  maxIterations: 10_000,
  trackingPointDist: 10,
  updatesPerSecond: 100,

  // visuals
  projectionOpacity: 0.25,
};
