import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/session'; // configures the api client before anything makes a request
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
