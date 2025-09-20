export const params = {
  ball: {
    /** M */
    mass: 0.170097,
    /** R */
    radius: 0.028575,
    /** u_s */
    frictionSlide: 0.2,
    /** u_r */
    frictionRoll: 0.1,
    /** u_sp */
    frictionSpin: (0.028575 * 4) / 9,
    /** u_b */
    frictionBall: 0.05,
    /** e_b */
    restitutionBall: 0.95,
    /** e_p */
    restitutionPocket: 0.5,
    /** e_c */
    restitutionCushion: 0.85,
    /** f_c */
    frictionCushion: 0.2,
    /** g */
    gravity: 9.81,
  },
  cushion: {
    /** h = 1.2R */
    height: 0.028575 * 1.2,
  },
};
