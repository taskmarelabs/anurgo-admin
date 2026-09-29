import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { formatDate, formatMoney } from '../lib/format.js'
import { useAsync } from '../hooks/useAsync.js'
import { useListParams } from '../hooks/useListParams.js'
import { useToast } from '../components/Toast.jsx'
import Icon from '../components/Icon.jsx'
import {
  ActionButton, Avatar, Button, Card, ConfirmDialog, DetailList, EmptyState, Field, FormError, LoadState,
  Modal, PageHeader, Pagination, RowActions, SearchBox, StatusBadge, Table, inputClass,
} from '../components/ui.jsx'

const PAGE_SIZE = 20

export default function Users() {
  const toast = useToast()
  const [{ search, page }, update] = useListParams({ search: '', page: 1 })
  const [viewId, setViewId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, error, loading, reload } = useAsync(() => api.users.list({ search, page, limit: PAGE_SIZE }), [search, page])

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={data ? `${data.total} customer${data.total === 1 ? '' : 's'}` : 'People booking services'}
        action={<SearchBox value={search} onSearch={(q) => update({ search: q })} placeholder="Name or phone" />}
      />

      <Card className="overflow-hidden">
        <LoadState loading={loading} error={error} onRetry={reload}>
          <Table
            rows={data?.items}
            onRowClick={(u) => setViewId(u._id)}
            empty={<EmptyState icon="customers" title="No customers found" message="Customers who sign up on the Anurgo app appear here." />}
            columns={[
              {
                key: 'name',
                label: 'Customer',
                primary: true,
                render: (u) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name || u.phone} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{u.name || 'Unnamed'}</p>
                      <p className="text-xs text-slate-500">{u.phone}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'email', label: 'Email', render: (u) => u.email || '—' },
              { key: 'bookingsCount', label: 'Bookings' },
              { key: 'addressCount', label: 'Addresses' },
              { key: 'createdAt', label: 'Joined', render: (u) => formatDate(u.createdAt) },
              { key: 'status', label: 'Status', render: (u) => <StatusBadge status={u.isActive ? 'active' : 'blocked'} /> },
              {
                key: 'actions',
                label: '',
                align: 'right',
                render: (u) => (
                  <RowActions>
                    <ActionButton icon="eye" label="View" tone="brand" onClick={() => setViewId(u._id)} />
                    <ActionButton icon="edit" label="Edit" onClick={() => setEditing(u)} />
                    <ActionButton
                      icon={u.isActive ? 'ban' : 'power'}
                      label={u.isActive ? 'Block' : 'Unblock'}
                      tone={u.isActive ? 'warning' : 'success'}
                      onClick={() => setToggling(u)}
                    />
                    <ActionButton icon="trash" label="Delete" tone="danger" onClick={() => setDeleting(u)} />
                  </RowActions>
                ),
              },
            ]}
          />
          {data && <Pagination page={page} total={data.total} limit={PAGE_SIZE} onChange={(p) => update({ page: p })} />}
        </LoadState>
      </Card>

      <UserView id={viewId} onClose={() => setViewId(null)} onEdit={setEditing} />

      <UserForm
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          toast('Customer updated')
          setEditing(null)
          setViewId(null)
          reload()
        }}
      />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.isActive ? 'Block customer?' : 'Unblock customer?'}
        message={
          toggling?.isActive
            ? `${toggling?.name || toggling?.phone} won't be able to make new bookings.`
            : `${toggling?.name || toggling?.phone} will be able to book services again.`
        }
        confirmLabel={toggling?.isActive ? 'Block' : 'Unblock'}
        tone={toggling?.isActive ? 'danger' : 'success'}
        onClose={() => setToggling(null)}
        onConfirm={async () => {
          await api.users.setActive(toggling._id, !toggling.isActive)
          toast(toggling.isActive ? 'Customer blocked' : 'Customer unblocked')
          reload()
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete customer?"
        message={`This permanently removes ${deleting?.name || deleting?.phone}. Customers with bookings can't be deleted — block them instead.`}
        confirmLabel="Delete"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await api.users.remove(deleting._id)
          toast('Customer deleted')
          reload()
        }}
      />
    </>
  )
}

function UserView({ id, onClose, onEdit }) {
  const { data: u, error, loading } = useAsync(() => (id ? api.users.get(id) : Promise.resolve(null)), [id])
  const s = u?.bookingStats

  return (
    <Modal
      open={Boolean(id)}
      size="lg"
      title={u?.name || u?.phone || 'Customer'}
      subtitle={u && <div className="mt-1"><StatusBadge status={u.isActive ? 'active' : 'blocked'} /></div>}
      onClose={onClose}
      footer={
        u && (
          <>
            <Link to={`/bookings?search=${u.phone}`} onClick={onClose}>
              <Button variant="secondary" icon="bookings">View bookings</Button>
            </Link>
            <Button icon="edit" onClick={() => onEdit(u)}>Edit</Button>
          </>
        )
      }
    >
      <LoadState loading={loading} error={error} rows={4}>
        {u && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Bookings" value={s.total} />
              <Metric label="Completed" value={s.completed ?? 0} />
              <Metric label="Cancelled" value={s.cancelled ?? 0} />
              <Metric label="Total spent" value={formatMoney(s.totalSpent)} />
            </div>

            <DetailList
              items={[
                { label: 'Phone', value: u.phone },
                { label: 'Email', value: u.email },
                { label: 'Wallet balance', value: formatMoney(u.walletBalance) },
                { label: 'Joined', value: formatDate(u.createdAt) },
              ]}
            />

            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">Saved addresses</p>
              {u.addresses?.length ? (
                <div className="space-y-2">
                  {u.addresses.map((a) => (
                    <div key={a._id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 text-sm">
                      <Icon name="mapPin" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">
                          {a.label}
                          {a.isDefault && <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-600">Default</span>}
                        </p>
                        <p className="text-slate-500">{[a.line, a.landmark, a.pincode].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No saved addresses</p>
              )}
            </div>
          </div>
        )}
      </LoadState>
    </Modal>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className="truncate text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function UserForm({ user, onClose, onSaved }) {
  const [form, setForm] = useState(null)
  const [source, setSource] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (user !== source) {
    setSource(user)
    setForm(user ? { name: user.name ?? '', email: user.email ?? '' } : null)
    setError(null)
  }
  if (!user || !form) return null

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.users.update(user._id, form)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title="Edit customer"
      subtitle={`${user.phone} · phone number can't be changed`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="user-form" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <FormError error={error} />
      </form>
    </Modal>
  )
}
