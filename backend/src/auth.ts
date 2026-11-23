import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { getDb } from './db'

const isProd = process.env.NODE_ENV === 'production'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function readSecret() {
  const fromEnv = process.env.JWT_SECRET
  if (fromEnv) return fromEnv
  if (isProd) {
    throw new Error('В production нужен JWT_SECRET')
  }
  return 'list-sotrudnikov-dev'
}

export const JWT_SECRET = readSecret()

type TokenUser = { id: number; email: string }

function sessionCookie() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/',
  }
}

export function readUser(req: Request): TokenUser | null {
  const token = req.cookies?.token
  if (!token || typeof token !== 'string') return null

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenUser
    const row = getDb().prepare('SELECT id, email FROM users WHERE id = ?').get(payload.id) as TokenUser | undefined
    if (!row) return null
    return { id: row.id, email: row.email }
  } catch {
    return null
  }
}

export function signIn(res: Response, user: TokenUser) {
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
  res.cookie('token', token, { ...sessionCookie(), maxAge: WEEK_MS })
}

export function signOut(res: Response) {
  res.clearCookie('token', sessionCookie())
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = readUser(req)
  if (!user) {
    res.status(401).json({ error: 'Нужно войти' })
    return
  }
  req.user = user
  next()
}
