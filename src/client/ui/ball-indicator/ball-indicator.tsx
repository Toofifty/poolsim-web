import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';
import { RuleSet } from '../../../common/simulation/physics';
import { EightBallState } from '../../../common/simulation/table-state';
import { assert } from '../../../common/util';
import { createBallCanvas } from '../../game/models/ball/create-ball-texture';
import { makeTheme, theme } from '../../game/store/theme';
import {
  getPlayer8BallState,
  useGameEvent,
} from '../../pages/game/use-game-events';
import { Surface } from '../surface';
import './ball-indicator.scss';

const setInArray = <T,>(arr: (T | undefined)[], value: T) => {
  if (arr.indexOf(value) > -1) return arr;

  const firstEmpty = arr.indexOf(undefined);
  const newArr = [...arr];
  newArr[firstEmpty] = value;
  return newArr;
};

const opposite = (state: 'solids' | 'stripes') =>
  state === 'solids' ? 'stripes' : 'solids';

export const BallIndicator = () => {
  const [ruleSet, setRuleSet] = useState<RuleSet>(RuleSet._8Ball);

  useGameEvent(
    'setup-table',
    ({ detail: { ruleSet } }) => {
      setRuleSet(ruleSet);
    },
    []
  );

  return ruleSet === RuleSet._8Ball ? (
    <EightBallIndicator />
  ) : (
    <NineBallIndicator />
  );
};

const EightBallIndicator = () => {
  const [player1Balls, setPlayer1Balls] = useState<(number | undefined)[]>(() =>
    new Array(7).fill(undefined)
  );
  const [player2Balls, setPlayer2Balls] = useState<(number | undefined)[]>(() =>
    new Array(7).fill(undefined)
  );
  const [unclaimedBalls, setUnclaimedBalls] = useState<number[]>([]);
  const [eightBallState, setEightBallState] = useState<EightBallState>(
    EightBallState.Open
  );
  const [isPlayer1, setIsPlayer1] = useState(false);

  const playerState = getPlayer8BallState(eightBallState, isPlayer1);

  const sortAndAddBalls = useCallback(
    (ids: number[], eightBallState: EightBallState, isPlayer1: boolean) => {
      const playerState = getPlayer8BallState(eightBallState, isPlayer1);
      assert(playerState !== 'open');

      const solids = ids.filter((id) => id < 8);
      const stripes = ids.filter((id) => id > 8);

      const addToPlayer1 = playerState === 'solids' ? solids : stripes;
      const addToPlayer2 = playerState === 'stripes' ? solids : stripes;

      setPlayer1Balls((balls) =>
        addToPlayer1.reduce((b, id) => setInArray(b, id), balls)
      );
      setPlayer2Balls((balls) =>
        addToPlayer2.reduce((b, id) => setInArray(b, id), balls)
      );

      if (ids.includes(8)) {
        setUnclaimedBalls([8]);
      }
    },
    []
  );

  useGameEvent(
    'setup-table',
    () => {
      setPlayer1Balls(new Array(7).fill(undefined));
      setPlayer2Balls(new Array(7).fill(undefined));
      setUnclaimedBalls([]);
      setEightBallState(EightBallState.Open);
      setIsPlayer1(false);
    },
    []
  );

  useGameEvent(
    '8-ball-state-change',
    ({ detail: { state, isPlayer1 } }) => {
      setEightBallState(state);
      setIsPlayer1(isPlayer1);

      console.log({ state, isPlayer1 });

      if (unclaimedBalls.length > 0) {
        sortAndAddBalls(unclaimedBalls, state, isPlayer1);
        setUnclaimedBalls([]);
      }
    },
    [unclaimedBalls]
  );

  useGameEvent(
    'balls-potted',
    ({ detail: { ids } }) => {
      if (eightBallState === EightBallState.Open) {
        setUnclaimedBalls((b) => [...b, ...ids]);
        return;
      }

      sortAndAddBalls(ids, eightBallState, isPlayer1);
    },
    [eightBallState, isPlayer1]
  );

  return (
    <div className="ball-indicator__container">
      <Surface>
        <div className="group lower ball-indicator__group">
          <span>You{playerState !== 'open' && ` (${playerState})`}</span>
          {player1Balls.map((id, i) => (
            <Ball key={i} id={id} />
          ))}
        </div>
      </Surface>
      {unclaimedBalls.length > 0 && (
        <Surface>
          <div className="group lower ball-indicator__group">
            {unclaimedBalls.map((id, i) => (
              <Ball key={i} id={id} />
            ))}
          </div>
        </Surface>
      )}
      <Surface>
        <div className="group lower ball-indicator__group">
          {player2Balls.map((id, i) => (
            <Ball key={i} id={id} />
          ))}
          <span>
            Opponent
            {playerState !== 'open' && ` (${opposite(playerState)})`}
          </span>
        </div>
      </Surface>
    </div>
  );
};

const NineBallIndicator = () => {
  const [balls, setBalls] = useState<(number | undefined)[]>(() =>
    new Array(9).fill(undefined)
  );

  useGameEvent(
    'setup-table',
    () => {
      setBalls(new Array(9).fill(undefined));
    },
    []
  );

  useGameEvent(
    'balls-potted',
    ({ detail: { ids } }) => {
      setBalls((v) => {
        ids.forEach((id) => (v[id - 1] = id));
        return [...v];
      });
    },
    []
  );

  return (
    <div className="ball-indicator__container">
      <Surface>
        <div className="group lower ball-indicator__group">
          {balls.map((id, i) => (
            <Ball key={i} id={id} />
          ))}
        </div>
      </Surface>
    </div>
  );
};

const Ball = ({ id }: { id?: number }) => {
  const themeSnapshot = useSnapshot(theme);
  const root = useRef<HTMLDivElement>(null);

  const canvas = useMemo(() => {
    if (id === undefined) return;
    return createBallCanvas(makeTheme(), id, { height: 100, width: 100 });
  }, [id, themeSnapshot]);

  useEffect(() => {
    if (!canvas) return;

    root.current?.appendChild(canvas);

    return () => {
      root.current?.removeChild(canvas);
    };
  }, [canvas]);

  return (
    <div className="ball__container">
      {id !== undefined && <div ref={root} className="ball" />}
    </div>
  );
};
