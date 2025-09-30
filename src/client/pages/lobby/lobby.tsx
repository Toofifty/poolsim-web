import { Button, Flex, Group, Stack, Text, Title } from '@mantine/core';
import { useEffect } from 'react';
import { useParams } from 'react-router';
import { settings } from '../../game/store/settings';
import { socket } from '../../socket';
import { PageContainer } from '../../ui/page-container';
import { Surface } from '../../ui/surface';
import { useLobby } from '../../util/use-lobby';
import { GameParams } from './game-params';
import { useRedirectOnStart } from './use-redirect-on-start';

export const LobbyPage = () => {
  const { id } = useParams<{ id: string }>();
  const { lobby, setId } = useLobby();

  useRedirectOnStart();

  useEffect(() => {
    id && setId(id);
  }, [id, setId]);

  if (!lobby) {
    return null;
  }

  const isHost = lobby.hostId === socket.id;

  const onStartGame = () => {
    socket.emit('start-game', id);
  };

  return (
    <PageContainer>
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
              <Button size="lg" w="100%" c="red" disabled>
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
        <GameParams lobby={lobby} />
      </Group>
    </PageContainer>
  );
};
