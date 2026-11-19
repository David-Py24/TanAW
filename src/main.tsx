import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PhoneDesktopShell } from './components/PhoneDesktopShell.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <PhoneDesktopShell>
    <App />
  </PhoneDesktopShell>
);
