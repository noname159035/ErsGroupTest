import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, type Employee } from '../api'

type Props = {
  user: { email: string }
  onLogout: () => void
}

type ListResponse = {
  employees: Employee[]
  departments: string[]
}

function listUrl(query: string, department: string) {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (department) params.set('department', department)
  const qs = params.toString()
  return qs ? `/api/employees?${qs}` : '/api/employees'
}

export default function EmployeesPage({ user, onLogout }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('')
  const [fullName, setFullName] = useState('')
  const [position, setPosition] = useState('')
  const [newDepartment, setNewDepartment] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const listSeq = useRef(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  function showList(seq: number, data: ListResponse) {
    if (!alive.current || seq !== listSeq.current) return
    setEmployees(data.employees)
    setDepartments(data.departments)
    setError('')
  }

  useEffect(() => {
    const controller = new AbortController()
    const seq = ++listSeq.current
    const timer = window.setTimeout(() => {
      api<ListResponse>(listUrl(query, department), { signal: controller.signal })
        .then((data) => showList(seq, data))
        .catch((err: unknown) => {
          if (!alive.current || controller.signal.aborted || seq !== listSeq.current) return
          setError(err instanceof Error ? err.message : 'Не получилось загрузить список')
        })
    }, 200)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, department])

  async function reload() {
    const seq = ++listSeq.current
    const data = await api<ListResponse>(listUrl(query, department))
    showList(seq, data)
  }

  async function addEmployee(event: FormEvent) {
    event.preventDefault()
    if (!fullName.trim() || !position.trim() || !newDepartment.trim()) {
      setError('Заполните ФИО, должность и отдел')
      return
    }

    setSaving(true)
    setError('')
    try {
      await api('/api/employees', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          position,
          department: newDepartment,
        }),
      })
      if (!alive.current) return
      setFullName('')
      setPosition('')
      setNewDepartment('')
      await reload()
    } catch (err) {
      if (!alive.current) return
      setError(err instanceof Error ? err.message : 'Не получилось сохранить')
    } finally {
      if (alive.current) setSaving(false)
    }
  }

  async function logout() {
    setLeaving(true)
    try {
      await api('/api/auth/logout', { method: 'POST' })
      onLogout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не получилось выйти')
      setLeaving(false)
    }
  }

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <h1>Список сотрудников</h1>
          <div className="muted">{user.email}</div>
        </div>
        <button type="button" className="ghost" onClick={logout} disabled={leaving}>
          Выйти
        </button>
      </header>

      {error ? <div className="error">{error}</div> : null}

      <div className="layout">
        <form className="card" onSubmit={addEmployee}>
          <h2>Новый сотрудник</h2>
          <label>
            ФИО
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
          <label>
            Должность
            <input value={position} onChange={(event) => setPosition(event.target.value)} required />
          </label>
          <label>
            Отдел
            <input
              value={newDepartment}
              onChange={(event) => setNewDepartment(event.target.value)}
              list="department-options"
              required
            />
          </label>
          <datalist id="department-options">
            {departments.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <button type="submit" disabled={saving}>
            {saving ? 'Сохраняем...' : 'Добавить'}
          </button>
        </form>

        <section className="card">
          <div className="filters">
            <label>
              Поиск по ФИО
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Например, Петрова"
              />
            </label>
            <label>
              Отдел
              <select value={department} onChange={(event) => setDepartment(event.target.value)}>
                <option value="">Все отделы</option>
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <table>
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Должность</th>
                <th>Отдел</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">
                    Никого не нашли
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.fullName}</td>
                    <td>{employee.position}</td>
                    <td>{employee.department}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
