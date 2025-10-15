import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ThemeProvider } from './providers/ThemeProvider.jsx';
import { LocaleProvider } from './providers/LocaleProvider.jsx';
import { FeatureToggleProvider } from './providers/FeatureToggleProvider.jsx';
import { PersonaProvider } from './providers/PersonaProvider.jsx';
import { AdminSessionProvider } from './providers/AdminSessionProvider.jsx';
import { ConsentProvider } from './providers/ConsentProvider.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <FeatureToggleProvider>
          <PersonaProvider>
            <ThemeProvider>
              <AdminSessionProvider>
                <ConsentProvider>
                  <App />
                </ConsentProvider>
              </AdminSessionProvider>
            </ThemeProvider>
          </PersonaProvider>
        </FeatureToggleProvider>
      </LocaleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
