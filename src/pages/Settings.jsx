import { useState } from 'react'
import { api } from '../lib/api.js'
import { formatDateTime, formatMoney } from '../lib/format.js'
import { useAsync } from '../hooks/useAsync.js'
import { useToast } from '../components/Toast.jsx'
import { ActionButton, Button, Card, Field, FormError, LoadState, PageHeader, inputClass } from '../components/ui.jsx'

const VEHICLES = [
  ['bike', 'Bike taxi'],
  ['auto', 'Auto rickshaw'],
  ['cab', 'Cab'],
]

const toForm = (s) => ({
  commission: { ...s.commission },
  rides: {
    enabled: s.rides.enabled,
    searchRadiusKm: s.rides.searchRadiusKm,
    requestTtlMinutes: s.rides.requestTtlMinutes,
    roadFactor: s.rides.roadFactor,
    fares: Object.fromEntries(VEHICLES.map(([v]) => [v, { ...s.rides.fares[v] }])),
  },
  partner: { ...s.partner },
  support: { phone: s.support?.phone ?? '', email: s.support?.email ?? '', whatsapp: s.support?.whatsapp ?? '' },
  partnerFaqs: (s.partnerFaqs ?? []).map((f) => ({ ...f })),
})

export default function Settings() {
  const { data, error, loading, reload } = useAsync(() => api.settings.get())

  return (
    <>
      <PageHeader
        title="Rates & settings"
        subtitle={data ? `Last updated ${formatDateTime(data.updatedAt)} · changes apply to new jobs and rides` : 'Commission, ride fares and app content'}
        action={<Button variant="secondary" icon="refresh" onClick={reload}>Reload</Button>}
      />
      <LoadState loading={loading} error={error} onRetry={reload} rows={8}>
        {data && <SettingsForm key={data.updatedAt} initial={data} onSaved={reload} />}
      </LoadState>
    </>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mb-4 text-xs text-slate-500">{subtitle}</p>}
      {children}
    </Card>
  )
}

function example(fare, roadFactor) {
  const km = Math.round(3 * Number(roadFactor || 1) * 10) / 10
  return Math.max(Number(fare.base) + Math.round(km * Number(fare.perKm)), Number(fare.minimum))
}

function SettingsForm({ initial, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(() => toForm(initial))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const setIn = (path, value) =>
    setForm((prev) => {
      const next = structuredClone(prev)
      const keys = path.split('.')
      let target = next
      for (const k of keys.slice(0, -1)) target = target[k]
      target[keys.at(-1)] = value
      return next
    })
  const bind = (path, type = 'number') => ({
    value: path.split('.').reduce((o, k) => o[k], form),
    onChange: (e) => setIn(path, type === 'checkbox' ? e.target.checked : e.target.value),
  })
  const setFaq = (i, key, value) =>
    setForm({ ...form, partnerFaqs: form.partnerFaqs.map((f, idx) => (idx === i ? { ...f, [key]: value } : f)) })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const num = (v) => Number(v)
      await api.settings.update({
        commission: { servicePercent: num(form.commission.servicePercent), ridePercent: num(form.commission.ridePercent) },
        rides: {
          enabled: form.rides.enabled,
          searchRadiusKm: num(form.rides.searchRadiusKm),
          requestTtlMinutes: num(form.rides.requestTtlMinutes),
          roadFactor: num(form.rides.roadFactor),
          fares: Object.fromEntries(
            VEHICLES.map(([v]) => {
              const f = form.rides.fares[v]
              return [v, { enabled: f.enabled, label: f.label, base: num(f.base), perKm: num(f.perKm), minimum: num(f.minimum), speedKmh: num(f.speedKmh) }]
            }),
          ),
        },
        partner: { defaultVisitCharge: num(form.partner.defaultVisitCharge) },
        support: form.support,
        partnerFaqs: form.partnerFaqs.filter((f) => f.question.trim() || f.answer.trim()),
      })
      toast('Settings saved')
      onSaved()
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <FormError error={error} />

      <Section title="Commission" subtitle="Percentage Anurgo keeps from each completed job or ride">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Service jobs %"><input required type="number" min="0" max="100" step="0.5" className={inputClass} {...bind('commission.servicePercent')} /></Field>
          <Field label="Rides %"><input required type="number" min="0" max="100" step="0.5" className={inputClass} {...bind('commission.ridePercent')} /></Field>
          <Field label="Default visit charge ₹" hint="Pre-filled for new service partners">
            <input required type="number" min="0" className={inputClass} {...bind('partner.defaultVisitCharge')} />
          </Field>
        </div>
      </Section>

      <Section title="Ride fares" subtitle="Fare = base + distance × per km, never below minimum. Example shown for a 3 km straight-line trip.">
        <label className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.rides.enabled} onChange={(e) => setIn('rides.enabled', e.target.checked)} />
          Ride booking is enabled
        </label>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2 pr-3 font-medium">Vehicle</th>
                <th className="pb-2 pr-3 font-medium">Label in apps</th>
                <th className="pb-2 pr-3 font-medium">Base ₹</th>
                <th className="pb-2 pr-3 font-medium">Per km ₹</th>
                <th className="pb-2 pr-3 font-medium">Minimum ₹</th>
                <th className="pb-2 pr-3 font-medium">Avg speed km/h</th>
                <th className="pb-2 font-medium">3 km ride</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {VEHICLES.map(([v, name]) => {
                const f = form.rides.fares[v]
                const cell = `${inputClass} w-24`
                return (
                  <tr key={v} className={f.enabled ? '' : 'opacity-50'}>
                    <td className="py-2 pr-3">
                      <label className="flex items-center gap-2 font-medium text-slate-800">
                        <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={f.enabled} onChange={(e) => setIn(`rides.fares.${v}.enabled`, e.target.checked)} />
                        {name}
                      </label>
                    </td>
                    <td className="py-2 pr-3"><input required className={`${inputClass} w-32`} {...bind(`rides.fares.${v}.label`, 'text')} /></td>
                    <td className="py-2 pr-3"><input required type="number" min="0" className={cell} {...bind(`rides.fares.${v}.base`)} /></td>
                    <td className="py-2 pr-3"><input required type="number" min="0" step="0.5" className={cell} {...bind(`rides.fares.${v}.perKm`)} /></td>
                    <td className="py-2 pr-3"><input required type="number" min="0" className={cell} {...bind(`rides.fares.${v}.minimum`)} /></td>
                    <td className="py-2 pr-3"><input required type="number" min="1" className={cell} {...bind(`rides.fares.${v}.speedKmh`)} /></td>
                    <td className="py-2 font-semibold text-slate-900">{formatMoney(example(f, form.rides.roadFactor))}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Ride dispatch" subtitle="How ride requests reach drivers">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Search radius (km)" hint="Drivers within this distance of pickup get the request">
            <input required type="number" min="0.5" max="50" step="0.5" className={inputClass} {...bind('rides.searchRadiusKm')} />
          </Field>
          <Field label="Request timeout (minutes)" hint="Unaccepted rides expire after this">
            <input required type="number" min="1" max="60" className={inputClass} {...bind('rides.requestTtlMinutes')} />
          </Field>
          <Field label="Road factor" hint="Straight-line distance × this ≈ road distance">
            <input required type="number" min="1" max="3" step="0.05" className={inputClass} {...bind('rides.roadFactor')} />
          </Field>
        </div>
      </Section>

      <Section title="Partner support" subtitle="Shown in the partner app's Help & support screen">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Support phone"><input className={inputClass} {...bind('support.phone', 'text')} /></Field>
          <Field label="Support email"><input type="email" className={inputClass} {...bind('support.email', 'text')} /></Field>
          <Field label="WhatsApp number" hint="Optional, with country code e.g. 919876543210">
            <input className={inputClass} {...bind('support.whatsapp', 'text')} />
          </Field>
        </div>
      </Section>

      <Section title="Partner FAQs" subtitle="Questions shown in the partner app, grouped by category">
        <div className="space-y-3">
          {form.partnerFaqs.map((f, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-3">
              <div className="flex gap-2">
                <input className={`${inputClass} w-36`} placeholder="Category" value={f.category} onChange={(e) => setFaq(i, 'category', e.target.value)} />
                <input className={inputClass} placeholder="Question" value={f.question} onChange={(e) => setFaq(i, 'question', e.target.value)} />
                <ActionButton icon="trash" label="Remove FAQ" tone="danger" onClick={() => setForm({ ...form, partnerFaqs: form.partnerFaqs.filter((_, idx) => idx !== i) })} />
              </div>
              <textarea rows={2} className={`${inputClass} mt-2`} placeholder="Answer" value={f.answer} onChange={(e) => setFaq(i, 'answer', e.target.value)} />
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            icon="plus"
            onClick={() => setForm({ ...form, partnerFaqs: [...form.partnerFaqs, { category: 'General', question: '', answer: '' }] })}
          >
            Add FAQ
          </Button>
        </div>
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" icon="check" disabled={busy} className="shadow-lg">{busy ? 'Saving…' : 'Save settings'}</Button>
      </div>
    </form>
  )
}
