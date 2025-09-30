import { Button, Flex, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { settings } from '../../game/store/settings';
import { socket } from '../../socket';
import { PageContainer } from '../../ui/page-container';
import { Surface } from '../../ui/surface';
import { useLobbies } from './use-lobbies';
import { useLobbyRedirect } from './use-lobby-redirect';

export const HomePage = () => {
  const lobbies = useLobbies();
  const navigate = useNavigate();

  useLobbyRedirect();

  const onHost = () => {
    socket.emit('host');
  };

  const onJoin = (id: string) => {
    navigate(`/lobby/${id}`);
  };

  return (
    <PageContainer>
      <Stack align="center">
        <Title order={1}>Pool!</Title>
        <Surface p="lg" w="100%">
          <Stack align="stretch">
            <Button size="lg" w="100%" onClick={() => navigate('/game')}>
              Play offline
            </Button>
            <Group align="stretch">
              <Button flex={1} size="lg" onClick={onHost}>
                Host public game
              </Button>
              <Button flex={1} size="lg" onClick={onHost} disabled>
                Host private game
              </Button>
            </Group>
            <Button
              size="lg"
              w="100%"
              onClick={() => (settings.preferencesOpen = true)}
            >
              Preferences
            </Button>
          </Stack>
        </Surface>
        <Surface p="lg" w="100%">
          <Stack align="center">
            <Title order={3}>Join a game</Title>
            {lobbies === undefined && <Loader color="#FFF8" />}
            {lobbies && lobbies.length === 0 && (
              <Text c="gray">No public lobbies available</Text>
            )}
            <Flex gap="sm" wrap="wrap">
              {lobbies &&
                lobbies.length > 0 &&
                lobbies.map((lobby) => (
                  <Button key={lobby.id} onClick={() => onJoin(lobby.id)}>
                    Join {lobby.id}
                  </Button>
                ))}
            </Flex>
          </Stack>
        </Surface>
      </Stack>
    </PageContainer>
  );
};
