import {
  Accordion,
  Button,
  Divider,
  Flex,
  NumberInput,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import type { ReactNode } from 'react';
import {
  AimAssistMode,
  RuleSet,
  type StaticParams,
} from '../../common/simulation/physics';
import { getAimAssistName, getRuleSetName } from '../util/enums';
import type { DeepKeyOf } from '../util/types';
import './param-editor.scss';

type OnEditFn = (key: DeepKeyOf<StaticParams>, value: unknown) => void;

const Item = ({
  title,
  note,
  children,
}: {
  title: string;
  note?: ReactNode;
  children: ReactNode;
}) => (
  <Flex h="36px" gap="lg" justify="space-between" align="center" mb="sm">
    {note ? (
      <Tooltip label={note}>
        <Text style={{ cursor: 'default' }} c="gray">
          {title}
        </Text>
      </Tooltip>
    ) : (
      <Text style={{ cursor: 'default' }} c="gray">
        {title}
      </Text>
    )}
    <Divider style={{ borderTop: '1px dashed #FFF2' }} flex={1} />
    <Flex gap="xs">{children}</Flex>
  </Flex>
);

const SelectOrText = <T extends number>({
  value,
  options,
  getLabel,
  onChange,
}: {
  value: T;
  options: T[];
  getLabel: (value: T) => string;
  onChange?: (value: T) => void;
}) =>
  onChange ? (
    <Select
      withCheckIcon={false}
      value={value.toString()}
      data={options.map((value) => ({
        value: value.toString(),
        label: getLabel(value),
      }))}
      onChange={(v) => onChange(+(v ?? value) as T)}
      comboboxProps={{ transitionProps: { transition: 'fade' } }}
    />
  ) : (
    <Text c="white">{getLabel(value)}</Text>
  );

const NumberInputOrText = ({
  value,
  min,
  max,
  prefix,
  suffix,
  decimalScale = 2,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  decimalScale?: number;
  onChange?: (value: number) => void;
}) =>
  onChange ? (
    <NumberInput
      className="number-input"
      value={value}
      prefix={prefix}
      suffix={suffix}
      decimalScale={decimalScale}
      step={0.01}
      stepHoldInterval={0.01}
      onChange={(v) => onChange(+v)}
      min={min}
      max={max}
    />
  ) : (
    <Text c="white">
      {prefix}
      {value.toFixed(decimalScale)}
      {suffix}
    </Text>
  );

export const ParamEditor = ({
  params,
  full,
  onEdit,
  onReset,
}: {
  params: StaticParams;
  full?: boolean;
  onEdit?: OnEditFn;
  onReset?: () => void;
}) => {
  return (
    <Stack justify="space-between" mih="100%">
      <Stack gap={0}>
        {full && (
          <>
            <Item title="Game mode">
              <SelectOrText
                value={params.game.ruleSet}
                options={[RuleSet._8Ball, RuleSet._9Ball, RuleSet.Sandbox]}
                getLabel={getRuleSetName}
                onChange={onEdit && ((v) => onEdit('game.ruleSet', v))}
              />
            </Item>
            <Item title="Guidelines">
              <SelectOrText
                value={params.game.aimAssist}
                options={[
                  AimAssistMode.Off,
                  AimAssistMode.FirstContact,
                  AimAssistMode.FirstBallContact,
                  AimAssistMode.Full,
                ]}
                getLabel={getAimAssistName}
                onChange={onEdit && ((v) => onEdit('game.aimAssist', v))}
              />
            </Item>
            <Divider style={{ borderTop: '1px solid #FFF2' }} my="md" />
          </>
        )}
        <Accordion variant="unstyled">
          <Accordion.Item value="table">
            <Accordion.Control px="0">
              <Text fw="bold" c="gray">
                Table
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Item title="Length">
                <NumberInputOrText
                  value={params.table.length}
                  suffix="m"
                  min={0.1}
                  onChange={onEdit && ((v) => onEdit('table.length', v))}
                />
              </Item>
              <Item title="Width">
                <NumberInputOrText
                  value={params.table.width}
                  suffix="m"
                  min={0.1}
                  onChange={onEdit && ((v) => onEdit('table.width', v))}
                />
              </Item>
            </Accordion.Panel>
          </Accordion.Item>
          <Divider style={{ borderTop: '1px solid #FFF2' }} />
          <Accordion.Item value="ball">
            <Accordion.Control px="0">
              <Text fw="bold" c="gray">
                Ball
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Item
                title="Mass"
                note="Influences spin transfer on ball-ball collisions."
              >
                <NumberInputOrText
                  value={params.ball.mass * 100}
                  suffix="g"
                  min={0}
                  decimalScale={4}
                  onChange={onEdit && ((v) => onEdit('ball.mass', v / 100))}
                />
              </Item>
              <Item title="Radius">
                <NumberInputOrText
                  value={params.ball.radius * 100}
                  suffix="cm"
                  min={0}
                  decimalScale={4}
                  onChange={onEdit && ((v) => onEdit('ball.radius', v / 100))}
                />
              </Item>
              <Item
                title="Gravity"
                note="Influences how friction is applied and how quickly airborne balls fall back to the table."
              >
                <NumberInputOrText
                  value={params.ball.gravity}
                  suffix="m/s²"
                  min={0.1}
                  onChange={onEdit && ((v) => onEdit('ball.gravity', v))}
                />
              </Item>
              <Item
                title="Slide friction"
                note={
                  <>
                    Friction applied when a ball is sliding (spinning faster or
                    slower relative to its movement)
                    <br />
                    Higher values reduce time spent sliding and sharpen masse
                    curves.
                  </>
                }
              >
                <NumberInputOrText
                  value={params.ball.frictionSlide}
                  suffix="m/s"
                  min={0.01}
                  decimalScale={3}
                  onChange={onEdit && ((v) => onEdit('ball.frictionSlide', v))}
                />
              </Item>
              <Item
                title="Roll friction"
                note="Friction applied when a ball is rolling (spinning at the same speed as its movement)"
              >
                <NumberInputOrText
                  value={params.ball.frictionRoll}
                  suffix="m/s"
                  min={0.01}
                  decimalScale={3}
                  onChange={onEdit && ((v) => onEdit('ball.frictionRoll', v))}
                />
              </Item>
              <Item
                title="Spin friction"
                note="Friction applied to reduce the ball's side spin. Has no affect on ball path."
              >
                <NumberInputOrText
                  value={params.ball.frictionSpin}
                  suffix="m/s"
                  min={0.01}
                  decimalScale={3}
                  onChange={onEdit && ((v) => onEdit('ball.frictionSpin', v))}
                />
              </Item>
              <Item
                title="Air friction"
                note="Friction applied when a ball is airborne. Currently not implemented."
              >
                <NumberInputOrText
                  value={params.ball.frictionAir}
                  suffix="m/s"
                  min={0}
                  decimalScale={3}
                  onChange={onEdit && ((v) => onEdit('ball.frictionAir', v))}
                />
              </Item>
              <Item
                title="Ball-ball friction"
                note={
                  <>
                    Friction applied during a ball-ball collision. Mainly
                    affects the transfer of spin between balls.
                    <br />
                    Higher values make the cue ball transfer more spin to object
                    balls, and can cause top or back spin to make object balls
                    jump.
                  </>
                }
              >
                <NumberInputOrText
                  value={params.ball.frictionBall}
                  suffix="m/s"
                  min={0}
                  decimalScale={3}
                  onChange={onEdit && ((v) => onEdit('ball.frictionBall', v))}
                />
              </Item>
              <Item
                title="Ball-cushion friction"
                note={
                  <>
                    Friction applied during a ball-cushion collision. Affects
                    how spin is reduced on contact and how much the incidence
                    angle of the ball changes if there is side spin.
                    <br />
                    Higher values can make balls speed up dramatically when
                    hitting cushions with side spin.
                  </>
                }
              >
                <NumberInputOrText
                  value={params.ball.frictionCushion}
                  suffix="m/s"
                  min={0}
                  decimalScale={3}
                  onChange={
                    onEdit && ((v) => onEdit('ball.frictionCushion', v))
                  }
                />
              </Item>
              <Item
                title="Ball-ball restitution"
                note={
                  <>
                    "Bounciness" of ball-ball collisions. A value of 1 means
                    collisions will be perfectly elastic.
                    <br />
                    Values above ~1.5 can cause runaway momentum.
                  </>
                }
              >
                <NumberInputOrText
                  value={params.ball.restitutionBall}
                  prefix="x"
                  decimalScale={3}
                  max={2}
                  onChange={
                    onEdit && ((v) => onEdit('ball.restitutionBall', v))
                  }
                />
              </Item>
              <Item
                title="Ball-cushion restitution"
                note={
                  <>
                    "Bounciness" of ball-cushion collisions. A value of 1 means
                    collisions will be perfectly elastic.
                    <br />
                    Values above ~1.5 can cause runaway momentum.
                  </>
                }
              >
                <NumberInputOrText
                  value={params.ball.restitutionCushion}
                  prefix="x"
                  decimalScale={3}
                  onChange={
                    onEdit && ((v) => onEdit('ball.restitutionCushion', v))
                  }
                />
              </Item>
              <Item
                title="Ball-pocket restitution"
                note={
                  <>
                    Visual only. "Bounciness" of a ball colliding with the
                    inside of a pocket.
                  </>
                }
              >
                <NumberInputOrText
                  value={params.ball.restitutionPocket}
                  prefix="x"
                  decimalScale={3}
                  onChange={
                    onEdit && ((v) => onEdit('ball.restitutionPocket', v))
                  }
                />
              </Item>
              <Item
                title="Ball-table restitution"
                note={
                  <>
                    "Bounciness" of a ball bouncing on the table after becoming
                    airborne.
                    <br />
                    High values can cause balls to bounce indefinitely.
                  </>
                }
              >
                <NumberInputOrText
                  value={params.ball.restitutionSlate}
                  prefix="x"
                  decimalScale={3}
                  max={0.8}
                  onChange={
                    onEdit && ((v) => onEdit('ball.restitutionSlate', v))
                  }
                />
              </Item>
              <Item
                title="Spin multiplier"
                note="Multiplies top, back and side spin applied when shooting the cue ball."
              >
                <NumberInputOrText
                  value={params.ball.spinMultiplier}
                  prefix="x"
                  min={0}
                  onChange={onEdit && ((v) => onEdit('ball.spinMultiplier', v))}
                />
              </Item>
            </Accordion.Panel>
          </Accordion.Item>
          <Divider style={{ borderTop: '1px solid #FFF2' }} />
          <Accordion.Item value="cue">
            <Accordion.Control px="0">
              <Text fw="bold" c="gray">
                Cue
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Item title="Default force">
                <NumberInputOrText
                  value={params.cue.defaultForce}
                  suffix="m/s"
                  min={0.1}
                  onChange={onEdit && ((v) => onEdit('cue.defaultForce', v))}
                />
              </Item>
              <Item title="Max force">
                <NumberInputOrText
                  value={params.cue.maxForce}
                  suffix="m/s"
                  min={params.cue.defaultForce}
                  max={10}
                  onChange={onEdit && ((v) => onEdit('cue.maxForce', v))}
                />
              </Item>
            </Accordion.Panel>
          </Accordion.Item>
          <Divider style={{ borderTop: '1px solid #FFF2' }} />
          <Accordion.Item value="cushion">
            <Accordion.Control px="0">
              <Text fw="bold" c="gray">
                Cushion
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Item title="Width">
                <NumberInputOrText
                  value={params.cushion.width * 100}
                  suffix="cm"
                  min={0.1}
                  onChange={onEdit && ((v) => onEdit('cushion.width', v / 100))}
                />
              </Item>
              <Item
                title="Base width"
                note="Visual only. Width of where the cushion meets the table."
              >
                <NumberInputOrText
                  value={params.cushion.baseWidth * 100}
                  suffix="cm"
                  min={0.1}
                  onChange={
                    onEdit && ((v) => onEdit('cushion.baseWidth', v / 100))
                  }
                />
              </Item>
              <Item
                title="Height"
                note="Visual only. Height of the cushions (and table rail)."
              >
                <NumberInputOrText
                  value={params.cushion.height * 100}
                  suffix="cm"
                  min={0.1}
                  onChange={
                    onEdit && ((v) => onEdit('cushion.height', v / 100))
                  }
                />
              </Item>
            </Accordion.Panel>
          </Accordion.Item>
          <Divider style={{ borderTop: '1px solid #FFF2' }} />
          <Accordion.Item value="pocket">
            <Accordion.Control px="0">
              <Text fw="bold" c="gray">
                Pocket
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Item title="Depth" note="Visual only.">
                <NumberInputOrText
                  value={params.pocket.depth * 100}
                  suffix="cm"
                  min={0.1}
                  onChange={onEdit && ((v) => onEdit('pocket.depth', v / 100))}
                />
              </Item>
              <Item title="Radius (edge)">
                <NumberInputOrText
                  value={params.pocket.edge.radius * 100}
                  suffix="cm"
                  min={0.1}
                  onChange={
                    onEdit && ((v) => onEdit('pocket.edge.radius', v / 100))
                  }
                />
              </Item>
              <Item title="Radius (corner)">
                <NumberInputOrText
                  value={params.pocket.corner.radius * 100}
                  suffix="cm"
                  min={0.1}
                  onChange={
                    onEdit && ((v) => onEdit('pocket.corner.radius', v / 100))
                  }
                />
              </Item>
              <Item
                title="Overlap (edge)"
                note="How far cushions overlap into the edge pockets."
              >
                <NumberInputOrText
                  value={params.pocket.edge.overlap * 100}
                  suffix="cm"
                  min={0.1}
                  onChange={
                    onEdit && ((v) => onEdit('pocket.edge.overlap', v / 100))
                  }
                />
              </Item>
              <Item
                title="Overlap (corner)"
                note="How far cushions overlap into the corner pockets."
              >
                <NumberInputOrText
                  value={params.pocket.corner.overlap * 100}
                  suffix="cm"
                  min={0.1}
                  onChange={
                    onEdit && ((v) => onEdit('pocket.corner.overlap', v / 100))
                  }
                />
              </Item>
              <Item
                title="Girth (edge)"
                note="Adds extra distance between the cushion corners at the edge pockets."
              >
                <NumberInputOrText
                  value={params.pocket.edge.girth * 100}
                  suffix="cm"
                  onChange={
                    onEdit && ((v) => onEdit('pocket.edge.girth', v / 100))
                  }
                />
              </Item>
              <Item
                title="Girth (corner)"
                note="Adds extra distance between the cushion corners at the corner pockets."
              >
                <NumberInputOrText
                  value={params.pocket.corner.girth * 100}
                  suffix="cm"
                  min={0.1}
                  onChange={
                    onEdit && ((v) => onEdit('pocket.corner.girth', v / 100))
                  }
                />
              </Item>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
      {onReset && <Button onClick={onReset}>Reset to default</Button>}
    </Stack>
  );
};
