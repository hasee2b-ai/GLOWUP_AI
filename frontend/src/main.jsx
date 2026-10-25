import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ToastProvider } from './components/Toast.jsx'
import MouseEffects from './components/MouseEffects.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
        {/* Click effects for every route. Fixed + full-viewport so effect
            coordinates are viewport-relative, and click-through so it never
            blocks the UI (the component listens on `document`). Toasts stay
            above it (z-[100]). */}
        <div
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 90 }}
        >
          <MouseEffects color="var(--color-primary)" showLabel={false} />
        </div>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)
