import { useRef, useState } from 'react'
import { CalendarDays, ChevronDown, X } from 'lucide-react'

function today() {
  return new Date().toISOString().slice(0, 10)
}
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function startOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function startOfYear() {
  return `${new Date().getFullYear()}-01-01`
}
function lastMonth() {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  const start = d.toISOString().slice(0, 10)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { start, end: last.toISOString().slice(0, 10) }
}
function fmt(iso) {
  if (!iso) return ''
  const [y, m, day] = iso.split('-')
  return `${day}/${m}/${y}`
}

const PRESETS = [
  { label: 'Today',       getDates: () => { const d = today(); return { start: d, end: d } } },
  { label: 'Last 7 days', getDates: () => ({ start: daysAgo(6),  end: today() }) },
  { label: 'Last 30 days',getDates: () => ({ start: daysAgo(29), end: today() }) },
  { label: 'This month',  getDates: () => ({ start: startOfMonth(), end: today() }) },
  { label: 'Last month',  getDates: () => lastMonth() },
  { label: 'This year',   getDates: () => ({ start: startOfYear(), end: today() }) },
]

/**
 * @param {{ value: { start: string, end: string }, onChange: (v: { start: string, end: string }) => void }} props
 */
export default function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ start: '', end: '' })
  const ref = useRef(null)

  const hasRange = value.start && value.end

  const apply = (start, end) => {
    onChange({ start, end })
    setOpen(false)
  }

  const clear = (e) => {
    e.stopPropagation()
    onChange({ start: '', end: '' })
  }

  const openPicker = () => {
    setDraft({ start: value.start, end: value.end })
    setOpen(true)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={openPicker}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-50"
      >
        <CalendarDays className="h-4 w-4 text-gray-400" strokeWidth={2} />
        <span>{hasRange ? `${fmt(value.start)} – ${fmt(value.end)}` : 'Date range'}</span>
        {hasRange ? (
          <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" strokeWidth={2} onClick={clear} />
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2} />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Quick select</p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { const d = p.getDates(); apply(d.start, d.end) }}
                  className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Custom range</p>
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">From</label>
                <input
                  type="date"
                  value={draft.start}
                  max={draft.end || today()}
                  onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">To</label>
                <input
                  type="date"
                  value={draft.end}
                  min={draft.start}
                  max={today()}
                  onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!draft.start || !draft.end}
                onClick={() => apply(draft.start, draft.end)}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
