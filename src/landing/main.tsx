import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Shares the exhibit's design tokens; everything else on the landing page is its own reading-oriented layer.
import '@/styles/tokens.css';
import './styles/landing.css';
import { Landing } from './Landing';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <Landing />
  </StrictMode>,
);
