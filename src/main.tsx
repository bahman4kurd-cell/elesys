import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import App from './App.tsx';
import 'leaflet/dist/leaflet.css';
import './index.css';

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-2xl rounded-lg border border-rose-500/50 bg-slate-900 p-6">
            <h1 className="text-xl font-bold text-rose-300">هەڵەیەک لە بارکردنی سیستەم ڕوویدا</h1>
            <p className="mt-3 text-sm text-slate-300">{this.state.error.message}</p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('The application root element is missing.');
}

document.getElementById('startup-status')?.remove();

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
