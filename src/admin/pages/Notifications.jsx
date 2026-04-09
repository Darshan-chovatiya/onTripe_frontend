import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Send,
  Users,
  UserCheck,
  Building2,
  UserPlus,
  Mail,
  Phone,
  Check,
  History,
  Loader2,
  Paperclip,
  X,
  FileText,
  ImageIcon,
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'

const TABS = [
  { id: 'parents', label: 'Parents', icon: Building2 },
  { id: 'children', label: 'Child agents', icon: Users },
  { id: 'subChildren', label: 'Sub-child', icon: UserPlus },
  { id: 'customers', label: 'Customers', icon: UserCheck },
]

function recipientSearchHaystack(item, category) {
  const name = (item.name || '').toLowerCase()
  const email = (item.email || '').toLowerCase()
  const code = (item.agentCode || '').toLowerCase()
  const phone = (item.phone || '').toString().toLowerCase()
  return `${name} ${email} ${code} ${category === 'customers' ? phone : ''}`
}

export default function Notifications() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [recipients, setRecipients] = useState({
    parents: [],
    children: [],
    subChildren: [],
    customers: [],
  })

  const [activeCategory, setActiveCategory] = useState('parents')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const [formData, setFormData] = useState({ subject: '', message: '' })
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
        })
      } else {
        toastRef.current.error(data?.message || 'Could not load recipients')
      }
    } catch {
      toastRef.current.error('Failed to load recipients')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecipients()
  }, [fetchRecipients])

  const toggleRecipient = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCategory = (category) => {
    const categoryList = recipients[category] || []
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = categoryList.length > 0 && categoryList.every((item) => next.has(item._id))
      if (allSelected) {
        categoryList.forEach((item) => next.delete(item._id))
      } else {
        categoryList.forEach((item) => next.add(item._id))
      }
      return next
    })
  }

  const handleSend = async () => {
    if (selectedIds.size === 0) {
      toastRef.current.error('Select at least one recipient')
      return
    }
    if (!formData.subject.trim() || !formData.message.trim()) {
      toastRef.current.error('Subject and message are required')
      return
    }

    setSending(true)
    try {
      const users = []
      const customers = []

      Object.keys(recipients).forEach((cat) => {
        ;(recipients[cat] || []).forEach((item) => {
          if (selectedIds.has(item._id)) {
            if (cat === 'customers') customers.push(item._id)
            else users.push(item._id)
          }
        })
      })

      const fd = new FormData()
      fd.append('subject', formData.subject.trim())
      fd.append('message', formData.message.trim())
      fd.append('users', JSON.stringify(users))
      fd.append('customers', JSON.stringify(customers))
      files.forEach((f) => fd.append('attachments', f))

      const { data } = await adminApi.sendNotification(fd)

      if (data?.success) {
        toastRef.current.success(`Sent to ${selectedIds.size} recipient${selectedIds.size === 1 ? '' : 's'}`)
        setSelectedIds(new Set())
        setFormData({ subject: '', message: '' })
        setFiles([])
      } else {
        toastRef.current.error(data?.message || 'Send failed')
      }
    } catch {
      toastRef.current.error('Broadcast failed')
    } finally {
      setSending(false)
    }
  }

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files || [])
    setFiles((prev) => {
      const combined = [...prev, ...picked]
      return combined.slice(0, 5) // max 5
    })
    e.target.value = ''
  }

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))

  const q = search.trim().toLowerCase()
  const list = recipients[activeCategory] || []
  const filteredRecipients = q
    ? list.filter((item) => recipientSearchHaystack(item, activeCategory).includes(q))
    : list

  const allInTabSelected =
    list.length > 0 && list.every((item) => selectedIds.has(item._id))

  if (loading) {
    return (
      <div className="animate-fade-in flex min-h-[280px] flex-col items-center justify-center py-20">
        <Loader size="lg" />
        <p className="mt-4 text-sm text-gray-400">Loading recipients…</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header — minimal */}
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {/* <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-600">
            <Bell className="h-4 w-4" strokeWidth={1.75} />
          </div> */}
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Broadcast</h1>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-gray-500">
            Email everyone you select. Pick an audience, write once, send.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/notifications/history')}
          className="self-start text-sm text-gray-500 transition-colors hover:text-gray-900 sm:self-auto"
        >
          <span className="inline-flex items-center gap-1.5">
            <History className="h-4 w-4 opacity-70" strokeWidth={1.75} />
            History
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Recipients */}
        <div className="flex min-h-[520px] flex-col rounded-2xl border border-gray-200/80 bg-white lg:col-span-7">
          {/* Tabs — underline style */}
          <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-gray-100 px-2 pt-1 sm:px-4">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const on = activeCategory === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(tab.id)
                    setSearch('')
                  }}
                  className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-3 text-sm transition-colors ${
                    on
                      ? 'font-medium text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 opacity-70" strokeWidth={1.75} />
                  {tab.label}
                  {on ? (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gray-900" />
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="border-b border-gray-50 px-4 py-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                strokeWidth={1.75}
              />
              <input
                type="search"
                placeholder="Search…"
                autoComplete="off"
                className="w-full rounded-lg border-0 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-gray-100/80 focus:outline-none focus:ring-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs text-gray-400">{filteredRecipients.length} shown</span>
            <button
              type="button"
              onClick={() => toggleCategory(activeCategory)}
              disabled={list.length === 0}
              className="text-xs text-gray-600 underline-offset-2 hover:underline disabled:opacity-30"
            >
              {allInTabSelected ? 'Clear tab' : 'Select all'}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredRecipients.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <Users className="h-10 w-10 text-gray-200" strokeWidth={1} />
                <p className="mt-4 text-sm text-gray-500">No matches</p>
              </div>
            ) : (
              <ul>
                {filteredRecipients.map((item) => {
                  const selected = selectedIds.has(item._id)
                  return (
                    <li key={item._id} className="border-t border-gray-50 first:border-t-0">
                      <button
                        type="button"
                        onClick={() => toggleRecipient(item._id)}
                        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                          selected ? 'bg-gray-50/80' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <span
                          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors ${
                            selected
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {selected ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.name || 'Unnamed'}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-500">
                            {item.email ? (
                              <span className="inline-flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 shrink-0 opacity-60" strokeWidth={2} />
                                <span className="truncate">{item.email}</span>
                              </span>
                            ) : null}
                            {activeCategory === 'customers' && item.phone ? (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3 shrink-0 opacity-60" strokeWidth={2} />
                                {item.phone}
                              </span>
                            ) : null}
                            {item.agentCode ? (
                              <span className="font-mono text-[11px] text-gray-400">{item.agentCode}</span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium tabular-nums text-gray-900">{selectedIds.size}</span>
              <span className="text-gray-400"> selected</span>
            </p>
            {selectedIds.size > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-medium text-gray-500 hover:text-gray-800"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {/* Compose */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-4">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6">
              <h2 className="text-sm font-medium text-gray-900">Message</h2>
              <p className="mt-0.5 text-xs text-gray-400">Delivered by email</p>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="bc-subject" className="sr-only">
                    Subject
                  </label>
                  <input
                    id="bc-subject"
                    type="text"
                    placeholder="Subject"
                    className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
                    value={formData.subject}
                    onChange={(e) => setFormData((f) => ({ ...f, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="bc-message" className="sr-only">
                    Message
                  </label>
                  <textarea
                    id="bc-message"
                    placeholder="Write your message…"
                    rows={12}
                    className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-3 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-0"
                    value={formData.message}
                    onChange={(e) => setFormData((f) => ({ ...f, message: e.target.value }))}
                  />
                </div>

                <p className="text-xs leading-relaxed text-gray-400">
                  Recipients receive this as an email. Sending cannot be undone.
                </p>

                {/* Attachments */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={files.length >= 5}
                    className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <Paperclip className="h-3.5 w-3.5" strokeWidth={2} />
                    Attach file
                    <span className="text-gray-400">({files.length}/5)</span>
                  </button>

                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {files.map((f, i) => {
                        const isImg = f.type.startsWith('image/')
                        return (
                          <li key={i} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                            {isImg
                              ? <ImageIcon className="h-4 w-4 shrink-0 text-sky-500" strokeWidth={1.75} />
                              : <FileText className="h-4 w-4 shrink-0 text-rose-400" strokeWidth={1.75} />
                            }
                            <span className="min-w-0 flex-1 truncate text-xs text-gray-700">{f.name}</span>
                            <span className="shrink-0 text-[10px] text-gray-400">
                              {f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(0)} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`}
                            </span>
                            <button type="button" onClick={() => removeFile(i)} className="shrink-0 text-gray-400 hover:text-red-500">
                              <X className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || selectedIds.size === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" strokeWidth={1.75} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
