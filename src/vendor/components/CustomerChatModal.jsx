import { useState, useEffect, useRef } from 'react'
import { X, Send, Image as ImageIcon, Loader2 } from 'lucide-react'
import { getCustomerChatMessages, sendCustomerChatMessage } from '@/vendor/services/vendorApi.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'

const BASE_IMG_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'

export default function CustomerChatModal({ isOpen, onClose, bookingId, customer }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && bookingId && customer?.id) {
      fetchMessages()
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen, bookingId, customer])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await getCustomerChatMessages(bookingId, customer.id)
      if (res.data?.success) {
        setMessages(res.data.data.messages)
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setLoading(false)
    }
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
      formData.append('customerId', customer.id)
      if (newMessage.trim()) formData.append('message', newMessage)
      if (imageFile) formData.append('image', imageFile)

      const res = await sendCustomerChatMessage(bookingId, formData)
      if (res.data?.success) {
        setMessages(prev => [...prev, res.data.data.message])
        setNewMessage('')
        setImageFile(null)
        setImagePreview(null)
      }
    } catch (err) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen || !customer) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold uppercase">
              {customer.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{customer.name || 'Customer'}</h3>
              <p className="text-xs text-gray-500">Customer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-sm">Say hi to {customer.name || 'the customer'}!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.senderType === 'Vendor'
              return (
                <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
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

        {/* Input */}
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
              placeholder="Type a message..."
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
  )
}
