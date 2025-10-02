import { Flex, Loader } from '@mantine/core';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';
import { PageContainer } from './ui/page-container';
import { Surface } from './ui/surface';
import { LobbyProvider } from './util/lobby-provider';

const Home = lazy(() => import('./pages/home'));
const Lobby = lazy(() => import('./pages/lobby'));
const Game = lazy(() => import('./pages/game'));

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <LobbyProvider>
        <Outlet />
      </LobbyProvider>
    ),
    children: [
      { path: '', element: <Home /> },
      { path: '/lobby/:id', element: <Lobby /> },
      { path: '/game', element: <Game /> },
    ],
  },
]);

export const Router = () => (
  <Suspense
    fallback={
      <PageContainer>
        <Surface p="lg">
          <Flex justify="center">
            <Loader color="#FFF8" />
          </Flex>
        </Surface>
      </PageContainer>
    }
  >
    <RouterProvider router={router} />
  </Suspense>
);
