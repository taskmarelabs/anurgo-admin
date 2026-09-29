import { useState } from 'react'
import { api } from '../lib/api.js'
import { formatDateTime, formatMoney, humanize } from '../lib/format.js'
import { useAsync } from '../hooks/useAsync.js'
import { useListParams } from '../hooks/useListParams.js'
import { useToast } from '../components/Toast.jsx'
import Icon from '../components/Icon.jsx'
import {
  ActionButton, Card, ConfirmDialog, DetailList, EmptyState, LoadState, Modal, PageHeader,
  Pagination, RowActions, SearchBox, StatusBadge, Table, Tabs,
} from '../components/ui.jsx'

const STATUSES = ['all', 'scheduled', 'assigned', 'on_the_way', 'in_progress', 'completed', 'cancelled']
const CANCELLABLE = ['scheduled', 'assigned', 'on_the_way', 'in_progress']
const PAGE_SIZE = 20

export default function Bookings() {
  const toast = useToast()
  const [{ status, search, page }, update] = useListParams({ status: 'all', search: '', page: 1 })
  const [viewId, setViewId] = useState(null)
  const [cancelling, setCancelling] = useState(null)

  const { data, error, loading, reload } = useAsync(
    () => api.bookings.list({ status: status === 'all' ? undefined : status, search, page, limit: PAGE_SIZE }),
    [status, search, page],
  )

  return (
    <>
      <PageHeader title="Bookings" subtitle={data ? `${data.total} booking${data.total === 1 ? '' : 's'}` : 'All customer bookings'} />

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Tabs tabs={STATUSES} value={status} onChange={(s) => update({ status: s })} />
        <SearchBox value={search} onSearch={(q) => update({ search: q })} placeholder="Code, phone or customer name" />
      </div>

      <Card className="overflow-hidden">
        <LoadState loading={loading} error={error} onRetry={reload}>
          <Table
            rows={data?.items}
            onRowClick={(b) => setViewId(b._id)}
            empty={<EmptyState icon="bookings" title="No bookings found" message={search ? 'Try a different search.' : 'Bookings will appear here as customers book services.'} />}
            columns={[
              {
                key: 'code',
                label: 'Booking',
                primary: true,
                render: (b) => (
                  <div>
                    <p className="font-semibold text-slate-900">{b.code}</p>
                    <p className="text-xs text-slate-500">{b.service?.name} · {b.task?.name}</p>
                  </div>
                ),
              },
              { key: 'customer', label: 'Customer', render: (b) => <Person name={b.customer?.name} phone={b.customer?.phone} /> },
              { key: 'partner', label: 'Partner', render: (b) => <Person name={b.partner?.name} phone={b.partner?.phone} /> },
              { key: 'scheduledAt', label: 'Scheduled', render: (b) => formatDateTime(b.scheduledAt) },
              { key: 'total', label: 'Amount', align: 'right', render: (b) => <span className="font-semibold text-slate-900">{formatMoney(b.pricing?.total)}</span> },
              { key: 'status', label: 'Status', render: (b) => <StatusBadge status={b.status} /> },
              {
                key: 'actions',
                label: '',
                align: 'right',
                render: (b) => (
                  <RowActions>
                    <ActionButton icon="eye" label="View" tone="brand" onClick={() => setViewId(b._id)} />
                    <ActionButton icon="ban" label="Cancel booking" tone="danger" disabled={!CANCELLABLE.includes(b.status)} onClick={() => setCancelling(b)} />
                  </RowActions>
                ),
              },
            ]}
          />
          {data && <Pagination page={page} total={data.total} limit={PAGE_SIZE} onChange={(p) => update({ page: p })} />}
        </LoadState>
      </Card>

      <BookingView id={viewId} onClose={() => setViewId(null)} onCancel={(b) => setCancelling(b)} />

      <ConfirmDialog
        open={Boolean(cancelling)}
        title={`Cancel ${cancelling?.code ?? 'booking'}?`}
        message="The customer and partner will see this booking as cancelled by Anurgo. Paid online bookings are marked for refund."
        confirmLabel="Cancel booking"
        requireReason="Reason for cancellation"
        onClose={() => setCancelling(null)}
        onConfirm={async (reason) => {
          await api.bookings.cancel(cancelling._id, reason)
          toast(`Booking ${cancelling.code} cancelled`)
          setViewId(null)
          reload()
        }}
      />
    </>
  )
}

function Person({ name, phone }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-slate-900">{name ?? '—'}</p>
      {phone && <p className="text-xs text-slate-500">{phone}</p>}
    </div>
  )
}

function BookingView({ id, onClose, onCancel }) {
  const { data: b, error, loading } = useAsync(() => (id ? api.bookings.get(id) : Promise.resolve(null)), [id])

  return (
    <Modal
      open={Boolean(id)}
      size="lg"
      title={b ? `Booking ${b.code}` : 'Booking'}
      subtitle={b && <div className="mt-1 flex flex-wrap gap-2"><StatusBadge status={b.status} /><StatusBadge status={b.payment?.status} /></div>}
      onClose={onClose}
      footer={
        b && CANCELLABLE.includes(b.status) ? (
          <button onClick={() => onCancel(b)} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <Icon name="ban" className="h-4 w-4" /> Cancel booking
          </button>
        ) : null
      }
    >
      <LoadState loading={loading} error={error} rows={4}>
        {b && (
          <div className="space-y-6 text-sm">
            <DetailList
              items={[
                { label: 'Service', value: `${b.service?.name} · ${b.task?.name}`, wide: true },
                { label: 'Customer', value: `${b.customer?.name} · ${b.customer?.phone}` },
                { label: 'Partner', value: `${b.partner?.name ?? '—'} · ${b.partner?.phone ?? ''}` },
                { label: 'Scheduled for', value: formatDateTime(b.scheduledAt) },
                { label: 'Payment method', value: b.payment?.method?.toUpperCase() },
                { label: 'Address', value: [b.address?.label, b.address?.line, b.address?.landmark, b.address?.pincode].filter(Boolean).join(' · '), wide: true },
                b.instructions && { label: 'Instructions', value: b.instructions, wide: true },
                b.cancellation?.by && {
                  label: 'Cancelled by',
                  value: `${b.cancellation.by}${b.cancellation.reason ? ` — ${b.cancellation.reason}` : ''}`,
                  wide: true,
                },
              ]}
            />

            <div className="rounded-xl bg-slate-50 p-4">
              <Line label="Service price" value={formatMoney(b.pricing?.servicePrice)} />
              <Line label="Visit charge" value={formatMoney(b.pricing?.visitCharge)} />
              {b.pricing?.discount > 0 && <Line label="Discount" value={`− ${formatMoney(b.pricing.discount)}`} />}
              <div className="my-2 border-t border-slate-200" />
              <Line label="Total" value={formatMoney(b.pricing?.total)} bold />
            </div>

            <div>
              <p className="mb-3 text-xs font-medium text-slate-400">Timeline</p>
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {b.statusHistory?.map((h, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                    <p className="font-medium capitalize text-slate-800">{humanize(h.status)}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(h.at)}</p>
                  </li>
                ))}
              </ol>
            </div>

            {b.review?.rating && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                <div className="flex gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon key={i} name="star" className={`h-4 w-4 ${i < b.review.rating ? 'fill-current' : 'text-amber-200'}`} />
                  ))}
                </div>
                {b.review.comment && <p className="mt-2 text-slate-700">{b.review.comment}</p>}
              </div>
            )}
          </div>
        )}
      </LoadState>
    </Modal>
  )
}

function Line({ label, value, bold }) {
  return (
    <div className={`flex justify-between py-1 ${bold ? 'text-base font-bold text-slate-900' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
