import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { readUser, signIn, signOut } from './auth'
import { getDb } from './db'

export const authRouter = Router()

type UserRow = {
  id: number
  email: string
  password_hash: string
}

function readEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function readPassword(value: unknown) {
  return typeof value === 'string' ? value : ''
}

authRouter.post('/register', (req, res) => {
  const email = readEmail(req.body?.email)
  const password = readPassword(req.body?.password)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Укажите корректный email' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' })
    return
  }
  if (password.length > 72) {
    res.status(400).json({ error: 'Пароль слишком длинный' })
    return
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    res.status(409).json({ error: 'Такой email уже зарегистрирован' })
    return
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const info = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, passwordHash)
  const user = { id: Number(info.lastInsertRowid), email }
  signIn(res, user)
  res.status(201).json({ user })
})

authRouter.post('/login', (req, res) => {
  const email = readEmail(req.body?.email)
  const password = readPassword(req.body?.password)
  const db = getDb()
  const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email) as
    | UserRow
    | undefined

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Неверный email или пароль' })
    return
  }

  signIn(res, { id: user.id, email: user.email })
  res.json({ user: { id: user.id, email: user.email } })
})

authRouter.post('/logout', (_req, res) => {
  signOut(res)
  res.json({ ok: true })
})

authRouter.get('/me', (req, res) => {
  const user = readUser(req)
  if (!user) {
    res.status(401).json({ error: 'Нужно войти' })
    return
  }
  res.json({ user })
})
