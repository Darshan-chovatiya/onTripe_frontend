import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Bell, Paperclip, Users, CheckCircle2, XCircle,
  Calendar, Mail, FileText, ChevronDown, ChevronUp,
} from 'lucide-react'
import { getSentNotifications } from '@/travelAgency/childAgency/services/childAgencyApi.js'
import Loader from '@/shared/components/Loader.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'

function resolveUrl(p) {
  if (!p) return null
  if (String(p).startsWith('http')) return p
  return `${BASE_URL}/${String(p).replace(/^\/+/, '')}`
}

function isImage(filename = '', contentType = '') {
  const ext = String(filename).split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || String(contentType).startsWith('image/')
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AttachmentItem({ att }) {
  const url = att.url || resolveUrl(att.path)
  const img = isImage(att.filename, att.contentType)
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 transition hover:border-primary-200 hover:bg-primary-50/40">
      {img ? (
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
          <img src={url} alt={att.filename} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        </div>
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <FileText className="h-5 w-5 text-gray-400" strokeWidth={1.75} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{att.filename || 'Attachment'}</p>
        {att.size ? <p className="text-xs text-gray-400">{formatBytes(att.size)}</p> : null}
      </div>
      <span className="shrink-0 text-xs font-medium text-primary-700 group-hover:text-primary-900">Open ↗</span>
    </a>
  )
}

function RecipientRow({ r }) {
  const name = r.receiver?.name || r.receiver?.email || String(r.receiver || '—')
  const email = r.receiver?.email
  const sent = r.status === 'sent'
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
      {sent
        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2} />
        : <XCircle className="h-4 w-4 shrink-0 text-red-400" strokeWidth={2} />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        {email && email !== name ? <p className="truncate text-xs text-gray-500">{email}</p> : null}
      </div>
      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${sent ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
        {r.status}
      </span>
    </div>
  )
}

function NotificationCard({ item }) {
  const [expanded, setExpanded] = useState(false)
  const recipients = item.recipients || []
  const attachments = item.attachments || []
  const sentCount = recipients.filter((r) => r.status === 'sent').length
  const failedCount = recipients.filter((r) => r.status === 'failed').length

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="space-y-3 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-gray-900">{item.subject || '—'}</p>
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="h-3.5 w-3.5 opacity-60" strokeWidth={2} />
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {sentCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />{sentCount} sent
              </span>
            )}
            {failedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                <XCircle className="h-3 w-3" strokeWidth={2.5} />{failedCount} failed
              </span>
            )}
            {attachments.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                <Paperclip className="h-3 w-3" strokeWidth={2} />{attachments.length}
              </span>
            )}
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{item.message || '—'}</p>
        {attachments.length > 0 && (
          <div className="pt-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Attachments ({attachments.length})</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {attachments.map((att, i) => <AttachmentItem key={i} att={att} />)}
            </div>
          </div>
        )}
        {recipients.length > 0 && (
          <button type="button" onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2 text-left transition hover:bg-gray-100/60">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
              <Users className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
              {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
            </span>
            {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
        )}
      </div>
      {expanded && recipients.length > 0 && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {recipients.map((r, i) => <RecipientRow key={i} r={r} />)}
          </div>
        </div>
      )}
    </article>
  )
}

export default function AgencyCustomerNotificationHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getSentNotifications()
      if (data?.success) {
        const all = data.data?.notifications || []
        setHistory(
          all.filter((n) =>
            Array.isArray(n.recipients) &&
            n.recipients.some((r) => r?.receiverType === 'Customer')
          )
        )
      } else {
        toastRef.current.error(data?.message || 'Could not load history')
      }
    } catch {
      toastRef.current.error('Failed to load notification history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link to="/agency/customers" className="font-medium text-primary-700 hover:text-primary-900">
          Customers
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        <span className="font-medium text-gray-900">Notification History</span>
      </nav>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
          <Bell className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Notification History</h1>
          <p className="text-sm text-gray-500">All broadcasts sent to your customers</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader size="lg" />
          <p className="mt-4 text-xs text-gray-400">Loading history…</p>
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-6 py-20 text-center">
          <Mail className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-gray-800">No notifications sent yet</p>
          <p className="mt-1 text-sm text-gray-500">Notifications you send to customers will appear here.</p>
          <Link to="/agency/customers"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Back to Customers
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => <NotificationCard key={item._id} item={item} />)}
        </div>
      )}
    </div>
  )
}
