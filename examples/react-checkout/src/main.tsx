import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Tokens first, then the element definitions — the components read the custom
// properties at first paint, so loading them the other way round produces a
// visible flash of unstyled controls.
import '@meridian/tokens/css';
import '@meridian/components';
import './app.css';

const root = document.getElementById('root');
if (!root) throw new Error('No #root element — check index.html.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
