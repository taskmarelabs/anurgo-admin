import { getAdminKey, setAdminKey } from './auth.js'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

function authHeaders(key = getAdminKey()) {
  return key ? { 'x-admin-key': key } : {}
}

async function send(path, { method = 'GET', body, query, key } = {}) {
  const params = query
    ? '?' + new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== '')).toString()
    : ''

  const res = await fetch(`${BASE_URL}${path}${params}`, {
    method,
    headers: { ...authHeaders(key), ...(body && { 'Content-Type': 'application/json' }) },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && !key) setAdminKey(null)
  return res
}

async function request(path, options) {
  const res = await send(path, options)
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed (${res.status})`)
  }
  return json.data
}

export async function verifyAdminKey(key) {
  await request('/admin/stats', { key })
}

export async function openPartnerDocument(id, docType) {
  const tab = window.open('', '_blank')
  const res = await send(`/admin/partners/${id}/documents/${docType}`)
  if (!res.ok) {
    tab?.close()
    const json = await res.json().catch(() => ({}))
    throw new Error(json.message || 'Could not open document')
  }
  const url = URL.createObjectURL(await res.blob())
  if (tab) tab.location.href = url
  else window.location.href = url
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

export const api = {
  categories: {
    list: () => request('/catalog/categories', { query: { includeInactive: true } }),
    create: (body) => request('/catalog/categories', { method: 'POST', body }),
    update: (id, body) => request(`/catalog/categories/${id}`, { method: 'PATCH', body }),
    remove: (id) => request(`/catalog/categories/${id}`, { method: 'DELETE' }),
  },
  services: {
    list: (query) => request('/catalog/services', { query: { includeInactive: true, ...query } }),
    get: (id) => request(`/catalog/services/${id}`),
    create: (body) => request('/catalog/services', { method: 'POST', body }),
    update: (id, body) => request(`/catalog/services/${id}`, { method: 'PATCH', body }),
    remove: (id) => request(`/catalog/services/${id}`, { method: 'DELETE' }),
  },
  partners: {
    list: (query) => request('/partners', { query }),
    get: (id) => request(`/partners/${id}`),
    update: (id, body) => request(`/partners/${id}`, { method: 'PATCH', body }),
    setStatus: (id, body) => request(`/partners/${id}/status`, { method: 'PATCH', body }),
    remove: (id) => request(`/admin/partners/${id}`, { method: 'DELETE' }),
    settle: (id, payoutRef) => request(`/partners/${id}/earnings/settle`, { method: 'POST', body: { payoutRef } }),
  },
  users: {
    list: (query) => request('/admin/users', { query }),
    get: (id) => request(`/admin/users/${id}`),
    update: (id, body) => request(`/admin/users/${id}`, { method: 'PATCH', body }),
    setActive: (id, isActive) => request(`/admin/users/${id}/active`, { method: 'PATCH', body: { isActive } }),
    remove: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  },
  bookings: {
    list: (query) => request('/admin/bookings', { query }),
    get: (id) => request(`/admin/bookings/${id}`),
    cancel: (id, reason) => request(`/admin/bookings/${id}/cancel`, { method: 'PATCH', body: { reason } }),
  },
  admin: {
    stats: () => request('/admin/stats'),
    payouts: () => request('/admin/payouts'),
  },
}
