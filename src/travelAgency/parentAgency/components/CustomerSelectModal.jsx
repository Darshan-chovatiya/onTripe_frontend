import { useState, useEffect, useRef } from 'react'
import { X, Search, Loader2, Send, Image as ImageIcon, MessageSquare } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'
import { getVendorCustomersForAgent, getAgentVendorChat, sendAgentVendorMessage } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'

const BASE_IMG_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'

export default function CustomerSelectModal({ isOpen, onClose, vendor }) {
  // Customers State
  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Chat State
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loadingChat, setLoadingChat] = useState(false)
  const [sending, setSending] = useState(false)
  
  const messagesEndRef = useRef(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      if (vendor?._id) {
        setLoadingChat(true)
        fetchMessages()
        const interval = setInterval(fetchMessages, 5000)
        return () => clearInterval(interval)
      }
    }
  }, [isOpen, vendor])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchCustomers = async () => {
    if (!vendor?._id) return;
    setLoadingCustomers(true)
    try {
      const res = await getVendorCustomersForAgent(vendor._id)
      if (res.data?.success) {
        setCustomers(res.data.data.customers || [])
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    } finally {
      setLoadingCustomers(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await getAgentVendorChat(vendor._id)
      if (res.data?.success) {
        setMessages(res.data.data.messages)
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setLoadingChat(false)
    }
  }

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer)
    setNewMessage(`Please initiate a chat with Customer: ${customer.name} (Phone: ${customer.phone})`)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() && !imageFile) return

    setSending(true)
    try {
      const formData = new FormData()
      if (newMessage.trim()) formData.append('message', newMessage)
      if (imageFile) formData.append('image', imageFile)

      const res = await sendAgentVendorMessage(vendor._id, formData)
      if (res.data?.success) {
        setMessages(prev => [...prev, res.data.data.message])
        setNewMessage('')
        setImageFile(null)
        setImagePreview(null)
        setSelectedCustomer(null) // Optional: unselect customer after sending
      }
    } catch (err) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const filtered = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search)
  )

  if (!isOpen || !vendor) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Customer to Vendor: ${vendor.name}`} size="4xl">
      <div className="h-[600px] max-h-[80vh] flex overflow-hidden rounded-2xl border border-gray-200">
        
        {/* Sidebar - Customer List */}
        <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="font-bold text-gray-900 mb-2">Customers</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-2">Select a customer to assign them to {vendor.name}.</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingCustomers ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No customers found.</div>
            ) : (
              filtered.map((customer) => {
                const isActive = selectedCustomer?._id === customer._id
                return (
                  <button
                    key={customer._id}
                    onClick={() => handleSelectCustomer(customer)}
                    className={`w-full text-left p-4 border-b border-gray-100 transition-colors hover:bg-white ${isActive ? 'bg-white border-l-4 border-l-primary-500' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold uppercase shrink-0">
                        {customer.name?.charAt(0) || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{customer.name}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {customer.phone} {customer.email && `• ${customer.email}`}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Main Area - Agent-Vendor Chat */}
        <div className="flex-1 bg-white flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col justify-center">
            <h3 className="font-bold text-gray-900">Chat with {vendor.name}</h3>
            <p className="text-xs text-gray-500">Send customer details directly to the vendor.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {loadingChat ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare size={40} className="mb-2 opacity-20" />
                <p className="text-sm">Start a conversation with {vendor.name}!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMine = msg.senderType === 'ParentAgent'
                return (
                  <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        {isMine ? 'You (Agency)' : vendor.name}
                      </span>
                    </div>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      isMine ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.imageUrl && (
                        <img 
                          src={`${BASE_IMG_URL}/${msg.imageUrl.replace(/\\/g, '/')}`} 
                          alt="attachment" 
                          className="rounded-lg mb-2 max-w-full h-auto object-cover"
                          style={{ maxHeight: '200px' }}
                        />
                      )}
                      {msg.message && <p className="text-sm whitespace-pre-wrap">{msg.message}</p>}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
            {imagePreview && (
              <div className="relative inline-block mb-3">
                <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                <button 
                  type="button" 
                  onClick={() => { setImageFile(null); setImagePreview(null); }} 
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <label className="shrink-0 p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl cursor-pointer transition-colors">
                <ImageIcon size={20} />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={selectedCustomer ? `Sending context for ${selectedCustomer.name}...` : "Select a customer or type a message..."}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              <button
                type="submit"
                disabled={sending || (!newMessage.trim() && !imageFile)}
                className="shrink-0 p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </form>
        </div>

      </div>
    </Modal>
  )
}
