import { useState } from 'react'
import { verifyAdminKey } from '../lib/api.js'
import { setAdminKey } from '../lib/auth.js'
import Icon from '../components/Icon.jsx'
import { Button, Field, FormError, inputClass } from '../components/ui.jsx'
import logoFull from '../assets/logo-full.png'

export default function Login() {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await verifyAdminKey(key.trim())
      setAdminKey(key.trim())
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
        <img src={logoFull} alt="Anurgo" className="relative h-20 w-auto self-start" />
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">Run Prayagraj's home services marketplace from one place.</h2>
          <p className="mt-4 max-w-md text-white/70">
            Approve partners, track bookings, manage the service catalog and settle payouts.
          </p>
        </div>
        <p className="relative text-sm text-white/50">© {new Date().getFullYear()} Anurgo</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center rounded-2xl bg-navy-900 p-4 lg:hidden">
            <img src={logoFull} alt="Anurgo" className="h-14 w-auto" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Enter the admin key configured on the server.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Admin key">
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  autoFocus
                  autoComplete="current-password"
                  className={`${inputClass} pr-11`}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-slate-600"
                  aria-label={show ? 'Hide key' : 'Show key'}
                >
                  <Icon name="eye" className="h-4 w-4" />
                </button>
              </div>
            </Field>
            <FormError error={error} />
            <Button type="submit" className="w-full py-2.5" disabled={busy || !key.trim()}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
