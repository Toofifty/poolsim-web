import {
  Accordion,
  Divider,
  Flex,
  NumberInput,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import type { ReactNode } from 'react';
import {
  AimAssistMode,
  RuleSet,
  type StaticParams,
} from '../../common/simulation/physics';
import type { DeepKeyOf } from '../util/types';
import './param-editor.scss';

const getRuleSetName = (ruleSet: RuleSet) => {
  switch (ruleSet) {
    case RuleSet._8Ball:
      return '8 Ball';
    case RuleSet._9Ball:
      return '9 Ball';
    case RuleSet.Debug:
      return 'Debug';
  }
};

const getAimAssistName = (aimAssist: AimAssistMode) => {
  switch (aimAssist) {
    case AimAssistMode.Off:
      return 'Off';
    case AimAssistMode.FirstContact:
      return 'First contact';
    case AimAssistMode.FirstBallContact:
      return 'First ball contact';
    case AimAssistMode.Full:
      return 'Full';
  }
};

const Item = ({ title, children }: { title: string; children: ReactNode }) => (
  <Flex gap="lg" justify="space-between" align="center" mb="sm">
    <Text c="gray">{title}</Text>
    <Divider style={{ borderTop: '1px dashed #FFF2' }} flex={1} />
    <Flex gap="xs">{children}</Flex>
  </Flex>
);

export const ParamEditor = ({
  params,
  full,
  onEdit,
}: {
  params: StaticParams;
  full?: boolean;
  onEdit?: (key: DeepKeyOf<StaticParams>, value: unknown) => void;
}) => {
  return (
    <Stack gap={0}>
      {full && (
        <>
          <Item title="Game mode">
            <Select
              disabled={!onEdit}
              withCheckIcon={false}
              value={params.game.ruleSet.toString()}
              data={[RuleSet._8Ball, RuleSet._9Ball, RuleSet.Debug].map(
                (value) => ({
                  value: value.toString(),
                  label: getRuleSetName(value),
                })
              )}
              comboboxProps={{ transitionProps: { transition: 'fade' } }}
            />
          </Item>
          <Item title="Guidelines">
            <Select
              disabled={!onEdit}
              withCheckIcon={false}
              value={params.game.aimAssist.toString()}
              data={[
                AimAssistMode.Off,
                AimAssistMode.FirstContact,
                AimAssistMode.FirstBallContact,
                AimAssistMode.Full,
              ].map((value) => ({
                value: value.toString(),
                label: getAimAssistName(value),
              }))}
              comboboxProps={{ transitionProps: { transition: 'fade' } }}
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
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.table.length}
                suffix="m"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('table.length', v)}
                min={0.1}
              />
            </Item>
            <Item title="Width">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.table.width}
                suffix="m"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('table.width', v)}
                min={0.1}
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
            <Item title="Mass">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.ball.mass * 100}
                suffix="g"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.mass', +v / 100)}
                min={0}
              />
            </Item>
            <Item title="Radius">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.ball.radius * 100}
                suffix="cm"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.radius', +v / 100)}
                min={0.1}
              />
            </Item>
            <Item title="Gravity">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.ball.gravity}
                suffix="m/s²"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.gravity', v)}
                min={0}
              />
            </Item>
            <Item title="Slide friction">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={-params.ball.frictionSlide}
                suffix="m/s"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.frictionSlide', -v)}
                max={0}
              />
            </Item>
            <Item title="Roll friction">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={-params.ball.frictionRoll}
                suffix="m/s"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.frictionRoll', -v)}
                max={0}
              />
            </Item>
            <Item title="Spin friction">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={-params.ball.frictionSpin}
                suffix="m/s"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.frictionSpin', -v)}
                max={0}
              />
            </Item>
            <Item title="Air friction">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={-params.ball.frictionAir}
                suffix="m/s"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.frictionAir', -v)}
                max={0}
              />
            </Item>
            <Item title="Ball-ball friction">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={-params.ball.frictionBall}
                suffix="m/s"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.frictionBall', -v)}
                max={0}
              />
            </Item>
            <Item title="Ball-cushion friction">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={-params.ball.frictionCushion}
                suffix="m/s"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.frictionCushion', -v)}
                max={0}
              />
            </Item>
            <Item title="Ball-ball restitution">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.ball.restitutionBall}
                prefix="x"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.restitutionBall', v)}
              />
            </Item>
            <Item title="Ball-cushion restitution">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.ball.restitutionCushion}
                prefix="x"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.restitutionCushion', v)}
              />
            </Item>
            <Item title="Ball-pocket restitution">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.ball.restitutionPocket}
                prefix="x"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.restitutionPocket', v)}
              />
            </Item>
            <Item title="Ball-table restitution">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.ball.restitutionSlate}
                prefix="x"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('ball.restitutionSlate', v)}
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
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.cushion.width * 100}
                suffix="cm"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('cushion.width', +v / 100)}
                min={0.1}
              />
            </Item>
            <Item title="Base width">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.cushion.baseWidth * 100}
                suffix="cm"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('cushion.baseWidth', +v / 100)}
                min={0.1}
              />
            </Item>
            <Item title="Height">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.cushion.height * 100}
                suffix="cm"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('cushion.height', +v / 100)}
                min={0.1}
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
            <Item title="Depth">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.pocket.depth * 100}
                suffix="cm"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('pocket.depth', +v / 100)}
                min={0.1}
              />
            </Item>
            <Item title="Radius (edge)">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.pocket.edge.radius * 100}
                suffix="cm"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('pocket.edge.radius', +v / 100)}
                min={0.1}
              />
            </Item>
            <Item title="Radius (corner)">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.pocket.corner.radius * 100}
                suffix="cm"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('pocket.corner.radius', +v / 100)}
                min={0.1}
              />
            </Item>
            <Item title="Overlap (edge)">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.pocket.edge.overlap * 100}
                suffix="cm"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('pocket.edge.overlap', +v / 100)}
                min={0.1}
              />
            </Item>
            <Item title="Overlap (corner)">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.pocket.corner.overlap * 100}
                suffix="cm"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('pocket.corner.overlap', +v / 100)}
                min={0.1}
              />
            </Item>
            <Item title="Girth (edge)">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.pocket.edge.girth * 100}
                suffix="cm"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('pocket.edge.girth', +v / 100)}
                min={0.1}
              />
            </Item>
            <Item title="Girth (corner)">
              <NumberInput
                className="number-input"
                disabled={!onEdit}
                value={params.pocket.corner.girth * 100}
                suffix="cm"
                decimalScale={2}
                step={0.01}
                stepHoldInterval={0.01}
                onChange={(v) => onEdit?.('pocket.corner.girth', +v / 100)}
                min={0.1}
              />
            </Item>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
};
