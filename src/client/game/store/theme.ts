import { Color } from 'three';
import { proxy, subscribe } from 'valtio';

export type TableTheme = 'green' | 'blue' | 'red' | 'pink';
export type LightingTheme = 'normal' | 'neon';

export type ThemeObject = {
  balls: {
    colorCueBall: Color;
    colorCueBallAccent: Color;
    colorBallCircle: Color;
    colorBallNumber: Color;
    colors: number[];
  };
  table: {
    theme: TableTheme;
    colorCloth: Color;
    colorRail: Color;
    colorPocketLiner: Color;
    colorDiamond: Color;
  };
  cue: {
    colorTip: Color;
    colorShaft: Color;
    colorHandle: Color;
  };
  lighting: {
    theme: LightingTheme;
  };
};

const readFromStorage = <T>(def: T): T => {
  return JSON.parse(localStorage.getItem('pool:theme') ?? 'null') || def;
};

export const theme = proxy(
  readFromStorage({
    table: 'blue' as TableTheme,
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
        colorCloth: new Color(0x227722),
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

export const makeTheme = (): ThemeObject => ({
  balls: {
    colorCueBall: new Color(0xffffff),
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
  },
  cue: {
    colorTip: new Color(0x8888ff),
    colorShaft: new Color(0x812e04),
    colorHandle: new Color(0x000000),
  },
  table: getTableTheme(),
  lighting: { theme: theme.lighting },
});

export const themed = (fn: (theme: ThemeObject) => void) => {
  fn(makeTheme());
  subscribe(theme, () => fn(makeTheme()));
};
