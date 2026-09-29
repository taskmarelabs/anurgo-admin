import { useCallback, useEffect, useState } from 'react'

export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fn())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  return { data, error, loading, reload: run }
}
