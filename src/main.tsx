import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { initializeTheme } from './lib/theme'
import ToastViewport from './components/ui/ToastViewport'

initializeTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToastViewport />
    </BrowserRouter>
  </React.StrictMode>,
)
