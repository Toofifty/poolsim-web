import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Router } from './router.tsx';
import './ui/button.scss';

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
      <Router />
    </MantineProvider>
  </StrictMode>
);
