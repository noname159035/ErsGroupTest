import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, type User } from '../api'

type Props = {
  onAuth: (user: User) => void
}

export default function RegisterPage({ onAuth }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов')
      return
    }
    setPending(true)
    try {
      const data = await api<{ user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      onAuth(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не получилось зарегистрироваться')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="wrap">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>Регистрация</h1>
        <p className="muted">После регистрации сразу попадёте в список.</p>
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? 'Сохраняем...' : 'Создать аккаунт'}
        </button>
        <p className="muted">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  )
}
