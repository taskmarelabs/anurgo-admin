import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { formatDateTime, formatMoney } from '../lib/format.js'
import { useAsync } from '../hooks/useAsync.js'
import Icon from '../components/Icon.jsx'
import { Button, Card, EmptyState, LoadState, PageHeader, StatusBadge, Table } from '../components/ui.jsx'

async function loadDashboard() {
  const [stats, recent] = await Promise.all([api.admin.stats(), api.bookings.list({ limit: 6 })])
  return { stats, recent: recent.items }
}

const TONES = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  sky: 'bg-sky-50 text-sky-600',
  rose: 'bg-rose-50 text-rose-600',
}

export default function Dashboard() {
  const { data, error, loading, reload } = useAsync(loadDashboard)
  const s = data?.stats
  const activeBookings = s ? s.bookings.assigned + s.bookings.on_the_way + s.bookings.in_progress : 0
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <PageHeader
        title={`${greeting}, Admin`}
        subtitle="Here's what's happening on Anurgo today."
        action={<Button variant="secondary" icon="refresh" onClick={reload}>Refresh</Button>}
      />

      <LoadState loading={loading} error={error} onRetry={reload} rows={6}>
        {s && (
          <div className="space-y-8">
            {s.partners.pending > 0 && (
              <Link
                to="/partners?status=pending"
                className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 transition hover:shadow-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-white">
                  <Icon name="alert" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-amber-900">
                    {s.partners.pending} partner registration{s.partners.pending === 1 ? '' : 's'} waiting for review
                  </p>
                  <p className="text-sm text-amber-800/80">Verify documents and approve to let them receive jobs.</p>
                </div>
                <Icon name="chevronRight" className="h-5 w-5 text-amber-700" />
              </Link>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat icon="rupee" tone="brand" label="Total booking value" value={formatMoney(s.revenue.gross)} hint={`${formatMoney(s.revenue.todayGross)} today`} />
              <Stat icon="trending" tone="emerald" label="Platform commission" value={formatMoney(s.revenue.commission)} hint="From completed jobs" />
              <Stat icon="bookings" tone="violet" label="Bookings today" value={s.bookings.today} hint={`${activeBookings} in progress`} to="/bookings" />
              <Stat icon="payouts" tone="amber" label="Pending payouts" value={formatMoney(s.pendingPayout)} hint="Net owed to partners" to="/payouts" />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="p-5 lg:col-span-2">
                <h2 className="text-sm font-semibold text-slate-900">Booking pipeline</h2>
                <p className="text-xs text-slate-500">All-time bookings by status</p>
                <Pipeline bookings={s.bookings} />
              </Card>
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-slate-900">People</h2>
                <p className="text-xs text-slate-500">Customers and service partners</p>
                <div className="mt-4 space-y-1">
                  <PeopleRow to="/users" icon="customers" label="Customers" value={s.users} />
                  <PeopleRow to="/partners?status=approved" icon="partners" label="Active partners" value={s.partners.approved} />
                  <PeopleRow to="/partners?status=pending" icon="clock" label="Awaiting approval" value={s.partners.pending} />
                  <PeopleRow to="/partners?status=suspended" icon="ban" label="Suspended / rejected" value={s.partners.suspended + s.partners.rejected} />
                </div>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Recent bookings</h2>
                  <p className="text-xs text-slate-500">Latest activity across the platform</p>
                </div>
                <Link to="/bookings" className="text-sm font-semibold text-brand-600 hover:text-brand-700">View all</Link>
              </div>
              <Table
                rows={data.recent}
                empty={<EmptyState icon="bookings" title="No bookings yet" message="Bookings from the customer app will show up here." />}
                columns={[
                  {
                    key: 'code',
                    label: 'Booking',
                    primary: true,
                    render: (b) => (
                      <div>
                        <p className="font-semibold text-slate-900">{b.code}</p>
                        <p className="text-xs text-slate-500">{b.service?.name}</p>
                      </div>
                    ),
                  },
                  { key: 'customer', label: 'Customer', render: (b) => b.customer?.name },
                  { key: 'partner', label: 'Partner', render: (b) => b.partner?.name ?? '—' },
                  { key: 'scheduledAt', label: 'Scheduled', render: (b) => formatDateTime(b.scheduledAt) },
                  { key: 'total', label: 'Amount', align: 'right', render: (b) => <span className="font-medium">{formatMoney(b.pricing?.total)}</span> },
                  { key: 'status', label: 'Status', render: (b) => <StatusBadge status={b.status} /> },
                ]}
              />
            </Card>
          </div>
        )}
      </LoadState>
    </>
  )
}

function Stat({ icon, tone, label, value, hint, to }) {
  const body = (
    <Card className={`h-full p-5 ${to ? 'transition hover:-translate-y-0.5 hover:shadow-md' : ''}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${TONES[tone]}`}>
          <Icon name={icon} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

const PIPELINE = [
  ['scheduled', 'Awaiting partner', 'bg-sky-500'],
  ['assigned', 'Accepted', 'bg-indigo-500'],
  ['on_the_way', 'On the way', 'bg-violet-500'],
  ['in_progress', 'In progress', 'bg-amber-500'],
  ['completed', 'Completed', 'bg-emerald-500'],
  ['cancelled', 'Cancelled', 'bg-red-400'],
]

function Pipeline({ bookings }) {
  const total = PIPELINE.reduce((sum, [key]) => sum + (bookings[key] ?? 0), 0)
  return (
    <div className="mt-5">
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {total > 0 &&
          PIPELINE.map(([key, , color]) =>
            bookings[key] ? <div key={key} className={color} style={{ width: `${(bookings[key] / total) * 100}%` }} /> : null,
          )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PIPELINE.map(([key, label, color]) => (
          <Link key={key} to={`/bookings?status=${key}`} className="rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className={`h-2 w-2 rounded-full ${color}`} />
              {label}
            </div>
            <p className="mt-1 text-xl font-bold text-slate-900">{bookings[key] ?? 0}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function PeopleRow({ to, icon, label, value }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="flex-1 text-sm text-slate-600">{label}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </Link>
  )
}
