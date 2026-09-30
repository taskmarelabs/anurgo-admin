import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Icon from './Icon.jsx'
import { Avatar, Button, Field, FormError, Modal, inputClass } from './ui.jsx'
import { useToast } from './Toast.jsx'
import { getSession } from '../lib/auth.js'
import { changePassword, logout } from '../lib/api.js'
import logoFull from '../assets/logo-full.png'
import logoMark from '../assets/logo-mark.png'

const NAV = [
  {
    section: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: 'dashboard', end: true }],
  },
  {
    section: 'Operations',
    items: [
      { to: '/bookings', label: 'Bookings', icon: 'bookings' },
      { to: '/partners', label: 'Partners', icon: 'partners' },
      { to: '/users', label: 'Customers', icon: 'customers' },
      { to: '/payouts', label: 'Payouts', icon: 'payouts' },
    ],
  },
  {
    section: 'Catalog',
    items: [
      { to: '/services', label: 'Services', icon: 'services' },
      { to: '/categories', label: 'Categories', icon: 'categories' },
    ],
  },
]

const ALL_ITEMS = NAV.flatMap((g) => g.items)

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const { pathname } = useLocation()
  const current = ALL_ITEMS.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)))

  useEffect(() => setOpen(false), [pathname])

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85%] animate-slide-in">
            <Sidebar onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur sm:px-6 lg:px-8">
        <button
          onClick={() => setOpen(true)}
          className="-ml-1 grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Icon name="menu" />
        </button>
        <img src={logoMark} alt="" className="h-8 w-8 lg:hidden" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{current?.label ?? 'Admin'}</p>
          <p className="hidden text-xs text-slate-500 sm:block">Anurgo · Prayagraj</p>
        </div>
        <AccountMenu onChangePassword={() => setChangingPassword(true)} />
      </header>

      <ChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}

function Sidebar({ onClose }) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-navy-900 via-navy-900 to-navy-950 text-white">
      <div className="flex items-center justify-between px-5 pb-4 pt-6">
        <img src={logoFull} alt="Anurgo" className="h-14 w-auto" />
        {onClose && (
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10" aria-label="Close menu">
            <Icon name="x" />
          </button>
        )}
      </div>
      <div className="mx-5 mb-2 rounded-lg bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
        Admin console
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{group.section}</p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-accent-500" />}
                      <Icon name={item.icon} className={`h-5 w-5 ${isActive ? 'text-accent-500' : 'text-white/50 group-hover:text-white/80'}`} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-xs text-white/40">© {new Date().getFullYear()} Anurgo</div>
    </div>
  )
}

function AccountMenu({ onChangePassword }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const admin = getSession()?.admin

  useEffect(() => {
    if (!open) return undefined
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-3 rounded-xl p-1 pr-2 hover:bg-slate-100">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-900">{admin?.name ?? 'Admin'}</p>
          <p className="text-xs text-slate-500">{admin?.email}</p>
        </div>
        <Avatar name={admin?.name ?? 'Admin'} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-fade-in">
          <div className="border-b border-slate-100 px-4 py-3 sm:hidden">
            <p className="text-sm font-semibold text-slate-900">{admin?.name}</p>
            <p className="truncate text-xs text-slate-500">{admin?.email}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false)
              onChangePassword()
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Icon name="edit" className="h-4 w-4" /> Change password
          </button>
          <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
            <Icon name="logout" className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function ChangePasswordModal({ open, onClose }) {
  const toast = useToast()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const close = () => {
    setForm({ current: '', next: '', confirm: '' })
    setError(null)
    onClose()
  }

  const submit = async (e) => {
    e.preventDefault()
    if (form.next !== form.confirm) return setError('New passwords do not match')
    setBusy(true)
    setError(null)
    try {
      await changePassword(form.current, form.next)
      toast('Password changed')
      close()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <Modal
      open={open}
      size="sm"
      title="Change password"
      onClose={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" form="password-form" disabled={busy || !form.current || !form.next}>
            {busy ? 'Saving…' : 'Update password'}
          </Button>
        </>
      }
    >
      <form id="password-form" onSubmit={submit} className="space-y-4">
        <Field label="Current password">
          <input type="password" required autoComplete="current-password" className={inputClass} value={form.current} onChange={set('current')} />
        </Field>
        <Field label="New password" hint="At least 8 characters with letters and numbers">
          <input type="password" required minLength={8} autoComplete="new-password" className={inputClass} value={form.next} onChange={set('next')} />
        </Field>
        <Field label="Confirm new password">
          <input type="password" required autoComplete="new-password" className={inputClass} value={form.confirm} onChange={set('confirm')} />
        </Field>
        <FormError error={error} />
      </form>
    </Modal>
  )
}
