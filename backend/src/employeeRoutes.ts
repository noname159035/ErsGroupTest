import { Router } from 'express'
import { requireAuth } from './auth'
import { getDb } from './db'

export const employeeRouter = Router()

type EmployeeRow = {
  id: number
  full_name: string
  position: string
  department: string
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function toEmployee(row: EmployeeRow) {
  return {
    id: row.id,
    fullName: row.full_name,
    position: row.position,
    department: row.department,
  }
}

employeeRouter.use(requireAuth)

employeeRouter.get('/', (req, res) => {
  const query = text(req.query.q).toLocaleLowerCase('ru-RU')
  const department = text(req.query.department)
  const db = getDb()

  let rows = db
    .prepare('SELECT id, full_name, position, department FROM employees ORDER BY full_name')
    .all() as EmployeeRow[]

  if (department) {
    rows = rows.filter((row) => row.department === department)
  }

  // lower() в SQLite не меняет кириллицу, поэтому имя сравниваем здесь
  if (query) {
    rows = rows.filter((row) => row.full_name.toLocaleLowerCase('ru-RU').includes(query))
  }

  const departments = db
    .prepare('SELECT DISTINCT department FROM employees ORDER BY department')
    .all() as Array<{ department: string }>

  res.json({
    employees: rows.map(toEmployee),
    departments: departments.map((row) => row.department),
  })
})

employeeRouter.post('/', (req, res) => {
  const fullName = text(req.body?.fullName)
  const position = text(req.body?.position)
  const department = text(req.body?.department)

  if (fullName.length < 2) {
    res.status(400).json({ error: 'Укажите ФИО' })
    return
  }
  if (!position) {
    res.status(400).json({ error: 'Укажите должность' })
    return
  }
  if (!department) {
    res.status(400).json({ error: 'Укажите отдел' })
    return
  }
  if (fullName.length > 150 || position.length > 100 || department.length > 100) {
    res.status(400).json({ error: 'Слишком длинное значение' })
    return
  }

  const info = getDb()
    .prepare('INSERT INTO employees (full_name, position, department) VALUES (?, ?, ?)')
    .run(fullName, position, department)

  res.status(201).json({
    employee: {
      id: Number(info.lastInsertRowid),
      fullName,
      position,
      department,
    },
  })
})
