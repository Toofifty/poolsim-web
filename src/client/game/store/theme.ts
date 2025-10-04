import { Color } from 'three';
import { proxy, subscribe } from 'valtio';

export type TableTheme = 'green' | 'blue' | 'red' | 'pink';
export type LightingTheme = 'normal' | 'neon';
export type CueTheme = 'standard' | 'carbon';
export type BallTheme = 'standard' | 'dark' | 'chrome' | 'leopard';

export type ThemeObject = {
  balls: {
    roughness: number;
    metalness: number;
    colorCueBallAccent: Color;
    colorBallCircle: Color;
    colorBallNumber: Color;
    colors: number[];
    useLeopardPrint: boolean;
  };
  table: {
    theme: TableTheme;
    colorCloth: Color;
    colorRail: Color;
    colorPocketLiner: Color;
    colorDiamond: Color;
  };
  cue: {
    metalness: number;
    colorTip: Color;
    colorStrip: Color;
    colorShaft: Color;
    colorHandle: Color;
  };
  lighting: {
    theme: LightingTheme;
  };
};

const readFromStorage = <T>(def: T): T => {
  return {
    ...def,
    ...JSON.parse(localStorage.getItem('pool:theme') ?? '{}'),
  };
};

export const theme = proxy(
  readFromStorage({
    table: 'blue' as TableTheme,
    cue: 'standard' as CueTheme,
    ball: 'standard' as BallTheme,
    lighting: 'normal' as LightingTheme,
  })
);

subscribe(theme, () => {
  localStorage.setItem('pool:theme', JSON.stringify(theme));
});

const getTableTheme = (): ThemeObject['table'] => {
  const base = {
    theme: theme.table,
    colorPocketLiner: new Color(0x262626),
    colorDiamond: new Color(0xffffff),
  };

  switch (theme.table) {
    case 'blue':
      return {
        ...base,
        colorCloth: new Color(0x646cff),
        colorRail: new Color(0x252525),
      };
    case 'green':
      return {
        ...base,
        colorCloth: new Color(0x226622),
        colorRail: new Color(0x683104),
      };
    case 'pink':
      return {
        ...base,
        colorCloth: new Color(0xa73060),
        colorRail: new Color(0x304657),
      };
    case 'red':
      return {
        ...base,
        colorCloth: new Color(0xff3232),
        colorRail: new Color(0x252525),
      };
  }
};

const getCueTheme = (): ThemeObject['cue'] => {
  const base = {
    metalness: 0,
    colorTip: new Color(0x8888ff),
    colorStrip: new Color(0xffffff),
    colorShaft: new Color(0xdab573),
    colorHandle: new Color(0x500003),
  };

  switch (theme.cue) {
    case 'carbon':
      return {
        ...base,
        metalness: 0.5,
        colorShaft: new Color(0x444444),
        colorHandle: new Color(0x000000),
      };
    case 'standard':
    default:
      return base;
  }
};

const getBallTheme = (): ThemeObject['balls'] => {
  const base = {
    roughness: 0,
    metalness: 0,
    colorCueBallAccent: new Color(0xff0000),
    colorBallCircle: new Color(0xffffff),
    colorBallNumber: new Color(0x000000),
    colors: [
      0xffffff, // cue ball
      0xffb200,
      0x002564,
      0x990100,
      0x60067f,
      0xeb5300,
      0x005900,
      0x500003,
      0x010101,
      0xffb200,
      0x002564,
      0x990100,
      0x60067f,
      0xeb5300,
      0x005900,
      0x500003,
    ],
    useLeopardPrint: false,
  };

  switch (theme.ball) {
    case 'dark':
      return {
        ...base,
        colorBallNumber: new Color(0xffffff),
        colorCueBallAccent: new Color(0xffffff),
        colorBallCircle: new Color(0x333333),
        colors: [0x333333, ...base.colors.slice(1)],
      };
    case 'chrome':
      return {
        ...base,
        roughness: 0,
        metalness: 0.75,
        colorCueBallAccent: new Color(0x304657),
        colors: [0xffffff, ...base.colors.slice(1).map(() => 0x444444)],
      };
    case 'leopard':
      return {
        ...base,
        useLeopardPrint: true,
      };
    case 'standard':
    default:
      return base;
  }
};

export const makeTheme = (): ThemeObject => ({
  balls: getBallTheme(),
  cue: getCueTheme(),
  table: getTableTheme(),
  lighting: { theme: theme.lighting },
});

export const themed = (
  fn: (theme: ThemeObject) => void,
  { init = true }: { init?: boolean } = {}
) => {
  if (init) fn(makeTheme());
  return subscribe(theme, () => fn(makeTheme()));
};
