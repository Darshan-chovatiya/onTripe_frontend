import { useState, useEffect, useRef } from 'react'
import { X, Send, Image as ImageIcon, Loader2, Calendar, MessageSquare, ChevronLeft } from 'lucide-react'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import ChatImagePreview from '@/shared/components/ChatImagePreview.jsx'

const BASE_IMG_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'

function chatImageSrc(imageUrl) {
  return `${BASE_IMG_URL}/${String(imageUrl).replace(/\\/g, '/')}`
}

export default function VendorAllCustomerChatsModal({ isOpen, onClose }) {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [fullPreviewSrc, setFullPreviewSrc] = useState(null)
  const messagesEndRef = useRef(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!isOpen) {
      setFullPreviewSrc(null)
      return undefined
    }
    if (isOpen) {
      fetchChats()
      const interval = setInterval(fetchChats, 7000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  useEffect(() => {
    let interval;
    if (isOpen && selectedChat) {
      fetchMessages(selectedChat.customer._id, selectedChat.booking._id)
      interval = setInterval(() => {
        fetchMessages(selectedChat.customer._id, selectedChat.booking._id, true)
      }, 4000)
    }
    return () => clearInterval(interval)
  }, [isOpen, selectedChat])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const fetchChats = async () => {
    try {
      const res = await axiosInstance.get('/vendor/customer-chats')
      if (res.data?.success) {
        setChats(res.data.data.chats || [])
      }
    } catch (err) {
      console.error('Failed to fetch customer chats list:', err)
    } finally {
      setLoadingChats(false)
    }
  }

  const fetchMessages = async (customerId, bookingId, isSilent = false) => {
    if (!isSilent) setLoadingMessages(true)
    try {
      const res = await axiosInstance.get(`/vendor/chat/${bookingId}?customerId=${customerId}`)
      if (res.data?.success) {
        setMessages(res.data.data.messages || [])
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      if (!isSilent) setLoadingMessages(false)
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
    if (!selectedChat) return

    setSending(true)
    try {
      const formData = new FormData()
      formData.append('customerId', selectedChat.customer._id)
      if (newMessage.trim()) formData.append('message', newMessage)
      if (imageFile) formData.append('image', imageFile)

      const res = await axiosInstance.post(`/vendor/chat/${selectedChat.booking._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data?.success) {
        setMessages(prev => [...prev, res.data.data.message])
        setNewMessage('')
        setImageFile(null)
        setImagePreview(null)
        
        // Refresh chats list to update last message preview
        fetchChats()
      }
    } catch (err) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
    <div className="fixed inset-0 z-[300] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-[min(92dvh,640px)] max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[600px] sm:max-h-[90vh] sm:flex-row sm:rounded-3xl">
        
        {/* Sidebar / Chats List */}
        <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full flex-col border-gray-200 bg-gray-50 md:w-80 md:shrink-0 md:border-r lg:w-96`}>
          <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Customer Chats</h3>
              <p className="text-xs text-gray-500">{chats.length} active chats</p>
            </div>
            <button onClick={onClose} className="sm:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loadingChats ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" /></div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No active customer chats.</div>
            ) : (
              chats.map((chat, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedChat(chat)
                    setMessages([])
                  }}
                  className={`w-full text-left p-4 border-b border-gray-100 transition-colors hover:bg-white ${selectedChat?.customer?._id === chat.customer._id && selectedChat?.booking?._id === chat.booking._id ? 'bg-white border-l-4 border-l-primary-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                      {chat.customer.name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{chat.customer.name}</p>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                        <Calendar size={10} /> Booking: {chat.booking?.bookingId || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {chat.messages[chat.messages.length - 1]?.message || 'Image attachment'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} min-h-0 min-w-0 flex-1 flex-col bg-white`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 p-3 sm:p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedChat(null); setMessages([]) }}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 md:hidden"
                    aria-label="Back to chats"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex min-w-0 items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                    {selectedChat.customer.name?.charAt(0) || 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900">{selectedChat.customer.name}</p>
                    <p className="truncate text-xs text-gray-500">{selectedChat.customer.phone} • Booking: {selectedChat.booking?.bookingId}</p>
                  </div>
                  </div>
                </div>
                <button onClick={onClose} className="hidden sm:block p-2 text-gray-400 hover:bg-gray-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
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
                            <button
                              type="button"
                              onClick={() => setFullPreviewSrc(chatImageSrc(msg.imageUrl))}
                              className="mb-2 block max-w-full cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                            >
                              <img
                                src={chatImageSrc(msg.imageUrl)}
                                alt="attachment"
                                className="max-h-[200px] h-auto w-full rounded-lg object-cover"
                              />
                            </button>
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

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="shrink-0 border-t border-gray-100 bg-white p-3 sm:p-4">
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
            </>
          ) : (
            <div className="hidden flex-1 flex-col items-center justify-center gap-3 text-sm text-gray-400 md:flex">
              <MessageSquare size={48} className="text-gray-200" />
              Select a conversation to view messages
            </div>
          )}
        </div>

      </div>
    </div>
    <ChatImagePreview src={fullPreviewSrc} onClose={() => setFullPreviewSrc(null)} />
    </>
  )
}
