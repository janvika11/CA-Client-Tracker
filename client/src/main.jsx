import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';
import { useUIStore } from './store/uiStore';

/** Keep `<html class="dark">` in sync everywhere (Landing/Login don’t mount Layout). */
function syncDomTheme(isDark) {
  document.documentElement.classList.toggle('dark', Boolean(isDark));
}
syncDomTheme(useUIStore.getState().isDark);
useUIStore.subscribe((state) => {
  syncDomTheme(state.isDark);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
