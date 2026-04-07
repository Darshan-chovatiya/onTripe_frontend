import { useState, useEffect } from 'react'
import { 
  Bell, 
  Search, 
  Send, 
  Users, 
  UserCheck, 
  Building2, 
  UserPlus, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  X,
  History,
  Trash2,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'

const Notifications = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [recipients, setRecipients] = useState({
    parents: [],
    children: [],
    subChildren: [],
    customers: []
  })
  
  const [activeCategory, setActiveCategory] = useState('parents')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  })

  useEffect(() => {
    fetchRecipients()
  }, [])

  const fetchRecipients = async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getNotificationRecipients()
      if (data.success) {
        setRecipients(data.data)
      }
    } catch (err) {
      toast.error('Failed to synchronize recipient matrix')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const { data } = await adminApi.getSentNotifications()
      if (data.success) {
        setHistory(data.data.notifications)
      }
    } catch (err) {
      toast.error('Failed to retrieve notification logs')
    }
  }

  const toggleRecipient = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleCategory = (category) => {
    const categoryList = recipients[category]
    const next = new Set(selectedIds)
    const allSelected = categoryList.every(item => next.has(item._id))
    
    if (allSelected) {
      categoryList.forEach(item => next.delete(item._id))
    } else {
      categoryList.forEach(item => next.add(item._id))
    }
    setSelectedIds(next)
  }

  const handleSend = async () => {
    if (selectedIds.size === 0) return toast.error('Please select at least one recipient')
    if (!formData.subject.trim() || !formData.message.trim()) return toast.error('Subject and message are mandatory')

    setSending(true)
    try {
      const users = []
      const customers = []

      // Properly categorize selected IDs
      Object.keys(recipients).forEach(cat => {
        recipients[cat].forEach(item => {
          if (selectedIds.has(item._id)) {
            if (cat === 'customers') customers.push(item._id)
            else users.push(item._id)
          }
        })
      })

      const { data } = await adminApi.sendNotification({
        users,
        customers,
        subject: formData.subject,
        message: formData.message
      })

      if (data.success) {
        toast.success(`Broadcasting initiated for ${selectedIds.size} recipients`)
        setSelectedIds(new Set())
        setFormData({ subject: '', message: '' })
      }
    } catch (err) {
      toast.error('Broadcasting failed')
    } finally {
      setSending(false)
    }
  }

  const filteredRecipients = recipients[activeCategory].filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.email?.toLowerCase().includes(search.toLowerCase()) ||
    item.agentCode?.toLowerCase().includes(search.toLowerCase())
  )

  const categories = [
    { id: 'parents', label: 'Parent Agents', icon: Building2, color: 'blue' },
    { id: 'children', label: 'Child Agents', icon: Users, color: 'indigo' },
    { id: 'subChildren', label: 'Sub-Children', icon: UserPlus, color: 'violet' },
    { id: 'customers', label: 'Customers', icon: UserCheck, color: 'emerald' }
  ]

  if (loading) return <div className="h-[400px] flex items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Broadcast Center</h1>
          <p className="text-gray-500 text-sm">Send multi-tier notifications to agencies and travelers across the network</p>
        </div>
        <button 
          onClick={() => { setShowHistory(true); fetchHistory(); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
        >
          <History size={16} /> Broadcast History
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recipient Selector */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
             <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                {categories.map(cat => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {setActiveCategory(cat.id); setSearch('')}}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        activeCategory === cat.id 
                          ? `bg-${cat.color}-50 text-${cat.color}-600 border border-${cat.color}-100 shadow-sm` 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="hidden sm:inline">{cat.label}</span>
                    </button>
                  )
                })}
             </div>
             
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search recipients..."
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/10 shadow-sm bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
             <div className="p-4 flex items-center justify-between border-b border-gray-50 bg-white sticky top-0 z-10 shadow-sm shadow-gray-100/50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filteredRecipients.length} Available Targets</span>
                <button 
                  onClick={() => toggleCategory(activeCategory)}
                  className="text-primary-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                >
                  {recipients[activeCategory].every(i => selectedIds.has(i._id)) ? 'Deselect All' : 'Select All'}
                </button>
             </div>
             
             <div className="divide-y divide-gray-50">
               {filteredRecipients.length === 0 ? (
                 <div className="p-20 text-center">
                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mx-auto mb-4"><Users size={32} /></div>
                    <p className="text-sm text-gray-500 italic">No recipients found in this layer.</p>
                 </div>
               ) : (
                 filteredRecipients.map(item => (
                   <div 
                     key={item._id} 
                     onClick={() => toggleRecipient(item._id)}
                     className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-all hover:bg-gray-50 ${selectedIds.has(item._id) ? 'bg-primary-50/30' : ''}`}
                   >
                     <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-all ${
                          selectedIds.has(item._id) 
                            ? 'bg-primary-600 border-primary-600 text-white shadow-md' 
                            : 'bg-white border-gray-200 text-transparent hover:border-primary-400'
                        }`}>
                           <Check size={14} strokeWidth={4} />
                        </div>
                        <div>
                           <div className="text-xs font-bold text-zinc-900">{item.name}</div>
                           <div className="text-[10px] text-gray-500 flex items-center gap-3 font-medium">
                              <span className="flex items-center gap-1"><Mail size={10} /> {item.email || 'N/A'}</span>
                              {item.agentCode && (
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[9px] font-black text-gray-600">CODE: {item.agentCode}</span>
                              )}
                           </div>
                        </div>
                     </div>
                     <div className="text-[9px] font-black text-gray-300 group-hover:text-primary-400"><ChevronRight size={14}/></div>
                   </div>
                 ))
               )}
             </div>
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <span className="h-8 w-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg shadow-primary-500/30">{selectedIds.size}</span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recipients Selected</span>
             </div>
             {selectedIds.size > 0 && (
               <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded"
               >
                 <Trash2 size={12} /> Clear
               </button>
             )}
          </div>
        </div>

        {/* Composer */}
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Dispatch Composer</h3>
              
              <div className="space-y-5">
                 <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Notification Subject</label>
                    <input 
                      type="text" 
                      placeholder="e.g. System Maintenance Update"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 transition-all placeholder:text-gray-300"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Message Content</label>
                    <textarea 
                      placeholder="Type your message here..."
                      rows={10}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 transition-all placeholder:text-gray-300 resize-none leading-relaxed"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    ></textarea>
                 </div>

                 <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100 flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary-500 mt-1.5 animate-pulse"></div>
                    <p className="text-[11px] text-primary-700 font-medium leading-normal">
                      Your message will be dispatched via **Email** to all {selectedIds.size} selected targets. This action is irreversible once initiated.
                    </p>
                 </div>

                 <button 
                  onClick={handleSend}
                  disabled={sending || selectedIds.size === 0}
                  className="w-full h-12 rounded-xl bg-primary-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-primary-600/30 hover:bg-primary-700 transition-all disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0"
                 >
                   {sending ? 'In Transit...' : (
                      <>Push Broadcast <Send size={16} /></>
                   )}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* History Modal */}
      <Modal 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        title="Recent Broadcast Operations"
        size="lg"
      >
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar divide-y divide-gray-100">
           {history.length === 0 ? (
             <div className="p-20 text-center text-gray-500 italic text-sm">No notification history found.</div>
           ) : (
             history.map(item => (
               <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                     <div className="text-sm font-bold text-zinc-900">{item.subject}</div>
                     <div className="text-[10px] font-bold text-gray-400">{new Date(item.createdAt).toLocaleString()}</div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-2 italic">"{item.message}"</p>
                  <div className="flex flex-wrap gap-2">
                     <span className="px-2 py-0.5 bg-zinc-100 rounded text-[9px] font-black text-zinc-900 uppercase tracking-widest">{item.recipients.length} Recipients</span>
                     <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest">
                       {item.recipients.filter(r => r.status === 'sent').length} Sent
                     </span>
                     {item.recipients.some(r => r.status === 'failed') && (
                       <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[9px] font-black uppercase tracking-widest">
                         {item.recipients.filter(r => r.status === 'failed').length} Failed
                       </span>
                     )}
                  </div>
               </div>
             ))
           )}
        </div>
      </Modal>
    </div>
  )
}

export default Notifications
