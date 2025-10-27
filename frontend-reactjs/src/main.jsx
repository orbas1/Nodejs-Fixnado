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
import AppErrorBoundary from './components/error/AppErrorBoundary.jsx';
import './styles.css';

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { ensureProviderDevSession } = await import('./dev/bootstrapProviderSession.js');
    ensureProviderDevSession();
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <LocaleProvider>
          <FeatureToggleProvider>
            <PersonaProvider>
              <ThemeProvider>
                <AdminSessionProvider>
                  <ConsentProvider>
                    <AppErrorBoundary
                      boundaryId="app-root"
                      metadata={{ surface: 'web-app', release: '1.50' }}
                      onReset={() => {
                        if (typeof window !== 'undefined') {
                          window.location.reload();
                        }
                      }}
                    >
                      <App />
                    </AppErrorBoundary>
                  </ConsentProvider>
                </AdminSessionProvider>
              </ThemeProvider>
            </PersonaProvider>
          </FeatureToggleProvider>
        </LocaleProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

bootstrap();
