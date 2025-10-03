import {
  Button,
  Checkbox,
  Divider,
  Flex,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { useSnapshot } from 'valtio';
import { GraphicsDetail, settings } from '../game/store/settings';
import { theme } from '../game/store/theme';

const Item = ({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) => (
  <Flex
    className="group lower"
    h={40}
    pl="md"
    gap="lg"
    justify="space-between"
    align="center"
  >
    <Text style={{ flexGrow: 0, flexShrink: 0 }} fw="bold" c="gray">
      {title}
    </Text>
    <Flex gap="xs">{children}</Flex>
  </Flex>
);

export const Preferences = () => {
  const {
    preferencesOpen,
    ortho,
    detail,
    highlightTargetBalls,
    physicsGuidelines,
    // debug
    lockCue,
    pauseSimulation,
    debugLights,
    debugBalls,
    debugCushions,
    enableBallPickup,
    enableProfiler,
  } = useSnapshot(settings);
  const { table } = useSnapshot(theme);

  return (
    <Modal.Root
      opened={preferencesOpen}
      onClose={() => (settings.preferencesOpen = false)}
      centered
    >
      <Modal.Overlay />
      <Modal.Content
        styles={{
          content: {
            ['--modal-size']: '700px',
            maxWidth: '90vw',
          },
        }}
        className="surface"
        p="lg"
      >
        <Stack>
          <Title order={2}>Preferences</Title>
          <Divider mx="-md" style={{ borderTop: '1px solid #FFF2' }} />
          <Title order={4}>Graphics (refresh to apply changes)</Title>
          <Divider style={{ borderTop: '1px solid #FFF2' }} />
          <Item title="Orthographic">
            <Checkbox
              pr="4px"
              checked={ortho}
              onChange={(e) => (settings.ortho = e.target.checked)}
            />
          </Item>
          <Item title="Detail">
            {(
              [
                { value: GraphicsDetail.Low, label: 'Low' },
                { value: GraphicsDetail.Medium, label: 'Medium' },
                { value: GraphicsDetail.High, label: 'High' },
              ] as const
            ).map(({ value, label }) => (
              <Button
                key={value}
                variant={detail === value ? 'filled' : 'default'}
                onClick={() => (settings.detail = value)}
              >
                {label}
              </Button>
            ))}
          </Item>
          <Title order={4}>Theme</Title>
          <Divider style={{ borderTop: '1px solid #FFF2' }} />
          <Item title="Table colour">
            {(['green', 'blue', 'red', 'pink'] as const).map((v) => (
              <Button
                key={v}
                variant={table === v ? 'filled' : 'default'}
                onClick={() => (theme.table = v)}
              >
                {v[0].toLocaleUpperCase() + v.slice(1).toLowerCase()}
              </Button>
            ))}
          </Item>
          <Title mt="lg" order={4}>
            Overlays
          </Title>
          <Divider style={{ borderTop: '1px solid #FFF2' }} />
          <Flex w="100%" justify="stretch" align="stretch" wrap="wrap" gap="md">
            <Stack style={{ flexGrow: 1 }} miw={'calc(50% - 8px)'}>
              <Item title="Highlight target balls">
                <Checkbox
                  pr="4px"
                  checked={highlightTargetBalls}
                  onChange={(e) =>
                    (settings.highlightTargetBalls = e.target.checked)
                  }
                />
              </Item>
            </Stack>
            <Stack style={{ flexGrow: 1 }} miw={'calc(50% - 8px)'}>
              <Item title="Show physics state in guidelines">
                <Checkbox
                  pr="4px"
                  checked={physicsGuidelines}
                  onChange={(e) =>
                    (settings.physicsGuidelines = e.target.checked)
                  }
                />
              </Item>
            </Stack>
          </Flex>
          <Title mt="lg" order={4}>
            Debugging
          </Title>
          <Divider style={{ borderTop: '1px solid #FFF2' }} />
          <Flex w="100%" justify="stretch" align="stretch" wrap="wrap" gap="md">
            <Stack style={{ flexGrow: 1 }} miw={'calc(50% - 8px)'}>
              <Item
                title={
                  <>
                    Pause simulation <kbd>space</kbd>
                  </>
                }
              >
                <Checkbox
                  pr="4px"
                  checked={pauseSimulation}
                  onChange={(e) =>
                    (settings.pauseSimulation = e.target.checked)
                  }
                />
              </Item>
              <Item
                title={
                  <>
                    Lock cue <kbd>L</kbd>
                  </>
                }
              >
                <Checkbox
                  pr="4px"
                  checked={lockCue}
                  onChange={(e) => (settings.lockCue = e.target.checked)}
                />
              </Item>
              <Item title="Enable ball pickup">
                <Checkbox
                  pr="4px"
                  checked={enableBallPickup}
                  onChange={(e) =>
                    (settings.enableBallPickup = e.target.checked)
                  }
                />
              </Item>
            </Stack>
            <Stack style={{ flexGrow: 1 }} miw={'calc(50% - 8px)'}>
              <Item title="Debug lights">
                <Checkbox
                  pr="4px"
                  checked={debugLights}
                  onChange={(e) => (settings.debugLights = e.target.checked)}
                />
              </Item>
              <Item title="Debug balls">
                <Checkbox
                  pr="4px"
                  checked={debugBalls}
                  onChange={(e) => (settings.debugBalls = e.target.checked)}
                />
              </Item>
              <Item title="Debug cushions">
                <Checkbox
                  pr="4px"
                  checked={debugCushions}
                  onChange={(e) => (settings.debugCushions = e.target.checked)}
                />
              </Item>
              <Item title="Enable profiler">
                <Checkbox
                  pr="4px"
                  checked={enableProfiler}
                  onChange={(e) => (settings.enableProfiler = e.target.checked)}
                />
              </Item>
            </Stack>
          </Flex>
        </Stack>
      </Modal.Content>
    </Modal.Root>
  );
};
