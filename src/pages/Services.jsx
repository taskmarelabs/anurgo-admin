import { useState } from 'react'
import { api } from '../lib/api.js'
import { formatDate, formatMoney } from '../lib/format.js'
import { useAsync } from '../hooks/useAsync.js'
import { useListParams } from '../hooks/useListParams.js'
import { useToast } from '../components/Toast.jsx'
import {
  ActionButton, Button, Card, ConfirmDialog, DetailList, EmptyState, Field, FormError, LoadState,
  Modal, PageHeader, RowActions, SearchBox, StatusBadge, Table, Tabs, inputClass,
} from '../components/ui.jsx'

const EMPTY_FORM = { name: '', slug: '', category: '', startingPrice: '', icon: 'handyman', color: '#1E63E9', sortOrder: 0 }
const STATUS_TABS = ['all', 'active', 'inactive']

const toSlug = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function Services() {
  const toast = useToast()
  const [{ status, category, search }, update] = useListParams({ status: 'all', category: '', search: '' })
  const services = useAsync(() => api.services.list())
  const categories = useAsync(() => api.categories.list())
  const [viewing, setViewing] = useState(null)
  const [editing, setEditing] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const rows = (services.data ?? []).filter(
    (s) =>
      (status === 'all' || (status === 'active' ? s.isActive : !s.isActive)) &&
      (!category || s.category?._id === category) &&
      (!search || s.name.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <>
      <PageHeader
        title="Services"
        subtitle={services.data ? `${services.data.length} services · ${services.data.filter((s) => s.isActive).length} active` : 'Services customers can book'}
        action={<Button icon="plus" onClick={() => setEditing(EMPTY_FORM)}>Add service</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Tabs tabs={STATUS_TABS} value={status} onChange={(s) => update({ status: s })} />
          <select className={`${inputClass} sm:w-52`} value={category} onChange={(e) => update({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.data?.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <SearchBox value={search} onSearch={(q) => update({ search: q })} placeholder="Search services" />
      </div>

      <Card className="overflow-hidden">
        <LoadState loading={services.loading} error={services.error} onRetry={services.reload}>
          <Table
            rows={rows}
            onRowClick={setViewing}
            empty={
              <EmptyState
                icon="services"
                title="No services found"
                message="Add the services customers can book."
                action={<Button icon="plus" onClick={() => setEditing(EMPTY_FORM)}>Add service</Button>}
              />
            }
            columns={[
              {
                key: 'name',
                label: 'Service',
                primary: true,
                render: (s) => (
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: s.color }}>
                      {s.name[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.slug}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'category', label: 'Category', render: (s) => s.category?.name ?? '—' },
              { key: 'startingPrice', label: 'Starts at', render: (s) => formatMoney(s.startingPrice) },
              { key: 'providerCount', label: 'Partners' },
              { key: 'bookingsCount', label: 'Bookings' },
              { key: 'status', label: 'Status', render: (s) => <StatusBadge status={s.isActive ? 'active' : 'inactive'} /> },
              {
                key: 'actions',
                label: '',
                align: 'right',
                render: (s) => (
                  <RowActions>
                    <ActionButton icon="eye" label="View" tone="brand" onClick={() => setViewing(s)} />
                    <ActionButton icon="edit" label="Edit" onClick={() => setEditing(toForm(s))} />
                    <ActionButton icon="power" label={s.isActive ? 'Mark inactive' : 'Mark active'} tone={s.isActive ? 'warning' : 'success'} onClick={() => setToggling(s)} />
                    <ActionButton icon="trash" label="Delete" tone="danger" onClick={() => setDeleting(s)} />
                  </RowActions>
                ),
              },
            ]}
          />
        </LoadState>
      </Card>

      <Modal
        open={Boolean(viewing)}
        title={viewing?.name}
        subtitle={viewing && <div className="mt-1"><StatusBadge status={viewing.isActive ? 'active' : 'inactive'} /></div>}
        onClose={() => setViewing(null)}
        footer={
          viewing && (
            <Button
              icon="edit"
              onClick={() => {
                setEditing(toForm(viewing))
                setViewing(null)
              }}
            >
              Edit
            </Button>
          )
        }
      >
        {viewing && (
          <DetailList
            items={[
              { label: 'Category', value: viewing.category?.name },
              { label: 'Slug', value: viewing.slug },
              { label: 'Starting price', value: formatMoney(viewing.startingPrice) },
              { label: 'Approved partners', value: viewing.providerCount },
              { label: 'Completed bookings', value: viewing.bookingsCount },
              { label: 'Rating', value: viewing.rating ? viewing.rating.toFixed(1) : 'No ratings yet' },
              { label: 'App icon key', value: viewing.icon },
              {
                label: 'Colour',
                value: (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded" style={{ backgroundColor: viewing.color }} /> {viewing.color}
                  </span>
                ),
              },
              { label: 'Created', value: formatDate(viewing.createdAt) },
            ]}
          />
        )}
      </Modal>

      <ServiceForm
        initial={editing}
        categories={categories.data ?? []}
        onClose={() => setEditing(null)}
        onSaved={(isEdit) => {
          toast(isEdit ? 'Service updated' : 'Service created')
          setEditing(null)
          services.reload()
        }}
      />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.isActive ? 'Mark service inactive?' : 'Mark service active?'}
        message={
          toggling?.isActive
            ? `${toggling?.name} will be hidden from the customer app. Existing bookings are not affected.`
            : `${toggling?.name} will be visible in the customer app again.`
        }
        confirmLabel={toggling?.isActive ? 'Mark inactive' : 'Mark active'}
        tone={toggling?.isActive ? 'danger' : 'success'}
        onClose={() => setToggling(null)}
        onConfirm={async () => {
          await api.services.update(toggling._id, { isActive: !toggling.isActive })
          toast(`${toggling.name} is now ${toggling.isActive ? 'inactive' : 'active'}`)
          services.reload()
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete service?"
        message={`This permanently removes ${deleting?.name}. Services used by partners or bookings can't be deleted — mark them inactive instead.`}
        confirmLabel="Delete"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await api.services.remove(deleting._id)
          toast(`${deleting.name} deleted`)
          services.reload()
        }}
      />
    </>
  )
}

const toForm = (s) => ({
  _id: s._id,
  name: s.name,
  slug: s.slug,
  category: s.category?._id ?? '',
  startingPrice: s.startingPrice,
  icon: s.icon,
  color: s.color,
  sortOrder: s.sortOrder ?? 0,
})

function ServiceForm({ initial, categories, onClose, onSaved }) {
  const [form, setForm] = useState(null)
  const [source, setSource] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (initial !== source) {
    setSource(initial)
    setForm(initial)
    setError(null)
  }
  if (!form) return null

  const isEdit = Boolean(form._id)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { _id, ...body } = form
    body.startingPrice = Number(body.startingPrice)
    body.sortOrder = Number(body.sortOrder)
    try {
      if (isEdit) await api.services.update(_id, body)
      else await api.services.create(body)
      onSaved(isEdit)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title={isEdit ? 'Edit service' : 'Add service'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="service-form" disabled={busy}>{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create service'}</Button>
        </>
      }
    >
      <form id="service-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              required
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, ...(!isEdit && { slug: toSlug(e.target.value) }) })}
            />
          </Field>
          <Field label="Slug" hint="Used in URLs and the app">
            <input required className={inputClass} value={form.slug} onChange={set('slug')} />
          </Field>
        </div>
        <Field label="Category">
          <select required className={inputClass} value={form.category} onChange={set('category')}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}{c.isActive ? '' : ' (inactive)'}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Starts at ₹">
            <input required type="number" min="0" className={inputClass} value={form.startingPrice} onChange={set('startingPrice')} />
          </Field>
          <Field label="Sort order">
            <input type="number" className={inputClass} value={form.sortOrder} onChange={set('sortOrder')} />
          </Field>
          <Field label="Icon key">
            <input className={inputClass} value={form.icon} onChange={set('icon')} />
          </Field>
          <Field label="Colour">
            <input type="color" className={`${inputClass} h-[42px] cursor-pointer p-1`} value={form.color} onChange={set('color')} />
          </Field>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}
