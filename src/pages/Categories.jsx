import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { formatDate } from '../lib/format.js'
import { useAsync } from '../hooks/useAsync.js'
import { useToast } from '../components/Toast.jsx'
import {
  ActionButton, Button, Card, ConfirmDialog, DetailList, EmptyState, Field, FormError, LoadState,
  Modal, PageHeader, RowActions, StatusBadge, Table, inputClass,
} from '../components/ui.jsx'

const toSlug = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function Categories() {
  const toast = useToast()
  const { data, error, loading, reload } = useAsync(() => api.categories.list())
  const [viewing, setViewing] = useState(null)
  const [editing, setEditing] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const newForm = () => ({ name: '', slug: '', sortOrder: (data?.length ?? 0) + 1 })

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Groups shown on the customer app's services screen"
        action={<Button icon="plus" onClick={() => setEditing(newForm())}>Add category</Button>}
      />

      <Card className="overflow-hidden">
        <LoadState loading={loading} error={error} onRetry={reload}>
          <Table
            rows={data}
            onRowClick={setViewing}
            empty={
              <EmptyState
                icon="categories"
                title="No categories yet"
                message="Create categories to group your services."
                action={<Button icon="plus" onClick={() => setEditing(newForm())}>Add category</Button>}
              />
            }
            columns={[
              {
                key: 'name',
                label: 'Category',
                primary: true,
                render: (c) => (
                  <div>
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.slug}</p>
                  </div>
                ),
              },
              {
                key: 'serviceCount',
                label: 'Services',
                render: (c) => (
                  <Link
                    to={`/services?category=${c._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    {c.serviceCount}
                  </Link>
                ),
              },
              { key: 'sortOrder', label: 'Order' },
              { key: 'status', label: 'Status', render: (c) => <StatusBadge status={c.isActive ? 'active' : 'inactive'} /> },
              {
                key: 'actions',
                label: '',
                align: 'right',
                render: (c) => (
                  <RowActions>
                    <ActionButton icon="eye" label="View" tone="brand" onClick={() => setViewing(c)} />
                    <ActionButton icon="edit" label="Edit" onClick={() => setEditing({ _id: c._id, name: c.name, slug: c.slug, sortOrder: c.sortOrder })} />
                    <ActionButton icon="power" label={c.isActive ? 'Mark inactive' : 'Mark active'} tone={c.isActive ? 'warning' : 'success'} onClick={() => setToggling(c)} />
                    <ActionButton icon="trash" label="Delete" tone="danger" onClick={() => setDeleting(c)} />
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
            <>
              <Link to={`/services?category=${viewing._id}`}>
                <Button variant="secondary" icon="services">View services</Button>
              </Link>
              <Button
                icon="edit"
                onClick={() => {
                  setEditing({ _id: viewing._id, name: viewing.name, slug: viewing.slug, sortOrder: viewing.sortOrder })
                  setViewing(null)
                }}
              >
                Edit
              </Button>
            </>
          )
        }
      >
        {viewing && (
          <DetailList
            items={[
              { label: 'Slug', value: viewing.slug },
              { label: 'Services', value: viewing.serviceCount },
              { label: 'Display order', value: viewing.sortOrder },
              { label: 'Created', value: formatDate(viewing.createdAt) },
            ]}
          />
        )}
      </Modal>

      <CategoryForm
        initial={editing}
        onClose={() => setEditing(null)}
        onSaved={(isEdit) => {
          toast(isEdit ? 'Category updated' : 'Category created')
          setEditing(null)
          reload()
        }}
      />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.isActive ? 'Mark category inactive?' : 'Mark category active?'}
        message={
          toggling?.isActive
            ? `${toggling?.name} will be hidden from the customer app.`
            : `${toggling?.name} will be visible in the customer app again.`
        }
        confirmLabel={toggling?.isActive ? 'Mark inactive' : 'Mark active'}
        tone={toggling?.isActive ? 'danger' : 'success'}
        onClose={() => setToggling(null)}
        onConfirm={async () => {
          await api.categories.update(toggling._id, { isActive: !toggling.isActive })
          toast(`${toggling.name} is now ${toggling.isActive ? 'inactive' : 'active'}`)
          reload()
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete category?"
        message={`This permanently removes ${deleting?.name}. Categories that still have services can't be deleted.`}
        confirmLabel="Delete"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await api.categories.remove(deleting._id)
          toast(`${deleting.name} deleted`)
          reload()
        }}
      />
    </>
  )
}

function CategoryForm({ initial, onClose, onSaved }) {
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

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { _id, ...body } = form
    body.sortOrder = Number(body.sortOrder)
    try {
      if (isEdit) await api.categories.update(_id, body)
      else await api.categories.create(body)
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
      size="sm"
      title={isEdit ? 'Edit category' : 'Add category'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="category-form" disabled={busy}>{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}</Button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} className="space-y-4">
        <Field label="Name">
          <input
            required
            autoFocus
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, ...(!isEdit && { slug: toSlug(e.target.value) }) })}
          />
        </Field>
        <Field label="Slug">
          <input required className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </Field>
        <Field label="Display order">
          <input type="number" className={inputClass} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
        </Field>
        <FormError error={error} />
      </form>
    </Modal>
  )
}
