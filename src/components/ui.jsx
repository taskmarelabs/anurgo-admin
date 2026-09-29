import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}

export function Card({ className = '', children }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {children}
    </div>
  )
}

const BUTTON_VARIANTS = {
  primary: 'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700',
  success: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700',
}

export function Button({ variant = 'primary', icon, className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} className="h-4 w-4" strokeWidth={2} />}
      {children}
    </button>
  )
}

const ACTION_TONES = {
  default: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
  brand: 'text-slate-500 hover:bg-brand-50 hover:text-brand-600',
  success: 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600',
  warning: 'text-slate-500 hover:bg-amber-50 hover:text-amber-600',
  danger: 'text-slate-500 hover:bg-red-50 hover:text-red-600',
}

export function ActionButton({ icon, label, tone = 'default', ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${ACTION_TONES[tone]}`}
      {...props}
    >
      <Icon name={icon} className="h-[18px] w-[18px]" />
    </button>
  )
}

export function RowActions({ children }) {
  return (
    <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  )
}

const STATUS_STYLES = {
  pending: ['bg-amber-50 text-amber-700 ring-amber-600/20', 'bg-amber-500'],
  approved: ['bg-emerald-50 text-emerald-700 ring-emerald-600/20', 'bg-emerald-500'],
  rejected: ['bg-red-50 text-red-700 ring-red-600/20', 'bg-red-500'],
  suspended: ['bg-slate-100 text-slate-600 ring-slate-500/20', 'bg-slate-400'],
  active: ['bg-emerald-50 text-emerald-700 ring-emerald-600/20', 'bg-emerald-500'],
  inactive: ['bg-slate-100 text-slate-600 ring-slate-500/20', 'bg-slate-400'],
  blocked: ['bg-red-50 text-red-700 ring-red-600/20', 'bg-red-500'],
  scheduled: ['bg-sky-50 text-sky-700 ring-sky-600/20', 'bg-sky-500'],
  assigned: ['bg-indigo-50 text-indigo-700 ring-indigo-600/20', 'bg-indigo-500'],
  on_the_way: ['bg-violet-50 text-violet-700 ring-violet-600/20', 'bg-violet-500'],
  in_progress: ['bg-amber-50 text-amber-700 ring-amber-600/20', 'bg-amber-500'],
  completed: ['bg-emerald-50 text-emerald-700 ring-emerald-600/20', 'bg-emerald-500'],
  cancelled: ['bg-red-50 text-red-700 ring-red-600/20', 'bg-red-500'],
  paid: ['bg-emerald-50 text-emerald-700 ring-emerald-600/20', 'bg-emerald-500'],
  refund_pending: ['bg-amber-50 text-amber-700 ring-amber-600/20', 'bg-amber-500'],
  refunded: ['bg-slate-100 text-slate-600 ring-slate-500/20', 'bg-slate-400'],
}

export function StatusBadge({ status }) {
  if (!status) return null
  const [style, dot] = STATUS_STYLES[status] ?? STATUS_STYLES.inactive
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export function Avatar({ name, className = '' }) {
  const initials = (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white ${className}`}>
      {initials}
    </span>
  )
}

export function Skeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  )
}

export function LoadState({ loading, error, onRetry, children, rows }) {
  if (loading) return <Skeleton rows={rows} />
  if (error) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-500">
          <Icon name="alert" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-900">Something went wrong</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        {onRetry && (
          <Button variant="secondary" icon="refresh" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    )
  }
  return children
}

export function EmptyState({ icon = 'file', title, message, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Icon name={icon} />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Table({ columns, rows, rowKey = '_id', empty, onRowClick }) {
  if (!rows?.length) return empty ?? <EmptyState title="Nothing here yet" />

  const primary = columns.find((c) => c.primary) ?? columns[0]
  const actions = columns.find((c) => c.key === 'actions')
  const rest = columns.filter((c) => c !== primary && c !== actions && !c.hideOnMobile)

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {columns.map((c) => (
                <th key={c.key} className={`whitespace-nowrap px-5 py-3.5 ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition hover:bg-slate-50/80 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`whitespace-nowrap px-5 py-3.5 ${c.align === 'right' ? 'text-right' : ''}`}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 md:hidden">
        {rows.map((row) => (
          <li
            key={row[rowKey]}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`p-4 ${onRowClick ? 'cursor-pointer active:bg-slate-50' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">{primary.render ? primary.render(row) : row[primary.key]}</div>
              {actions && <div className="-mr-2 -mt-1 shrink-0">{actions.render(row)}</div>}
            </div>
            {rest.length > 0 && (
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {rest.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-xs text-slate-400">{c.label}</dt>
                    <dd className="mt-0.5 truncate text-slate-700">{c.render ? c.render(row) : row[c.key]}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

export function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.max(Math.ceil(total / limit), 1)
  if (totalPages <= 1) return null
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm">
      <p className="text-slate-500">
        <span className="font-medium text-slate-700">{from}–{to}</span> of {total}
      </p>
      <div className="flex gap-1">
        <ActionButton icon="chevronLeft" label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)} />
        <ActionButton icon="chevronRight" label="Next page" disabled={page >= totalPages} onClick={() => onChange(page + 1)} />
      </div>
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex gap-1 rounded-xl bg-slate-200/60 p-1">
        {tabs.map((tab) => {
          const key = typeof tab === 'string' ? tab : tab.value
          const label = typeof tab === 'string' ? tab : tab.label
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
                value === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label.replace(/_/g, ' ')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SearchBox({ value, onSearch, placeholder = 'Search' }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSearch(text.trim())
      }}
      className="relative w-full sm:w-72"
    >
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        className={`${inputClass} pl-9 pr-9`}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText('')
            onSearch('')
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'

export function Modal({ open, title, subtitle, onClose, size = 'md', children, footer }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const width = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl animate-slide-up sm:rounded-2xl ${width}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-slate-500">{subtitle}</div>}
          </div>
          <ActionButton icon="x" label="Close" onClick={onClose} />
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:rounded-b-2xl sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', tone = 'danger', requireReason, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setReason('')
      setError(null)
    }
  }, [open])

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await onConfirm(reason.trim())
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      size="sm"
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={tone} onClick={submit} disabled={busy || (requireReason && !reason.trim())}>
            {busy ? 'Please wait…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
      {requireReason && (
        <div className="mt-4">
          <Field label={requireReason}>
            <textarea rows={3} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
          </Field>
        </div>
      )}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </Modal>
  )
}

export function DetailList({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.filter(Boolean).map((item) => (
        <div key={item.label} className={item.wide ? 'sm:col-span-2' : ''}>
          <dt className="text-xs font-medium text-slate-400">{item.label}</dt>
          <dd className="mt-1 text-sm text-slate-800">{item.value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

export function FormError({ error }) {
  if (!error) return null
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
}
