import { Flex, Loader, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../socket';
import { Button } from '../../ui/button';
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
      <Surface>
        <Stack align="center">
          <Button onClick={() => navigate('/game')}>Singleplayer</Button>
          <Button onClick={onHost}>Host new game</Button>
          <Title order={2}>Join a game</Title>
          {lobbies === undefined && <Loader />}
          {lobbies && lobbies.length === 0 && (
            <Text c="gray">No public lobbies available</Text>
          )}
          <Flex gap="xl" wrap="wrap">
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
    </PageContainer>
  );
};
