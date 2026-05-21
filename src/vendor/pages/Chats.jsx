import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { findVendorChatByParams } from '@/shared/utils/vendorChatDeepLink.js'
import { Send, Image as ImageIcon, Loader2, MessageSquare, Building2, Calendar, X } from 'lucide-react'
import {
  getAllCustomerChats,
  getCustomerChatMessages,
  sendCustomerChatMessage,
  getAgentChatMessages,
  sendAgentChatMessage,
} from '@/vendor/services/vendorApi.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'

const BASE_IMG_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'

function ChatBubble({ msg, isMine }) {
  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
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
}

function ChatComposer({ onSend, sending, placeholder = 'Type a message...' }) {
  const [newMessage, setNewMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() && !imageFile) return
    const formData = new FormData()
    if (newMessage.trim()) formData.append('message', newMessage)
    if (imageFile) formData.append('image', imageFile)
    const ok = await onSend(formData)
    if (ok) {
      setNewMessage('')
      setImageFile(null)
      setImagePreview(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white">
      {imagePreview && (
        <div className="relative inline-block mb-3">
          <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
          <button
            type="button"
            onClick={() => { setImageFile(null); setImagePreview(null) }}
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
          placeholder={placeholder}
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
  )
}

export default function VendorChats() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'agent' ? 'agent' : 'customers'

  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [agentMessages, setAgentMessages] = useState([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const deepLinkHandledRef = useRef(false)

  const setTab = (t) => {
    setSearchParams(t === 'agent' ? { tab: 'agent' } : {})
    setSelectedChat(null)
    setMessages([])
    deepLinkHandledRef.current = false
  }

  const clearDeepLinkParams = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete('booking')
    next.delete('customer')
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const fetchChats = useCallback(async () => {
    try {
      const res = await getAllCustomerChats()
      if (res.data?.success) setChats(res.data.data.chats || [])
    } catch {
      console.error('Failed to fetch customer chats')
    } finally {
      setLoadingChats(false)
    }
  }, [])

  const openChatFromParams = useCallback(
    async (bookingParam, customerParam) => {
      try {
        const res = await getCustomerChatMessages(bookingParam, customerParam)
        if (!res.data?.success) return false
        const msgs = res.data.data.messages || []
        const bookingMeta = res.data.data.booking
        const customerFromMsg = msgs.find((m) => m.customer)?.customer
        setSelectedChat({
          customer: {
            _id: customerParam,
            name: customerFromMsg?.name || 'Customer',
            phone: customerFromMsg?.phone,
          },
          booking: bookingMeta
            ? { _id: bookingMeta._id, bookingId: bookingMeta.bookingId }
            : { _id: bookingParam, bookingId: bookingParam },
          messages: msgs,
        })
        setMessages(msgs)
        return true
      } catch {
        return false
      }
    },
    []
  )

  const applyNotificationDeepLink = useCallback(async () => {
    if (deepLinkHandledRef.current || tab !== 'customers') return

    const bookingParam = searchParams.get('booking')
    const customerParam = searchParams.get('customer')
    if (!bookingParam || !customerParam) return

    const match = findVendorChatByParams(chats, bookingParam, customerParam)
    if (match) {
      deepLinkHandledRef.current = true
      setSelectedChat(match)
      clearDeepLinkParams()
      return
    }

    if (!loadingChats) {
      const opened = await openChatFromParams(bookingParam, customerParam)
      if (opened) {
        deepLinkHandledRef.current = true
        clearDeepLinkParams()
        fetchChats()
      }
    }
  }, [
    tab,
    chats,
    loadingChats,
    searchParams,
    clearDeepLinkParams,
    openChatFromParams,
    fetchChats,
  ])

  const fetchCustomerMessages = useCallback(async (customerId, bookingId, silent = false) => {
    if (!silent) setLoadingMessages(true)
    try {
      const res = await getCustomerChatMessages(bookingId, customerId)
      if (res.data?.success) setMessages(res.data.data.messages || [])
    } catch {
      console.error('Failed to fetch messages')
    } finally {
      if (!silent) setLoadingMessages(false)
    }
  }, [])

  const fetchAgentMessages = useCallback(async (silent = false) => {
    if (!silent) setLoadingMessages(true)
    try {
      const res = await getAgentChatMessages()
      if (res.data?.success) setAgentMessages(res.data.data.messages || [])
    } catch {
      console.error('Failed to fetch agent messages')
    } finally {
      if (!silent) setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'customers') {
      fetchChats()
      const interval = setInterval(fetchChats, 7000)
      return () => clearInterval(interval)
    }
    return undefined
  }, [tab, fetchChats])

  useEffect(() => {
    applyNotificationDeepLink()
  }, [applyNotificationDeepLink])

  const bookingDeepLink = searchParams.get('booking')
  const customerDeepLink = searchParams.get('customer')

  useEffect(() => {
    deepLinkHandledRef.current = false
  }, [bookingDeepLink, customerDeepLink])

  useEffect(() => {
    if (tab !== 'customers' || !selectedChat) return undefined
    const customerId = selectedChat.customer._id
    const bookingId = selectedChat.booking._id
    fetchCustomerMessages(customerId, bookingId)
    const interval = setInterval(() => fetchCustomerMessages(customerId, bookingId, true), 4000)
    return () => clearInterval(interval)
  }, [tab, selectedChat, fetchCustomerMessages])

  useEffect(() => {
    if (tab !== 'agent') return undefined
    fetchAgentMessages()
    const interval = setInterval(() => fetchAgentMessages(true), 5000)
    return () => clearInterval(interval)
  }, [tab, fetchAgentMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, agentMessages])

  const handleSendCustomer = async (formData) => {
    if (!selectedChat) return false
    setSending(true)
    try {
      formData.append('customerId', selectedChat.customer._id)
      const res = await sendCustomerChatMessage(selectedChat.booking._id, formData)
      if (res.data?.success) {
        setMessages((prev) => [...prev, res.data.data.message])
        fetchChats()
        return true
      }
      toast.error('Failed to send message')
      return false
    } catch {
      toast.error('Failed to send message')
      return false
    } finally {
      setSending(false)
    }
  }

  const handleSendAgent = async (formData) => {
    setSending(true)
    try {
      const res = await sendAgentChatMessage(formData)
      if (res.data?.success) {
        setAgentMessages((prev) => [...prev, res.data.data.message])
        return true
      }
      toast.error('Failed to send message')
      return false
    } catch {
      toast.error('Failed to send message')
      return false
    } finally {
      setSending(false)
    }
  }

  const activeMessages = tab === 'agent' ? agentMessages : messages

  return (
    <div className="max-w-6xl mx-auto px-4 pb-32 pt-6">
      <div className="mb-6 border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Messages</h1>
        <p className="text-gray-500 font-medium mt-1">Chat with customers and your travel agency.</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab('customers')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            tab === 'customers' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MessageSquare size={16} /> Customer Chats
        </button>
        <button
          type="button"
          onClick={() => setTab('agent')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            tab === 'agent' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Building2 size={16} /> Agency Chat
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[520px] max-h-[calc(100vh-220px)]">
        {tab === 'customers' && (
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="font-bold text-gray-900">Conversations</h3>
              <p className="text-xs text-gray-500">{chats.length} active</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingChats ? (
                <div className="flex justify-center p-8"><Loader size="md" /></div>
              ) : chats.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No customer chats yet. Start from your schedule.</div>
              ) : (
                chats.map((chat, idx) => {
                  const isActive = selectedChat?.customer?._id === chat.customer._id && selectedChat?.booking?._id === chat.booking._id
                  const last = chat.messages?.[chat.messages.length - 1]
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedChat(chat)
                        setMessages([])
                      }}
                      className={`w-full text-left p-4 border-b border-gray-100 transition-colors hover:bg-white ${isActive ? 'bg-white border-l-4 border-l-primary-500' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold uppercase shrink-0">
                          {chat.customer.name?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">{chat.customer.name}</p>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                            <Calendar size={10} /> {chat.booking?.bookingId || 'Booking'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {last?.message || (last?.imageUrl ? 'Image' : 'No messages')}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {tab === 'agent' ? (
            <>
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <p className="font-bold text-gray-900">Travel Agency</p>
                <p className="text-xs text-gray-500">Direct line to your parent agent</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {loadingMessages && agentMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary-500" /></div>
                ) : agentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">Say hi to your agency!</div>
                ) : (
                  agentMessages.map((msg, idx) => (
                    <ChatBubble key={idx} msg={msg} isMine={msg.senderType === 'Vendor'} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <ChatComposer onSend={handleSendAgent} sending={sending} placeholder="Message your agency..." />
            </>
          ) : selectedChat ? (
            <>
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <p className="font-bold text-gray-900">{selectedChat.customer.name}</p>
                <p className="text-xs text-gray-500">
                  {selectedChat.customer.phone} · Booking {selectedChat.booking?.bookingId}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary-500" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                    Say hi to {selectedChat.customer.name}!
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <ChatBubble key={idx} msg={msg} isMine={msg.senderType === 'Vendor'} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <ChatComposer onSend={handleSendCustomer} sending={sending} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm flex-col gap-3 p-8">
              <MessageSquare size={48} className="text-gray-200" />
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
