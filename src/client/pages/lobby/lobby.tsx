import { Button, Flex, Group, Stack, Text, Title } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { type StaticParams } from '../../../common/simulation/physics';
import { settings } from '../../game/store/settings';
import { socket } from '../../socket';
import { PageContainer } from '../../ui/page-container';
import { ParamEditor } from '../../ui/param-editor';
import { Surface } from '../../ui/surface';
import type { DeepKeyOf } from '../../util/types';
import { useLobby } from '../../util/use-lobby';
import { useRedirectOnStart } from './use-redirect-on-start';

export const LobbyPage = () => {
  const { id } = useParams<{ id: string }>();
  const { lobby, setId } = useLobby();
  const navigate = useNavigate();

  useRedirectOnStart();

  useEffect(() => {
    id && setId(id);
  }, [id, setId]);

  const onEditParam = useCallback(
    (key: DeepKeyOf<StaticParams>, value: unknown) => {
      if (!lobby) return;

      const params = JSON.parse(JSON.stringify(lobby.params));

      const path = key.split('.');
      const obj = path.slice(0, -1).reduce((o, prop) => {
        // @ts-ignore
        return o[prop];
      }, params);
      // @ts-ignore
      obj[path.at(-1)] = value;

      socket.emit('update-params', [lobby.id, params]);
    },
    [lobby?.params]
  );

  if (!lobby) {
    return null;
  }

  const isHost = lobby.hostId === socket.id;

  const onStartGame = () => {
    socket.emit('start-game', id);
  };

  return (
    <PageContainer>
      <Notifications
        position="top-center"
        classNames={{ notification: 'surface-effects' }}
      />
      <Group wrap="nowrap" align="stretch">
        <Stack align="center" w="400px">
          <Surface p="lg" w="100%">
            <Stack align="stretch" gap="lg">
              <Title order={2}>
                Lobby code: <strong>{lobby?.id}</strong>
              </Title>
              <Title order={3}>
                <strong>{lobby.players.length}</strong> Players
              </Title>
              <Flex wrap="wrap" align="flex-start" gap="md">
                {lobby.players.map((player) => (
                  <Text key={player.id}>
                    id: {player.id} name: {player.name}
                  </Text>
                ))}
              </Flex>
            </Stack>
          </Surface>
          <Surface p="lg" w="100%">
            <Stack>
              <Button
                size="lg"
                w="100%"
                onClick={() => (settings.preferencesOpen = true)}
              >
                Preferences
              </Button>
              <Button
                size="lg"
                w="100%"
                c="red"
                onClick={() => {
                  socket.emit('leave-lobby', lobby.id);
                  navigate('/');
                }}
              >
                Leave lobby
              </Button>
            </Stack>
          </Surface>
          {isHost && (
            <Surface p="lg" w="100%">
              <Button
                w="100%"
                size="lg"
                disabled={lobby.players.length < 2}
                onClick={onStartGame}
              >
                Start game
              </Button>
            </Surface>
          )}
        </Stack>
        <Surface p="lg" w="400px" mah="600px" style={{ overflow: 'auto' }}>
          <ParamEditor
            params={lobby.params}
            full
            onEdit={isHost ? onEditParam : undefined}
          />
        </Surface>
      </Group>
    </PageContainer>
  );
};
