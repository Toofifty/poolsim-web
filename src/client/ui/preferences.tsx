import {
  Button,
  Checkbox,
  Divider,
  Flex,
  Group,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { useSnapshot } from 'valtio';
import { settings } from '../game/store/settings';
import { theme } from '../game/store/theme';

const Item = ({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) => (
  <Flex h={32} gap="lg" justify="space-between" align="center">
    <Text fw="bold" c="gray">
      {title}
    </Text>
    <Divider style={{ borderTop: '1px dashed #FFF1' }} flex={1} />
    <Flex gap="xs">{children}</Flex>
  </Flex>
);

export const Preferences = () => {
  const {
    preferencesOpen,
    ortho,
    highDetail,
    highlightTargetBalls,
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
      <Modal.Content className="surface" p="lg" miw="700px">
        <Stack>
          <Title order={2}>Preferences</Title>
          <Divider style={{ borderTop: '1px solid #FFF2' }} />
          <Item title="Graphics (requires refresh)">
            <Button
              variant={ortho ? 'filled' : 'default'}
              onClick={() => {
                settings.ortho = !ortho;
              }}
            >
              Ortho
            </Button>
            <Button
              variant={highDetail ? 'filled' : 'default'}
              onClick={() => {
                settings.highDetail = !highDetail;
              }}
            >
              HD
            </Button>
          </Item>
          <Item title="Theme">
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
          <Item title="Highlight target balls">
            <Checkbox
              checked={highlightTargetBalls}
              onChange={(e) =>
                (settings.highlightTargetBalls = e.target.checked)
              }
            />
          </Item>
          <Title mt="lg" order={3}>
            Debugging
          </Title>
          <Divider style={{ borderTop: '1px solid #FFF2' }} />
          <Group justify="stretch" align="start" gap="64">
            <Stack flex={1}>
              <Item
                title={
                  <>
                    Pause simulation <kbd>space</kbd>
                  </>
                }
              >
                <Checkbox
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
                  checked={lockCue}
                  onChange={(e) => (settings.lockCue = e.target.checked)}
                />
              </Item>
              <Item title="Enable ball pickup">
                <Checkbox
                  checked={enableBallPickup}
                  onChange={(e) =>
                    (settings.enableBallPickup = e.target.checked)
                  }
                />
              </Item>
            </Stack>
            <Stack flex={1}>
              <Item title="Debug lights">
                <Checkbox
                  checked={debugLights}
                  onChange={(e) => (settings.debugLights = e.target.checked)}
                />
              </Item>
              <Item title="Debug balls">
                <Checkbox
                  checked={debugBalls}
                  onChange={(e) => (settings.debugBalls = e.target.checked)}
                />
              </Item>
              <Item title="Debug cushions">
                <Checkbox
                  checked={debugCushions}
                  onChange={(e) => (settings.debugCushions = e.target.checked)}
                />
              </Item>
              <Item title="Enable profiler">
                <Checkbox
                  checked={enableProfiler}
                  onChange={(e) => (settings.enableProfiler = e.target.checked)}
                />
              </Item>
            </Stack>
          </Group>
        </Stack>
      </Modal.Content>
    </Modal.Root>
  );
};
