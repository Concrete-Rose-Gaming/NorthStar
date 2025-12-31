import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2931c91c-bbcd-4816-940e-f13e29404761', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'src/index.tsx:entry',
    message: 'index.tsx script started executing',
    data: { timestamp: Date.now() },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'white-page-debug',
    hypothesisId: 'A'
  })
}).catch(() => {});
// #endregion

const rootElement = document.getElementById('root');

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2931c91c-bbcd-4816-940e-f13e29404761', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'src/index.tsx:rootElement-check',
    message: 'Root element lookup',
    data: { rootElementExists: !!rootElement, rootElementId: rootElement?.id },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'white-page-debug',
    hypothesisId: 'A'
  })
}).catch(() => {});
// #endregion

if (!rootElement) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2931c91c-bbcd-4816-940e-f13e29404761', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'src/index.tsx:rootElement-error',
      message: 'Root element not found - fatal error',
      data: {},
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'white-page-debug',
      hypothesisId: 'A'
    })
  }).catch(() => {});
  // #endregion
  throw new Error('Root element not found');
}

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2931c91c-bbcd-4816-940e-f13e29404761', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'src/index.tsx:before-render',
    message: 'About to create root and render',
    data: {},
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'white-page-debug',
    hypothesisId: 'A'
  })
}).catch(() => {});
// #endregion

try {
  const root = ReactDOM.createRoot(rootElement);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2931c91c-bbcd-4816-940e-f13e29404761', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'src/index.tsx:root-created',
      message: 'React root created successfully',
      data: {},
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'white-page-debug',
      hypothesisId: 'A'
    })
  }).catch(() => {});
  // #endregion
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2931c91c-bbcd-4816-940e-f13e29404761', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'src/index.tsx:render-complete',
      message: 'React render call completed',
      data: {},
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'white-page-debug',
      hypothesisId: 'A'
    })
  }).catch(() => {});
  // #endregion
} catch (error) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2931c91c-bbcd-4816-940e-f13e29404761', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'src/index.tsx:render-error',
      message: 'Error during React render',
      data: { errorMessage: error instanceof Error ? error.message : String(error), errorStack: error instanceof Error ? error.stack : undefined },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'white-page-debug',
      hypothesisId: 'A'
    })
  }).catch(() => {});
  // #endregion
  throw error;
}

