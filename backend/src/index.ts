import cookieParser from 'cookie-parser'
import express from 'express'
import './types'
import { authRouter } from './authRoutes'
import { getDb } from './db'
import { employeeRouter } from './employeeRoutes'

getDb()

const app = express()
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/employees', employeeRouter)

app.use((err: { status?: number; type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (res.headersSent) return
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Некорректный запрос' })
    return
  }
  console.error(err)
  res.status(err.status && err.status < 500 ? err.status : 500).json({ error: 'Ошибка сервера' })
})

const port = Number(process.env.PORT) || 3001
app.listen(port, () => {
  console.log(`API слушает порт ${port}`)
})
