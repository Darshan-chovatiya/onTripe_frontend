import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Send, Users, UserCheck, Building2, UserPlus,
  Mail, Phone, Check, History, Loader2, Paperclip, X,
  FileText, ImageIcon, Bell, Smartphone, ChevronRight, AlertTriangle, Store
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'

const ALL_TABS = [
  { id: 'parents',     label: 'Parents',      icon: Building2, color: 'text-primary-700 bg-primary-50',  fcmOnly: false },
  { id: 'children',   label: 'Child agents', icon: Users,     color: 'text-violet-700 bg-violet-50',    fcmOnly: false },
  { id: 'customers',  label: 'Customers',    icon: UserCheck, color: 'text-emerald-700 bg-emerald-50',  fcmOnly: false },
  { id: 'vendors',    label: 'Vendors',      icon: Store,     color: 'text-orange-700 bg-orange-50',    fcmOnly: false },
]

function recipientHaystack(item, cat) {
  return `${item.name || ''} ${item.email || ''} ${item.agentCode || ''} ${cat === 'customers' ? item.phone || '' : ''}`.toLowerCase()
}

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const getImgUrl = (p) => p ? (p.startsWith('http') ? p : `${API_BASE}/${String(p).replace(/^\//, '')}`) : null

function Avatar({ name, color, image }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const imgUrl = getImgUrl(image)
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-bold ${color}`}>
      {imgUrl ? <img src={imgUrl} alt={name} className="h-full w-full object-cover" /> : initials}
    </div>
  )
}

export default function Notifications() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [recipients, setRecipients] = useState({ parents: [], children: [], subChildren: [], customers: [], vendors: [] })
  const [activeTab, setActiveTab] = useState('parents')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [formData, setFormData] = useState({ subject: '', message: '' })
  const [sendEmail, setSendEmail] = useState(true)
  const [sendFcm, setSendFcm] = useState(false)
  const [files, setFiles] = useState([])
  const fileInputRef = useRef(null)

  const fetchRecipients = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getNotificationRecipients()
      if (data?.success && data.data) {
        setRecipients({
          parents: data.data.parents || [],
          children: data.data.children || [],
          subChildren: data.data.subChildren || [],
          customers: data.data.customers || [],
          vendors: data.data.vendors || [],
        })
      }
    } catch { toastRef.current.error('Failed to load recipients') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRecipients() }, [fetchRecipients])

  // When FCM is toggled ON — force to allowed tab and deselect non-allowed
  const handleFcmToggle = (checked) => {
    setSendFcm(checked)
    if (checked) {
      setFiles([]) // Push notifications don't support attachments
      if (activeTab !== 'customers' && activeTab !== 'vendors') {
        setActiveTab('customers')
      }
      // Remove any non-allowed selections
      const allowedIds = new Set([
        ...(recipients.customers || []).map(c => c._id),
        ...(recipients.vendors || []).map(v => v._id)
      ])
      setSelectedIds(prev => {
        const next = new Set()
        prev.forEach(id => { if (allowedIds.has(id)) next.add(id) })
        return next
      })
    }
  }

  // Tabs visible: if FCM only, show only customers and vendors tabs
  const visibleTabs = sendFcm ? ALL_TABS.filter(t => t.id === 'customers' || t.id === 'vendors') : ALL_TABS

  // If FCM on and user tries to switch to non-allowed tab — block it
  const handleTabChange = (tabId) => {
    if (sendFcm && tabId !== 'customers' && tabId !== 'vendors') return
    setActiveTab(tabId)
    setSearch('')
  }

  const toggleOne = (id) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleAll = (tab) => {
    const list = recipients[tab] || []
    setSelectedIds(prev => {
      const next = new Set(prev)
      const allOn = list.length > 0 && list.every(i => next.has(i._id))
      list.forEach(i => allOn ? next.delete(i._id) : next.add(i._id))
      return next
    })
  }

  const handleSend = async () => {
    if (selectedIds.size === 0) { toastRef.current.error('Select at least one recipient'); return }
    if (!formData.subject.trim() || !formData.message.trim()) { toastRef.current.error('Subject and message are required'); return }
    if (!sendEmail && !sendFcm) { toastRef.current.error('Select at least one channel'); return }

    setSending(true)
    try {
      const users = [], customers = [], vendors = []
      Object.keys(recipients).forEach(cat => {
        ;(recipients[cat] || []).forEach(item => {
          if (selectedIds.has(item._id)) {
            if (cat === 'customers') customers.push(item._id)
            else if (cat === 'vendors') vendors.push(item._id)
            else users.push(item._id)
          }
        })
      })

      const channels = []
      if (sendEmail) channels.push('email')
      if (sendFcm) channels.push('fcm')

      const fd = new FormData()
      fd.append('subject', formData.subject.trim())
      fd.append('message', formData.message.trim())
      fd.append('users', JSON.stringify(users))
      fd.append('customers', JSON.stringify(customers))
      fd.append('vendors', JSON.stringify(vendors))
      fd.append('channels', JSON.stringify(channels))
      files.forEach(f => fd.append('attachments', f))

      const { data } = await adminApi.sendNotification(fd)
      if (data?.success) {
        toastRef.current.success(`Sent to ${selectedIds.size} recipient${selectedIds.size !== 1 ? 's' : ''}`)
        setSelectedIds(new Set())
        setFormData({ subject: '', message: '' })
        setFiles([])
      } else {
        toastRef.current.error(data?.message || 'Send failed')
      }
    } catch { toastRef.current.error('Broadcast failed') }
    finally { setSending(false) }
  }

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...picked].slice(0, 5))
    e.target.value = ''
  }

  const q = search.trim().toLowerCase()
  const list = recipients[activeTab] || []
  const filtered = q ? list.filter(i => recipientHaystack(i, activeTab).includes(q)) : list
  const allSelected = list.length > 0 && list.every(i => selectedIds.has(i._id))
  const activeTabMeta = ALL_TABS.find(t => t.id === activeTab)

  const selectedCounts = Object.fromEntries(
    Object.keys(recipients).map(cat => [cat, (recipients[cat] || []).filter(i => selectedIds.has(i._id)).length])
  )
  const totalSelected = selectedIds.size

  if (loading) return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
      <Loader size="lg" />
      <p className="text-sm text-gray-400">Loading recipients…</p>
    </div>
  )

  return (
    <div className="animate-fade-in space-y-6 pb-8">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-900/20">
            <Bell className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Broadcast</h1>
            <p className="text-xs text-gray-400">Send email or push notifications to your network</p>
          </div>
        </div>
        <button type="button" onClick={() => navigate('/admin/notifications/history')}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50">
          <History className="h-4 w-4" strokeWidth={2} />
          History
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" strokeWidth={2.5} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* ── Recipients panel ── */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-7">

          {/* Tab bar */}
          <div className="flex gap-0.5 overflow-x-auto border-b border-gray-100 bg-gray-50/40 px-3 pt-2">
            {visibleTabs.map(tab => {
              const Icon = tab.icon
              const on = activeTab === tab.id
              const cnt = selectedCounts[tab.id]
              return (
                <button key={tab.id} type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-[13px] font-semibold transition-all ${
                    on ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  {tab.label}
                  {cnt > 0 && (
                    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-black text-white">
                      {cnt}
                    </span>
                  )}
                  {on && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary-600" />}
                </button>
              )
            })}

            {/* FCM lock indicator */}
            {sendFcm && (
              <div className="ml-auto flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-amber-600">
                <Smartphone className="h-3.5 w-3.5" strokeWidth={2} />
                FCM: Apps only
              </div>
            )}
          </div>

          {/* Search + select all */}
          <div className="flex items-center gap-2 border-b border-gray-50 px-4 py-2.5">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" strokeWidth={2} />
              <input type="search" placeholder="Search by name, email, phone…" autoComplete="off"
                className="w-full rounded-xl border border-gray-100 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-100"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button type="button" onClick={() => toggleAll(activeTab)} disabled={list.length === 0}
              className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-30">
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          {/* List */}
          <div className="min-h-0 flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${activeTabMeta?.color || 'bg-gray-100 text-gray-400'}`}>
                  {activeTabMeta && <activeTabMeta.icon className="h-6 w-6" strokeWidth={1.5} />}
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-500">No {activeTabMeta?.label || 'recipients'} found</p>
                {q && <p className="mt-1 text-xs text-gray-400">Try a different search</p>}
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {filtered.map(item => {
                  const sel = selectedIds.has(item._id)
                  return (
                    <li key={item._id}>
                      <button type="button" onClick={() => toggleOne(item._id)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all ${sel ? 'bg-primary-50/50' : 'hover:bg-gray-50/60'}`}>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${sel ? 'border-primary-600 bg-primary-600' : 'border-gray-300 bg-white'}`}>
                          {sel && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                        </span>
                        <Avatar name={item.name} color={activeTabMeta?.color || 'bg-gray-100 text-gray-600'}
                          image={activeTab === 'customers' ? item.profileImage : (item.agencyLogo || item.profileImage)} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{item.name || 'Unnamed'}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            {item.email && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Mail className="h-3 w-3" strokeWidth={2} />{item.email}
                              </span>
                            )}
                            {activeTab === 'customers' && item.phone && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Phone className="h-3 w-3" strokeWidth={2} />{item.phone}
                              </span>
                            )}
                            {item.agentCode && (
                              <span className="font-mono text-[10px] text-gray-300">{item.agentCode}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black tabular-nums text-gray-900">{totalSelected}</span>
              <span className="text-sm text-gray-400">selected</span>
              {totalSelected > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TABS.filter(t => selectedCounts[t.id] > 0).map(t => (
                    <span key={t.id} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${t.color}`}>
                      {selectedCounts[t.id]} {t.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {totalSelected > 0 && (
              <button type="button" onClick={() => setSelectedIds(new Set())}
                className="text-xs font-semibold text-gray-400 transition hover:text-red-500">
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* ── Compose panel ── */}
        <div className="lg:col-span-5">
          <div className="sticky top-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

            <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-4">
              <h2 className="text-sm font-bold text-gray-900">Compose message</h2>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {totalSelected > 0
                  ? `Sending to ${totalSelected} recipient${totalSelected !== 1 ? 's' : ''}`
                  : 'Select recipients first'}
              </p>
            </div>

            <div className="space-y-4 p-5">

              {/* ── Channels ── */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Delivery channel</p>
                <div className="grid grid-cols-2 gap-2">
                  {/* Email */}
                  <label className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm font-semibold transition-all ${
                    sendEmail ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}>
                    <input type="checkbox" className="sr-only" checked={sendEmail}
                      onChange={e => setSendEmail(e.target.checked)} />
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${sendEmail ? 'bg-primary-100' : 'bg-gray-100'}`}>
                      <Mail className={`h-4 w-4 ${sendEmail ? 'text-primary-600' : 'text-gray-400'}`} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold">Email</p>
                      <p className="text-[10px] font-normal text-gray-400">All recipients</p>
                    </div>
                    {sendEmail && <Check className="ml-auto h-4 w-4 shrink-0 text-primary-600" strokeWidth={3} />}
                  </label>

                  {/* FCM */}
                  <label className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm font-semibold transition-all ${
                    sendFcm ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}>
                    <input type="checkbox" className="sr-only" checked={sendFcm}
                      onChange={e => handleFcmToggle(e.target.checked)} />
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${sendFcm ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <Smartphone className={`h-4 w-4 ${sendFcm ? 'text-emerald-600' : 'text-gray-400'}`} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold">Push (FCM)</p>
                      <p className="text-[10px] font-normal text-gray-400">Apps only (Customers & Vendors)</p>
                    </div>
                    {sendFcm && <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />}
                  </label>
                </div>

                {/* FCM info banner */}
                {sendFcm && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" strokeWidth={2} />
                    <p className="text-[11px] font-semibold leading-relaxed text-amber-700">
                      FCM push only works for Mobile App users (Customers & Vendors). Other recipient tabs are hidden. Non-allowed selections have been cleared.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Subject ── */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Subject *</label>
                <input type="text" placeholder="e.g. Important update about your booking"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={formData.subject} onChange={e => setFormData(f => ({ ...f, subject: e.target.value }))} />
              </div>

              {/* ── Message ── */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Message *</label>
                <textarea placeholder="Write your message here…" rows={6}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={formData.message} onChange={e => setFormData(f => ({ ...f, message: e.target.value }))} />
              </div>

              {/* ── Attachments ── */}
              {!sendFcm && (
                <div>
                  <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/jpg,application/pdf"
                    className="hidden" onChange={handleFileChange} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={files.length >= 5}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-2.5 text-xs font-semibold text-gray-500 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-40">
                    <Paperclip className="h-3.5 w-3.5" strokeWidth={2} />
                    Attach files ({files.length}/5)
                  </button>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {files.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                          {f.type.startsWith('image/')
                            ? <ImageIcon className="h-4 w-4 shrink-0 text-sky-500" strokeWidth={1.75} />
                            : <FileText className="h-4 w-4 shrink-0 text-rose-400" strokeWidth={1.75} />}
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700">{f.name}</span>
                          <span className="shrink-0 text-[10px] text-gray-400">
                            {f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(0)}KB` : `${(f.size / (1024 * 1024)).toFixed(1)}MB`}
                          </span>
                          <button type="button" onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                            className="shrink-0 rounded-md p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* ── Send button ── */}
              <button type="button" onClick={handleSend}
                disabled={sending || totalSelected === 0 || (!sendEmail && !sendFcm)}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-lg shadow-primary-900/20 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40">
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />Sending…</>
                ) : (
                  <><Send className="h-4 w-4" strokeWidth={2} />Send to {totalSelected || '—'} recipient{totalSelected !== 1 ? 's' : ''}</>
                )}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
