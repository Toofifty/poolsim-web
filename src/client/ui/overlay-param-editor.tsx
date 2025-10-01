import { CloseButton, Dialog, Group, Stack, Title } from '@mantine/core';
import { useSnapshot } from 'valtio';
import type { StaticParams } from '../../common/simulation/physics';
import { settings } from '../game/store/settings';
import type { DeepKeyOf } from '../util/types';
import { ParamEditor } from './param-editor';

export const OverlayParamEditor = ({
  params,
  onEdit,
}: {
  params: StaticParams;
  onEdit: (key: DeepKeyOf<StaticParams>, value: unknown) => void;
}) => {
  const { paramEditorOpen } = useSnapshot(settings);

  return (
    <Dialog
      opened={paramEditorOpen}
      onClose={() => (settings.paramEditorOpen = false)}
      position={{
        top: '50%',
        left: '16px',
      }}
      transitionProps={{ transition: 'fade-right' }}
      className="surface"
      style={{ translate: '0 -50%' }}
    >
      <Stack>
        <Group justify="space-between">
          <Title order={2}>Parameters</Title>
          <CloseButton onClick={() => (settings.paramEditorOpen = false)} />
        </Group>
        <ParamEditor params={params} onEdit={onEdit} />
      </Stack>
    </Dialog>
  );
};
