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

const STATUSES = ['all', 'requested', 'accepted', 'arrived', 'started', 'completed', 'cancelled', 'expired']
const CANCELLABLE = ['requested', 'accepted', 'arrived', 'started']
const PAGE_SIZE = 20

const mapsLink = (stop) => {
  const [lng, lat] = stop?.location?.coordinates ?? []
  return lat === undefined ? null : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

export default function Rides() {
  const toast = useToast()
  const [{ status, search, page }, update] = useListParams({ status: 'all', search: '', page: 1 })
  const [viewId, setViewId] = useState(null)
  const [cancelling, setCancelling] = useState(null)

  const { data, error, loading, reload } = useAsync(
    () => api.rides.list({ status: status === 'all' ? undefined : status, search, page, limit: PAGE_SIZE }),
    [status, search, page],
  )

  return (
    <>
      <PageHeader title="Rides" subtitle={data ? `${data.total} ride${data.total === 1 ? '' : 's'}` : 'Bike, auto and cab rides'} />

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Tabs tabs={STATUSES} value={status} onChange={(s) => update({ status: s })} />
        <SearchBox value={search} onSearch={(q) => update({ search: q })} placeholder="Ride code, phone or customer" />
      </div>

      <Card className="overflow-hidden">
        <LoadState loading={loading} error={error} onRetry={reload}>
          <Table
            rows={data?.items}
            onRowClick={(r) => setViewId(r._id)}
            empty={<EmptyState icon="ride" title="No rides found" message={search ? 'Try a different search.' : 'Rides booked by customers appear here.'} />}
            columns={[
              {
                key: 'code',
                label: 'Ride',
                primary: true,
                render: (r) => (
                  <div>
                    <p className="font-semibold text-slate-900">{r.code}</p>
                    <p className="text-xs uppercase text-slate-500">{r.vehicleType} · {r.distanceKm} km</p>
                  </div>
                ),
              },
              {
                key: 'route',
                label: 'Route',
                render: (r) => (
                  <div className="max-w-xs">
                    <p className="truncate text-slate-900">{r.pickup?.address}</p>
                    <p className="truncate text-xs text-slate-500">→ {r.drop?.address}</p>
                  </div>
                ),
              },
              { key: 'customer', label: 'Customer', render: (r) => <Person name={r.customer?.name} phone={r.customer?.phone} /> },
              { key: 'driver', label: 'Driver', render: (r) => <Person name={r.driver?.name} phone={r.driver?.phone} /> },
              { key: 'createdAt', label: 'Requested', render: (r) => formatDateTime(r.createdAt) },
              { key: 'fare', label: 'Fare', align: 'right', render: (r) => <span className="font-semibold text-slate-900">{formatMoney(r.fare?.total)}</span> },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              {
                key: 'actions',
                label: '',
                align: 'right',
                render: (r) => (
                  <RowActions>
                    <ActionButton icon="eye" label="View" tone="brand" onClick={() => setViewId(r._id)} />
                    <ActionButton icon="ban" label="Cancel ride" tone="danger" disabled={!CANCELLABLE.includes(r.status)} onClick={() => setCancelling(r)} />
                  </RowActions>
                ),
              },
            ]}
          />
          {data && <Pagination page={page} total={data.total} limit={PAGE_SIZE} onChange={(p) => update({ page: p })} />}
        </LoadState>
      </Card>

      <RideView id={viewId} onClose={() => setViewId(null)} onCancel={(r) => setCancelling(r)} />

      <ConfirmDialog
        open={Boolean(cancelling)}
        title={`Cancel ${cancelling?.code ?? 'ride'}?`}
        message="The customer and driver will be notified that Anurgo cancelled this ride."
        confirmLabel="Cancel ride"
        requireReason="Reason for cancellation"
        onClose={() => setCancelling(null)}
        onConfirm={async (reason) => {
          await api.rides.cancel(cancelling._id, reason)
          toast(`Ride ${cancelling.code} cancelled`)
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

function StopLink({ stop }) {
  const href = mapsLink(stop)
  if (!href) return stop?.address ?? '—'
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
      <Icon name="mapPin" className="h-4 w-4" /> {stop.address}
    </a>
  )
}

function RideView({ id, onClose, onCancel }) {
  const { data: r, error, loading } = useAsync(() => (id ? api.rides.get(id) : Promise.resolve(null)), [id])

  return (
    <Modal
      open={Boolean(id)}
      size="lg"
      title={r ? `Ride ${r.code}` : 'Ride'}
      subtitle={r && <div className="mt-1 flex flex-wrap gap-2"><StatusBadge status={r.status} /><StatusBadge status={r.payment?.status} /></div>}
      onClose={onClose}
      footer={
        r && CANCELLABLE.includes(r.status) ? (
          <button onClick={() => onCancel(r)} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <Icon name="ban" className="h-4 w-4" /> Cancel ride
          </button>
        ) : null
      }
    >
      <LoadState loading={loading} error={error} rows={4}>
        {r && (
          <div className="space-y-6 text-sm">
            <DetailList
              items={[
                { label: 'Pickup', value: <StopLink stop={r.pickup} />, wide: true },
                { label: 'Drop', value: <StopLink stop={r.drop} />, wide: true },
                { label: 'Customer', value: `${r.customer?.name} · ${r.customer?.phone}` },
                {
                  label: 'Driver',
                  value: r.driver ? `${r.driver.name} · ${r.driver.phone} · ${r.driver.vehicle?.number ?? ''}` : 'Not assigned',
                },
                { label: 'Vehicle', value: r.vehicleType?.toUpperCase() },
                { label: 'Trip', value: `${r.distanceKm} km · ~${r.durationMin} min` },
                { label: 'Payment method', value: r.payment?.method?.toUpperCase() },
                r.driverLocation?.coordinates && {
                  label: 'Driver last location',
                  value: <StopLink stop={{ address: 'Open in maps', location: r.driverLocation }} />,
                },
                r.rejectedBy?.length > 0 && { label: 'Skipped by', value: r.rejectedBy.map((p) => p.name).join(', '), wide: true },
                r.cancellation?.by && {
                  label: 'Cancelled by',
                  value: `${r.cancellation.by}${r.cancellation.reason ? ` — ${r.cancellation.reason}` : ''}`,
                  wide: true,
                },
              ]}
            />

            <div className="rounded-xl bg-slate-50 p-4">
              <Line label="Base fare" value={formatMoney(r.fare?.base)} />
              <Line label="Distance fare" value={formatMoney(r.fare?.distance)} />
              <div className="my-2 border-t border-slate-200" />
              <Line label="Total" value={formatMoney(r.fare?.total)} bold />
            </div>

            <div>
              <p className="mb-3 text-xs font-medium text-slate-400">Timeline</p>
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {r.statusHistory?.map((h, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                    <p className="font-medium capitalize text-slate-800">{humanize(h.status)}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(h.at)}</p>
                  </li>
                ))}
              </ol>
            </div>
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
