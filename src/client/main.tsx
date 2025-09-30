import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Router } from './router.tsx';
import './ui/button.scss';
import { Preferences } from './ui/preferences.tsx';

const theme = createTheme({
  colors: {
    'blue-custom': [
      '#646cff',
      '#646cff',
      '#646cff',
      '#646cff',
      '#646cff',
      '#646cff',
      '#646cff',
      '#646cff',
      '#646cff',
      '#646cff',
    ],
  },

  primaryColor: 'blue-custom',

  components: {
    Button: {
      defaultProps: {
        className: 'button',
        size: '32',
        px: 'md',
      },
    },
    ActionIcon: {
      defaultProps: {
        className: 'button icon',
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Preferences />
      <Router />
    </MantineProvider>
  </StrictMode>
);
