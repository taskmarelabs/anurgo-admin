import { useState } from 'react'
import { api } from '../lib/api.js'
import { formatDate, formatMoney } from '../lib/format.js'
import { useAsync } from '../hooks/useAsync.js'
import { useToast } from '../components/Toast.jsx'
import Icon from '../components/Icon.jsx'
import { Avatar, Button, Card, EmptyState, Field, FormError, LoadState, Modal, PageHeader, Table, inputClass } from '../components/ui.jsx'

export default function Payouts() {
  const toast = useToast()
  const { data, error, loading, reload } = useAsync(() => api.admin.payouts())
  const [settling, setSettling] = useState(null)

  const owedToPartners = data?.filter((r) => r.amount > 0).reduce((sum, r) => sum + r.amount, 0) ?? 0
  const owedByPartners = data?.filter((r) => r.amount < 0).reduce((sum, r) => sum - r.amount, 0) ?? 0

  return (
    <>
      <PageHeader title="Payouts" subtitle="Unsettled partner earnings" action={<Button variant="secondary" icon="refresh" onClick={reload}>Refresh</Button>} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Summary icon="payouts" tone="bg-emerald-50 text-emerald-600" label="To pay partners" hint="Online payments collected by Anurgo" value={formatMoney(owedToPartners)} />
        <Summary icon="rupee" tone="bg-amber-50 text-amber-600" label="To collect from partners" hint="Commission on cash jobs" value={formatMoney(owedByPartners)} />
      </div>

      <Card className="overflow-hidden">
        <LoadState loading={loading} error={error} onRetry={reload}>
          <Table
            rows={data?.map((r, i) => ({ ...r, _id: r.partner?._id ?? `deleted-${i}` }))}
            empty={<EmptyState icon="check" title="All settled" message="There are no pending partner earnings right now." />}
            columns={[
              {
                key: 'partner',
                label: 'Partner',
                primary: true,
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={r.partner?.name} />
                    <div>
                      <p className="font-semibold text-slate-900">{r.partner?.name ?? 'Deleted partner'}</p>
                      <p className="text-xs text-slate-500">{r.partner?.phone}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'jobs', label: 'Jobs' },
              { key: 'gross', label: 'Booking value', align: 'right', render: (r) => formatMoney(r.gross) },
              { key: 'commission', label: 'Commission', align: 'right', render: (r) => formatMoney(r.commission) },
              {
                key: 'amount',
                label: 'Net',
                align: 'right',
                render: (r) => (
                  <span className={`font-semibold ${r.amount < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {r.amount < 0 ? `Collect ${formatMoney(-r.amount)}` : `Pay ${formatMoney(r.amount)}`}
                  </span>
                ),
              },
              { key: 'oldest', label: 'Pending since', render: (r) => formatDate(r.oldest) },
              {
                key: 'actions',
                label: '',
                align: 'right',
                render: (r) => (
                  <Button variant="secondary" icon="check" disabled={!r.partner} onClick={() => setSettling(r)}>Settle</Button>
                ),
              },
            ]}
          />
        </LoadState>
      </Card>

      <SettleModal
        row={settling}
        onClose={() => setSettling(null)}
        onDone={() => {
          toast(`Settled with ${settling.partner.name}`)
          setSettling(null)
          reload()
        }}
      />
    </>
  )
}

function Summary({ icon, tone, label, hint, value }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={`grid h-12 w-12 place-items-center rounded-xl ${tone}`}>
        <Icon name={icon} />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="text-xs text-slate-400">{hint}</p>
      </div>
    </Card>
  )
}

function SettleModal({ row, onClose, onDone }) {
  const [payoutRef, setPayoutRef] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (!row) return null

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.partners.settle(row.partner._id, payoutRef.trim())
      setPayoutRef('')
      onDone()
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
      title={`Settle with ${row.partner?.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="settle-form" disabled={busy || !payoutRef.trim()}>{busy ? 'Saving…' : 'Mark as settled'}</Button>
        </>
      }
    >
      <form id="settle-form" onSubmit={submit} className="space-y-4 text-sm">
        <div className={`rounded-xl p-4 ${row.amount < 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">{row.amount < 0 ? 'Collect from partner' : 'Pay to partner'}</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(Math.abs(row.amount))}</p>
          <p className="mt-1 opacity-80">Covers {row.jobs} pending job{row.jobs === 1 ? '' : 's'}</p>
        </div>
        <Field label="Payment reference" hint="UTR or transaction id for your records">
          <input required autoFocus className={inputClass} value={payoutRef} onChange={(e) => setPayoutRef(e.target.value)} />
        </Field>
        <FormError error={error} />
      </form>
    </Modal>
  )
}
