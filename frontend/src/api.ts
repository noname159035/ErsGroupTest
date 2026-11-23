export type User = {
  id: number
  email: string
}

export type Employee = {
  id: number
  fullName: string
  position: string
  department: string
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) {
    const message = typeof data.error === 'string' ? data.error : 'Не получилось выполнить запрос'
    throw new Error(message)
  }
  return data as T
}

export async function currentUser() {
  const res = await fetch('/api/auth/me', { credentials: 'include' })
  if (res.status === 401) return null
  const data = await res.json()
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Не получилось проверить вход')
  }
  return data.user as User
}
