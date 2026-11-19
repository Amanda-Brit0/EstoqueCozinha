import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a0a0a',
            color: '#f5e6c8',
            border: '1px solid #8B1A1A',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#D4AF37', secondary: '#1a0a0a' } },
          error:   { iconTheme: { primary: '#ff4444', secondary: '#1a0a0a' } },
        }}
      />
    </HashRouter>
  </React.StrictMode>
)
