import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import { ThemeProvider } from './store/ThemeContext';
import { FeatureProvider } from './context/FeatureContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <FeatureProvider>
          <App />
        </FeatureProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
