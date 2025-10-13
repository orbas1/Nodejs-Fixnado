import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ThemeProvider } from './providers/ThemeProvider.jsx';
import { LocaleProvider } from './providers/LocaleProvider.jsx';
import { FeatureToggleProvider } from './providers/FeatureToggleProvider.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <FeatureToggleProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </FeatureToggleProvider>
      </LocaleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
