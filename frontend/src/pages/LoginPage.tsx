import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, type User } from '../api'

type Props = {
  onAuth: (user: User) => void
}

export default function LoginPage({ onAuth }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const data = await api<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      onAuth(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не получилось войти')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="wrap">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>Вход</h1>
        <p className="muted">Список сотрудников открывается после входа.</p>
        {error ? <div className="error">{error}</div> : null}
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? 'Входим...' : 'Войти'}
        </button>
        <p className="muted">
          Нет аккаунта? <Link to="/register">Регистрация</Link>
        </p>
      </form>
    </div>
  )
}
