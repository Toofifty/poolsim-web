import { EightBallState, Ruleset } from '@common/simulation/physics';
import { assert } from '@common/util';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';
import { createBallCanvas } from '../../game/models/ball/create-ball-texture';
import { makeTheme, theme } from '../../game/store/theme';
import { Surface } from '../surface';
import { useGameBinding } from '../use-game-binding';
import { getPlayer8BallState, useGameEvent } from '../use-game-event';
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
  const ruleset = useGameBinding(
    'game/setup',
    (data) => data.ruleset,
    Ruleset._8Ball
  );

  return ruleset === Ruleset._8Ball ? (
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

  const currentPlayer = useGameBinding(
    'game/current-player-update',
    (p) => p,
    0
  );

  const playerState = getPlayer8BallState(eightBallState, currentPlayer === 0);

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
    'game/setup',
    () => {
      setPlayer1Balls(new Array(7).fill(undefined));
      setPlayer2Balls(new Array(7).fill(undefined));
      setUnclaimedBalls([]);
      setEightBallState(EightBallState.Open);
    },
    []
  );

  useGameEvent(
    'game/8-ball-state-change',
    ({ state }) => {
      setEightBallState(state);

      if (unclaimedBalls.length > 0) {
        sortAndAddBalls(unclaimedBalls, state, currentPlayer === 0);
        setUnclaimedBalls([]);
      }
    },
    [unclaimedBalls, currentPlayer]
  );

  const addBall = useCallback(
    (id: number) => {
      if (id === 0) return;

      if (eightBallState === EightBallState.Open) {
        setUnclaimedBalls((b) => [...b, id]);
        return;
      }

      sortAndAddBalls([id], eightBallState, currentPlayer === 0);
    },
    [eightBallState, currentPlayer]
  );

  useGameEvent(
    'game/pocket-collision',
    ({ initiator: { id } }) => addBall(id),
    [addBall]
  );

  useGameEvent('game/ball-ejected', (id) => addBall(id), [addBall]);

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
    'game/setup',
    () => {
      setBalls(new Array(9).fill(undefined));
    },
    []
  );

  useGameEvent(
    'game/pocket-collision',
    ({ initiator: { id } }) => {
      if (id === 0) return;

      setBalls((v) => {
        v[id - 1] = id;
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
