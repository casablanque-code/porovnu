import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { WifiOff } from 'lucide-react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/Toast'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import InvitePage from './pages/InvitePage'
import OnboardingPage from './pages/OnboardingPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import PartnerPage from './pages/PartnerPage'
import HistoryPage from './pages/HistoryPage'
import NotFoundPage from './pages/NotFoundPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/onboarding" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  // Если юзер авторизован — на главную
  if (user) return <Navigate to="/" replace />
  // Если ждёт подтверждения email — показываем страницу (не онбординг)
  return children
}


function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      background: 'rgba(92,61,46,0.95)', backdropFilter: 'blur(8px)',
      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '10px 16px',
      fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700,
      animation: 'slideDown 0.3s ease both',
    }}>
      <WifiOff size={15} strokeWidth={2}/>
      Нет соединения
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <OfflineBanner />
          <Routes>
            <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/onboarding" element={<PublicRoute><OnboardingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/invite/:code" element={<InvitePage />} />
            <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
            <Route path="/settings/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/settings/partner" element={<PrivateRoute><PartnerPage /></PrivateRoute>} />
            <Route path="/settings/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
