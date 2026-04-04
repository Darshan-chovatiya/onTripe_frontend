import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import ToastContainer from '@/shared/components/ToastContainer.jsx'
import ErrorBoundary from '@/shared/components/ErrorBoundary.jsx'
import AppRouter from '@/routes/AppRouter.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastContainer />
            <AppRouter />
          </AuthProvider>
        </ThemeProvider>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>
)
