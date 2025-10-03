import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { subscribe } from 'valtio';
import { GraphicsDetail, settings } from './game/store/settings.ts';
import './index.scss';
import { Router } from './router.tsx';
import './ui/button.scss';
import './ui/notifications.scss';
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
    Checkbox: {
      defaultProps: {
        size: '24',
        radius: '100%',
      },
    },
    NumberInput: {
      defaultProps: {
        className: 'number-input',
        size: 'xs',
        fixedDecimalScale: true,
        stepHoldDelay: 500,
      },
    },
  },
});

if (settings.detail !== GraphicsDetail.High) {
  document.body.classList.add('no-blur');
}
subscribe(settings, () => {
  if (settings.detail !== GraphicsDetail.High) {
    document.body.classList.add('no-blur');
  } else {
    document.body.classList.remove('no-blur');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Preferences />
      <Router />
    </MantineProvider>
  </StrictMode>
);
