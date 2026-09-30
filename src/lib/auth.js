const STORAGE_KEY = 'anurgo-admin-session'

let session
const listeners = new Set()

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? null
  } catch {
    return null
  }
}

export function getSession() {
  if (session === undefined) session = readStored()
  return session
}

export function getToken() {
  return getSession()?.token ?? null
}

export function setSession(next) {
  session = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    session = next
  }
  listeners.forEach((fn) => fn(next))
}

export function onSessionChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
