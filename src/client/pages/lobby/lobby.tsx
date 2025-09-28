import { Flex, Stack, Text, Title } from '@mantine/core';
import { useEffect } from 'react';
import { useParams } from 'react-router';
import { socket } from '../../socket';
import { Button } from '../../ui/button';
import { PageContainer } from '../../ui/page-container';
import { Surface } from '../../ui/surface';
import { useLobby } from '../../util/use-lobby';
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

  const onStartGame = () => {
    socket.emit('start-game', id);
  };

  return (
    <PageContainer>
      <Surface>
        <Stack align="center">
          <Title order={2}>
            Lobby code{' '}
            <Text component="span" fz="inherit">
              {lobby?.id}
            </Text>
          </Title>
        </Stack>
        <Flex gap="lg">
          {lobby.hostId === socket.id && (
            <Button disabled={lobby.players.length < 2} onClick={onStartGame}>
              Start game
            </Button>
          )}
          <Button>Copy link</Button>
        </Flex>
        <Stack miw="400px">
          <Title order={2}>
            <Text component="span" fz="inherit">
              {lobby.players.length}
            </Text>{' '}
            Players
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
    </PageContainer>
  );
};
