import fs from 'fs'
import path from 'path'
import { DatabaseSync } from 'node:sqlite'

const dataDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dataDir, 'employees.db')

let db: DatabaseSync | null = null

const demoEmployees: Array<[string, string, string]> = [
  ['Иванов Иван Иванович', 'Менеджер по продажам', 'Продажи'],
  ['Петрова Анна Сергеевна', 'Бухгалтер', 'Финансы'],
  ['Сидоров Павел Андреевич', 'Разработчик', 'Разработка'],
  ['Кузнецова Мария Олеговна', 'Специалист по кадрам', 'Кадры'],
  ['Новиков Алексей Дмитриевич', 'Аналитик', 'Финансы'],
]

export function getDb() {
  if (db) return db

  fs.mkdirSync(dataDir, { recursive: true })
  db = new DatabaseSync(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      position TEXT NOT NULL,
      department TEXT NOT NULL
    );
  `)

  const countRow = db.prepare('SELECT COUNT(*) AS count FROM employees').get() as { count: number }
  if (countRow.count === 0) {
    const insert = db.prepare(
      'INSERT INTO employees (full_name, position, department) VALUES (?, ?, ?)',
    )
    for (const [fullName, position, department] of demoEmployees) {
      insert.run(fullName, position, department)
    }
  }

  return db
}
