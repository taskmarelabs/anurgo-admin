import { useSearchParams } from 'react-router-dom'

export function useListParams(defaults) {
  const [params, setParams] = useSearchParams()

  const values = Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => {
      const raw = params.get(key)
      if (raw === null) return [key, fallback]
      return [key, typeof fallback === 'number' ? Number(raw) || fallback : raw]
    }),
  )

  const update = (next) => {
    const merged = { ...values, page: defaults.page ?? undefined, ...next }
    setParams(
      Object.fromEntries(
        Object.entries(merged)
          .filter(([key, value]) => value !== '' && value !== undefined && value !== defaults[key])
          .map(([key, value]) => [key, String(value)]),
      ),
    )
  }

  return [values, update]
}
