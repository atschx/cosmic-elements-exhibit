import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { ExhibitProvider } from './state/ExhibitContext';
import './styles/tokens.css';
import './styles/global.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <ExhibitProvider>
      <App />
    </ExhibitProvider>
  </StrictMode>,
);
