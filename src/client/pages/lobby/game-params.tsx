import { Accordion, Flex, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import type { LobbyData } from '../../../common/data';
import {
  params as defaultParams,
  type Params,
} from '../../../common/simulation/physics';
import { RuleSet } from '../../../common/simulation/table-state';
import { Surface } from '../../ui/surface';

const getGameMode = (params: Params) => {
  switch (params.game.ruleSet) {
    case RuleSet._8Ball:
      return '8 Ball';
    case RuleSet._9Ball:
      return '9 Ball';
    case RuleSet.Debug:
      return 'Debug';
  }
};

const Item = ({ title, children }: { title: string; children: ReactNode }) => (
  <Flex gap="lg" justify="space-between" align="center">
    <Text fw="bold" c="gray">
      {title}
    </Text>
    {children}
  </Flex>
);

export const GameParams = ({
  lobby,
  onEdit,
}: {
  lobby: LobbyData;
  onEdit?: (params: Params) => void;
}) => {
  const params = lobby.params ?? defaultParams;

  return (
    <Surface p="lg" w="400px" mah="500px" style={{ overflow: 'auto' }}>
      <Stack>
        <Item title="Game mode">{getGameMode(params)}</Item>
        <Accordion variant="unstyled">
          <Accordion.Item value="table">
            <Accordion.Control px="0">
              <Text fw="bold" c="gray">
                Table
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Item title="Length">{params.table.length.toFixed(2)}m</Item>
              <Item title="Width">{params.table.width.toFixed(2)}m</Item>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="ball">
            <Accordion.Control px="0">
              <Text fw="bold" c="gray">
                Ball
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Item title="Mass">{(params.ball.mass * 100).toFixed(2)}g</Item>
              <Item title="Radius">
                {(params.ball.radius * 100).toFixed(2)}cm
              </Item>
              <Item title="Gravity">{params.ball.gravity.toFixed(2)}m/s²</Item>
              <Item title="Slide friction">
                -{params.ball.frictionSlide.toFixed(2)}m/s
              </Item>
              <Item title="Roll friction">
                -{params.ball.frictionRoll.toFixed(2)}m/s
              </Item>
              <Item title="Spin friction">
                -{params.ball.frictionSpin.toFixed(2)}m/s
              </Item>
              <Item title="Air friction">
                -{params.ball.frictionAir.toFixed(3)}m/s
              </Item>
              <Item title="Ball-ball friction">
                -{params.ball.frictionBall.toFixed(2)}m/s
              </Item>
              <Item title="Ball-cushion friction">
                -{params.ball.frictionCushion.toFixed(2)}m/s
              </Item>
              <Item title="Ball-ball restitution">
                x{params.ball.restitutionBall.toFixed(2)}
              </Item>
              <Item title="Ball-cushion restitution">
                x{params.ball.restitutionCushion.toFixed(2)}
              </Item>
              <Item title="Ball-pocket restitution">
                x{params.ball.restitutionPocket.toFixed(2)}
              </Item>
              <Item title="Ball-table restitution">
                x{params.ball.restitutionSlate.toFixed(2)}
              </Item>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="cushion">
            <Accordion.Control px="0">
              <Text fw="bold" c="gray">
                Cushion
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Item title="Width">
                {(params.cushion.width * 100).toFixed(2)}cm
              </Item>
              <Item title="Base width">
                {(params.cushion.baseWidth * 100).toFixed(2)}cm
              </Item>
              <Item title="Height">
                {(params.cushion.height * 100).toFixed(2)}cm
              </Item>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="pocket">
            <Accordion.Control px="0">
              <Text fw="bold" c="gray">
                Pocket
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Item title="Depth">
                {(params.pocket.depth * 100).toFixed(2)}cm
              </Item>
              <Item title="Radius (edge)">
                {(params.pocket.edge.radius * 100).toFixed(2)}cm
              </Item>
              <Item title="Radius (corner)">
                {(params.pocket.corner.radius * 100).toFixed(2)}cm
              </Item>
              <Item title="Overlap (edge)">
                {(params.pocket.edge.overlap * 100).toFixed(2)}cm
              </Item>
              <Item title="Overlap (corner)">
                {(params.pocket.corner.overlap * 100).toFixed(2)}cm
              </Item>
              <Item title="Girth (edge)">
                {(params.pocket.edge.girth * 100).toFixed(2)}cm
              </Item>
              <Item title="Girth (corner)">
                {(params.pocket.corner.girth * 100).toFixed(2)}cm
              </Item>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Surface>
  );
};
