const STORAGE_KEY = 'anurgo-admin-key'

let memoryKey = null
const listeners = new Set()

export function getAdminKey() {
  if (memoryKey) return memoryKey
  try {
    memoryKey = localStorage.getItem(STORAGE_KEY)
  } catch {
    memoryKey = null
  }
  return memoryKey
}

export function setAdminKey(key) {
  memoryKey = key
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    return
  } finally {
    listeners.forEach((fn) => fn(key))
  }
}

export function onAdminKeyChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
