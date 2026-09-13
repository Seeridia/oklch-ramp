import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import 'tdesign-react/es/_util/react-19-adapter';
import 'tdesign-react/dist/tdesign.css';
import './theme-scopes.css';
import './styles.css';

const container = document.querySelector('#root');

if (container === null) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
