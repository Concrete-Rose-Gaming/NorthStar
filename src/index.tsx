import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/cb56b80d-4377-4047-a30a-c397732dacfd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/index.tsx:entry',message:'index.tsx script started executing',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
// #endregion

const rootElement = document.getElementById('root');

// #region agent log
fetch('http://127.0.0.1:7242/ingest/cb56b80d-4377-4047-a30a-c397732dacfd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/index.tsx:rootElement-check',message:'Root element lookup',data:{rootElementExists:!!rootElement,rootElementId:'root'},timestamp:Date.now(),sessionId:'debug-session',runId:'white-page-debug',hypothesisId:'A'})}).catch(()=>{});
// #endregion

if (!rootElement) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cb56b80d-4377-4047-a30a-c397732dacfd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/index.tsx:rootElement-error',message:'Root element not found - this will cause white page',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'white-page-debug',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  throw new Error('Root element not found');
}

// #region agent log
fetch('http://127.0.0.1:7242/ingest/cb56b80d-4377-4047-a30a-c397732dacfd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/index.tsx:before-render',message:'About to create root and render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'white-page-debug',hypothesisId:'A'})}).catch(()=>{});
// #endregion

const root = ReactDOM.createRoot(rootElement);

// #region agent log
fetch('http://127.0.0.1:7242/ingest/cb56b80d-4377-4047-a30a-c397732dacfd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/index.tsx:root-created',message:'React root created successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'white-page-debug',hypothesisId:'A'})}).catch(()=>{});
// #endregion

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// #region agent log
setTimeout(() => {
  const stylesheets = Array.from(document.styleSheets).map(s => s.href || 'inline');
  const computedStyle = window.getComputedStyle(document.body);
  fetch('http://127.0.0.1:7242/ingest/cb56b80d-4377-4047-a30a-c397732dacfd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/index.tsx:render-complete',message:'React render call completed - checking CSS',data:{stylesheetsCount:stylesheets.length,stylesheets,bodyBg:computedStyle.background,bodyColor:computedStyle.color,baseHref:document.querySelector('base')?.href},timestamp:Date.now(),sessionId:'debug-session',runId:'white-page-debug',hypothesisId:'D'})}).catch(()=>{});
}, 100);
// #endregion
