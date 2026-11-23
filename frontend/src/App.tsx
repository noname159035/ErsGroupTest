import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { currentUser, type User } from './api'
import EmployeesPage from './pages/EmployeesPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    currentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setReady(true))
  }, [])

  if (!ready) {
    return <div className="wrap muted">Загрузка...</div>
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage onAuth={setUser} />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <RegisterPage onAuth={setUser} />}
      />
      <Route
        path="/"
        element={
          user ? <EmployeesPage user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
