import { useState } from 'react'
import { api, openPartnerDocument } from '../lib/api.js'
import { formatDate, formatMoney } from '../lib/format.js'
import { useAsync } from '../hooks/useAsync.js'
import { useListParams } from '../hooks/useListParams.js'
import { useToast } from '../components/Toast.jsx'
import Icon from '../components/Icon.jsx'
import {
  ActionButton, Avatar, Button, Card, ConfirmDialog, DetailList, EmptyState, Field, FormError, LoadState,
  Modal, PageHeader, Pagination, RowActions, SearchBox, StatusBadge, Table, Tabs, inputClass,
} from '../components/ui.jsx'

const TABS = ['all', 'pending', 'approved', 'suspended', 'rejected']
const PAGE_SIZE = 20
const DOCS = [
  ['aadhaarFront', 'Aadhaar front'],
  ['aadhaarBack', 'Aadhaar back'],
  ['panCard', 'PAN card'],
]

const ACTIONS = {
  approve: { status: 'approved', title: 'Approve partner?', message: 'They will be visible to customers and can start receiving jobs.', label: 'Approve', tone: 'success', toast: 'approved' },
  reactivate: { status: 'approved', title: 'Reactivate partner?', message: 'They will be visible to customers again.', label: 'Reactivate', tone: 'success', toast: 'reactivated' },
  suspend: { status: 'suspended', title: 'Suspend partner?', message: 'They will be hidden from customers and go offline until reactivated.', label: 'Suspend', tone: 'danger', toast: 'suspended' },
  reject: { status: 'rejected', title: 'Reject registration?', message: 'The partner will see this reason and can re-upload documents.', label: 'Reject', tone: 'danger', toast: 'rejected', requireReason: 'Reason shown to the partner' },
}

const missingDocs = (p) => DOCS.filter(([key]) => !p.documents?.[key])

export default function Partners() {
  const toast = useToast()
  const [{ status, search, page }, update] = useListParams({ status: 'all', search: '', page: 1 })
  const [viewId, setViewId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [action, setAction] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, error, loading, reload } = useAsync(
    () => api.partners.list({ status: status === 'all' ? undefined : status, search, page, limit: PAGE_SIZE }),
    [status, search, page],
  )

  const statusActions = (p) => {
    if (p.status === 'approved') return [['suspend', 'ban', 'warning', 'Suspend']]
    if (p.status === 'suspended') return [['reactivate', 'power', 'success', 'Reactivate']]
    if (p.status === 'pending') return [['approve', 'check', 'success', 'Approve'], ['reject', 'x', 'danger', 'Reject']]
    return [['approve', 'check', 'success', 'Approve']]
  }

  const actionConfig = action && ACTIONS[action.type]

  return (
    <>
      <PageHeader title="Partners" subtitle={data ? `${data.total} service professional${data.total === 1 ? '' : 's'}` : 'Service professionals'} />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs tabs={TABS} value={status} onChange={(s) => update({ status: s })} />
        <SearchBox value={search} onSearch={(q) => update({ search: q })} placeholder="Name or phone" />
      </div>

      <Card className="overflow-hidden">
        <LoadState loading={loading} error={error} onRetry={reload}>
          <Table
            rows={data?.items}
            onRowClick={(p) => setViewId(p._id)}
            empty={<EmptyState icon="partners" title="No partners found" message="Partners who register from the Anurgo Partner app appear here." />}
            columns={[
              {
                key: 'name',
                label: 'Partner',
                primary: true,
                render: (p) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.phone}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'service', label: 'Service', render: (p) => p.service?.name ?? '—' },
              { key: 'experience', label: 'Experience', render: (p) => `${p.experienceYears} yrs` },
              { key: 'price', label: 'Base price', render: (p) => formatMoney(p.basePrice) },
              {
                key: 'docs',
                label: 'Documents',
                render: (p) =>
                  missingDocs(p).length ? (
                    <span className="text-xs font-medium text-red-600">{missingDocs(p).length} missing</span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600">Complete</span>
                  ),
              },
              { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
              {
                key: 'actions',
                label: '',
                align: 'right',
                render: (p) => (
                  <RowActions>
                    <ActionButton icon="eye" label="View" tone="brand" onClick={() => setViewId(p._id)} />
                    <ActionButton icon="edit" label="Edit" onClick={() => setEditing(p)} />
                    {statusActions(p).map(([type, icon, tone, label]) => (
                      <ActionButton key={type} icon={icon} label={label} tone={tone} onClick={() => setAction({ type, partner: p })} />
                    ))}
                    <ActionButton icon="trash" label="Delete" tone="danger" onClick={() => setDeleting(p)} />
                  </RowActions>
                ),
              },
            ]}
          />
          {data && <Pagination page={page} total={data.total} limit={PAGE_SIZE} onChange={(p) => update({ page: p })} />}
        </LoadState>
      </Card>

      <PartnerView
        id={viewId}
        onClose={() => setViewId(null)}
        onEdit={(p) => setEditing(p)}
        onAction={(type, p) => setAction({ type, partner: p })}
        statusActions={statusActions}
      />

      <PartnerForm
        partner={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          toast('Partner updated')
          setEditing(null)
          reload()
        }}
      />

      <ConfirmDialog
        open={Boolean(action)}
        title={actionConfig?.title}
        message={
          action?.type === 'approve' && missingDocs(action.partner).length
            ? `Cannot approve yet — missing: ${missingDocs(action.partner).map(([, l]) => l).join(', ')}.`
            : actionConfig?.message
        }
        confirmLabel={actionConfig?.label}
        tone={actionConfig?.tone}
        requireReason={actionConfig?.requireReason}
        onClose={() => setAction(null)}
        onConfirm={async (reason) => {
          await api.partners.setStatus(action.partner._id, { status: actionConfig.status, reason: reason || undefined })
          toast(`${action.partner.name} ${actionConfig.toast}`)
          setViewId(null)
          reload()
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete partner?"
        message={`This permanently removes ${deleting?.name} and their documents. Partners with bookings can't be deleted — suspend them instead.`}
        confirmLabel="Delete"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await api.partners.remove(deleting._id)
          toast(`${deleting.name} deleted`)
          setViewId(null)
          reload()
        }}
      />
    </>
  )
}

function PartnerView({ id, onClose, onEdit, onAction, statusActions }) {
  const toast = useToast()
  const { data: p, error, loading } = useAsync(() => (id ? api.partners.get(id) : Promise.resolve(null)), [id])

  return (
    <Modal
      open={Boolean(id)}
      size="lg"
      title={p?.name ?? 'Partner'}
      subtitle={p && <div className="mt-1 flex items-center gap-2"><StatusBadge status={p.status} /><span>{p.service?.name}</span></div>}
      onClose={onClose}
      footer={
        p && (
          <>
            <Button variant="secondary" icon="edit" onClick={() => onEdit(p)}>Edit</Button>
            {statusActions(p).map(([type, icon, tone, label]) => (
              <Button key={type} variant={tone === 'warning' || tone === 'danger' ? 'danger' : 'success'} icon={icon} onClick={() => onAction(type, p)}>
                {label}
              </Button>
            ))}
          </>
        )
      }
    >
      <LoadState loading={loading} error={error} rows={4}>
        {p && (
          <div className="space-y-6">
            {p.rejectionReason && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="font-semibold">Rejected:</span> {p.rejectionReason}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <Metric label="Rating" value={p.stats?.ratingCount ? p.stats.rating.toFixed(1) : '—'} />
              <Metric label="Jobs done" value={p.stats?.jobsCount ?? 0} />
              <Metric label="On time" value={`${p.stats?.onTimePercent ?? 100}%`} />
            </div>

            <DetailList
              items={[
                { label: 'Phone', value: p.phone },
                { label: 'Email', value: p.email },
                { label: 'Experience', value: `${p.experienceYears} years` },
                { label: 'Pricing', value: `${formatMoney(p.basePrice)} base · ${formatMoney(p.visitCharge)} visit` },
                { label: 'Address', value: `${p.address}, ${p.pincode}`, wide: true },
                { label: 'Service areas', value: p.serviceAreas?.join(', '), wide: true },
                {
                  label: 'Availability',
                  value: `${p.availability?.workingDays?.join(', ')} · ${p.availability?.startTime} – ${p.availability?.endTime}`,
                  wide: true,
                },
                p.bio && { label: 'Bio', value: p.bio, wide: true },
                { label: 'Registered', value: formatDate(p.createdAt) },
              ]}
            />

            {p.tasks?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-400">Rate card</p>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {p.tasks.map((t) => (
                    <div key={t.name} className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-slate-700">{t.name}</span>
                      <span className="font-semibold text-slate-900">{formatMoney(t.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">KYC documents</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {DOCS.map(([key, label]) =>
                  p.documents?.[key] ? (
                    <button
                      key={key}
                      type="button"
                      onClick={() => openPartnerDocument(p._id, key).catch((err) => toast(err.message, 'error'))}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Icon name="file" className="h-4 w-4" /> {label}
                    </button>
                  ) : (
                    <div key={key} className="flex items-center gap-2 rounded-xl border border-dashed border-red-200 bg-red-50/50 px-3 py-2.5 text-sm text-red-600">
                      <Icon name="alert" className="h-4 w-4" /> {label}
                    </div>
                  ),
                )}
              </div>
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
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

const toForm = (p) => ({
  name: p.name ?? '',
  email: p.email ?? '',
  bio: p.bio ?? '',
  address: p.address ?? '',
  pincode: p.pincode ?? '',
  experienceYears: p.experienceYears ?? 0,
  basePrice: p.basePrice ?? 0,
  visitCharge: p.visitCharge ?? 0,
  serviceAreas: (p.serviceAreas ?? []).join(', '),
  tasks: (p.tasks ?? []).map((t) => ({ ...t })),
})

function PartnerForm({ partner, onClose, onSaved }) {
  const [form, setForm] = useState(null)
  const [source, setSource] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (partner !== source) {
    setSource(partner)
    setForm(partner ? toForm(partner) : null)
    setError(null)
  }
  if (!partner || !form) return null

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const setTask = (i, key, value) =>
    setForm({ ...form, tasks: form.tasks.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)) })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.partners.update(partner._id, {
        ...form,
        email: form.email || undefined,
        experienceYears: Number(form.experienceYears),
        basePrice: Number(form.basePrice),
        visitCharge: Number(form.visitCharge),
        serviceAreas: form.serviceAreas.split(',').map((s) => s.trim()).filter(Boolean),
        tasks: form.tasks.filter((t) => t.name.trim()).map((t) => ({ name: t.name.trim(), price: Number(t.price) })),
      })
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
      size="lg"
      title={`Edit ${partner.name}`}
      subtitle={`${partner.phone} · phone number can't be changed`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="partner-form" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
        </>
      }
    >
      <form id="partner-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input required className={inputClass} value={form.name} onChange={set('name')} /></Field>
          <Field label="Email"><input type="email" className={inputClass} value={form.email} onChange={set('email')} /></Field>
          <Field label="Address"><input required className={inputClass} value={form.address} onChange={set('address')} /></Field>
          <Field label="Pincode"><input required pattern="\d{6}" className={inputClass} value={form.pincode} onChange={set('pincode')} /></Field>
          <Field label="Experience (years)"><input required type="number" min="0" className={inputClass} value={form.experienceYears} onChange={set('experienceYears')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Base price ₹"><input required type="number" min="0" className={inputClass} value={form.basePrice} onChange={set('basePrice')} /></Field>
            <Field label="Visit charge ₹"><input required type="number" min="0" className={inputClass} value={form.visitCharge} onChange={set('visitCharge')} /></Field>
          </div>
        </div>
        <Field label="Service areas" hint="Comma separated, e.g. Civil Lines, Katra">
          <input className={inputClass} value={form.serviceAreas} onChange={set('serviceAreas')} />
        </Field>
        <Field label="Bio"><textarea rows={3} maxLength={500} className={inputClass} value={form.bio} onChange={set('bio')} /></Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Rate card</span>
            <Button type="button" variant="ghost" icon="plus" onClick={() => setForm({ ...form, tasks: [...form.tasks, { name: '', price: '' }] })}>
              Add task
            </Button>
          </div>
          <div className="space-y-2">
            {form.tasks.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputClass} placeholder="Task name" value={t.name} onChange={(e) => setTask(i, 'name', e.target.value)} />
                <input type="number" min="0" className={`${inputClass} w-28`} placeholder="₹" value={t.price} onChange={(e) => setTask(i, 'price', e.target.value)} />
                <ActionButton icon="trash" label="Remove task" tone="danger" onClick={() => setForm({ ...form, tasks: form.tasks.filter((_, idx) => idx !== i) })} />
              </div>
            ))}
            {!form.tasks.length && <p className="text-sm text-slate-400">No tasks — customers will book the base price.</p>}
          </div>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}
