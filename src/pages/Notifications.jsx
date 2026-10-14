import { useState } from 'react'
import { api } from '../lib/api.js'
import { useAsync } from '../hooks/useAsync.js'
import { useToast } from '../components/Toast.jsx'
import { Button, Card, Field, FormError, PageHeader, inputClass } from '../components/ui.jsx'

const AUDIENCES = [
  ['online_partners', 'Online partners', 'Partners currently online in the app'],
  ['approved_partners', 'All approved partners', 'Every active partner'],
  ['pending_partners', 'Pending partners', 'Partners waiting for approval'],
  ['all_partners', 'All partners', 'Every registered partner'],
  ['partner', 'One partner', 'Pick a partner by name or phone'],
  ['all_users', 'All customers', 'Every active customer'],
]

const EMPTY = { audience: 'online_partners', partnerId: '', title: '', body: '' }

export default function Notifications() {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const partners = useAsync(
    () => (form.audience === 'partner' ? api.partners.list({ search, limit: 20 }) : Promise.resolve(null)),
    [form.audience, search],
  )

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { sent } = await api.notifications.send({
        audience: form.audience,
        partnerId: form.audience === 'partner' ? form.partnerId : undefined,
        title: form.title,
        body: form.body,
      })
      toast(`Notification sent to ${sent} recipient${sent === 1 ? '' : 's'}`)
      setForm({ ...EMPTY, audience: form.audience })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Send notification" subtitle="Push notification + in-app message in the Anurgo apps" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Send to</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {AUDIENCES.map(([value, label, hint]) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition ${form.audience === value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <input type="radio" name="audience" className="mt-0.5 accent-brand-600" checked={form.audience === value} onChange={() => setForm({ ...form, audience: value })} />
                    <span>
                      <span className="block font-semibold text-slate-900">{label}</span>
                      <span className="text-xs text-slate-500">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {form.audience === 'partner' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Search partner">
                  <input className={inputClass} placeholder="Name or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
                </Field>
                <Field label="Partner">
                  <select required className={inputClass} value={form.partnerId} onChange={set('partnerId')}>
                    <option value="">Select partner</option>
                    {partners.data?.items?.map((p) => (
                      <option key={p._id} value={p._id}>{p.name} · {p.phone}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            <Field label="Title">
              <input required maxLength={80} className={inputClass} value={form.title} onChange={set('title')} placeholder="e.g. Heavy rain today" />
            </Field>
            <Field label="Message">
              <textarea required rows={4} maxLength={400} className={inputClass} value={form.body} onChange={set('body')} placeholder="e.g. Drive safely and keep your phone charged." />
            </Field>
            <FormError error={error} />
            <div className="flex justify-end">
              <Button type="submit" icon="send" disabled={busy}>{busy ? 'Sending…' : 'Send notification'}</Button>
            </div>
          </form>
        </Card>

        <Card className="h-fit p-5">
          <p className="mb-3 text-xs font-medium text-slate-400">Preview</p>
          <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-lg">
            <p className="text-xs text-white/60">Anurgo Partner · now</p>
            <p className="mt-1 font-semibold">{form.title || 'Notification title'}</p>
            <p className="mt-0.5 text-sm text-white/80">{form.body || 'Your message appears here.'}</p>
          </div>
          <p className="mt-3 text-xs text-slate-500">Partners without push enabled still see it in the app's notification list.</p>
        </Card>
      </div>
    </>
  )
}
