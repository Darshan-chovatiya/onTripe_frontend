import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
import ProtectedRoute from './components/common/ProtectedRoute'
import ToastContainer from './components/common/ToastContainer'
import Layout from './components/layout/Layout'
import Loading from './components/common/Loading'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

function App() {
  const { isAuthenticated, checkAuth, isCheckingAuth, user } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
      root.setAttribute('data-theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
      root.setAttribute('data-theme', 'light')
    }
    void root.offsetHeight
    setTimeout(() => {
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }, 0)
  }, [theme])

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loading size="lg" text="Loading..." />
      </div>
    )
  }

  const profileComplete = Boolean(user?.name && user?.email)

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated && profileComplete ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default App
