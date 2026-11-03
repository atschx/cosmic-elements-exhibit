import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Cascade order matters: tokens/base first, component sheets (pulled in by App) in the middle,
// then the responsive and touch tiers so their :root overrides win over the defaults.
import './styles/tokens.css';
import './styles/global.css';
import { App } from './App';
import { ExhibitProvider } from './state/ExhibitContext';
import './styles/responsive.css';
import './styles/mobile.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <ExhibitProvider>
      <App />
    </ExhibitProvider>
  </StrictMode>,
);
