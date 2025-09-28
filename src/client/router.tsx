import { Flex, Loader } from '@mantine/core';
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router-dom';
import { PageContainer } from './ui/page-container';
import { Surface } from './ui/surface';
import { LobbyProvider } from './util/lobby-provider';

const Home = lazy(() => import('./pages/home'));
const Lobby = lazy(() => import('./pages/lobby'));
const Game = lazy(() => import('./pages/game'));

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/lobby/:id', element: <Lobby /> },
  { path: '/game', element: <Game /> },
]);

export const Router = () => (
  <Suspense
    fallback={
      <PageContainer>
        <Surface>
          <Flex justify="center">
            <Loader py="xl" />
          </Flex>
        </Surface>
      </PageContainer>
    }
  >
    <LobbyProvider>
      <RouterProvider router={router} />
    </LobbyProvider>
  </Suspense>
);
