import { useState, useEffect } from 'react'
import { X, Loader2, User as UserIcon, Calendar } from 'lucide-react'
import { getVendorCustomerChatsForAgent } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import Modal from '@/shared/components/Modal.jsx'

const BASE_IMG_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'

export default function VendorCustomerChatsViewerModal({ isOpen, onClose, vendor }) {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState(null)

  useEffect(() => {
    if (isOpen && vendor?._id) {
      fetchChats()
    }
  }, [isOpen, vendor])

  const fetchChats = async () => {
    setLoading(true)
    try {
      const res = await getVendorCustomerChatsForAgent(vendor._id)
      if (res.data?.success) {
        setChats(res.data.data.chats || [])
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !vendor) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Customer Chats: ${vendor.name}`} size="4xl">
      <div className="h-[600px] max-h-[80vh] flex overflow-hidden rounded-2xl border border-gray-200">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="font-bold text-gray-900">Conversations</h3>
            <p className="text-xs text-gray-500">{chats.length} active chats</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" /></div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No customer chats found for this vendor.</div>
            ) : (
              chats.map((chat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full text-left p-4 border-b border-gray-100 transition-colors hover:bg-white ${selectedChat?.customer?._id === chat.customer._id ? 'bg-white border-l-4 border-l-primary-500' : ''}`}
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
        <div className="flex-1 bg-white flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <UserIcon className="text-gray-400" />
                <div>
                  <p className="font-bold text-gray-900">{selectedChat.customer.name}</p>
                  <p className="text-xs text-gray-500">{selectedChat.customer.phone} • {selectedChat.customer.email}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                {selectedChat.messages.map((msg, idx) => {
                  const isVendor = msg.senderType === 'Vendor'
                  return (
                    <div key={idx} className={`flex flex-col ${isVendor ? 'items-end' : 'items-start'}`}>
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase text-gray-400">
                          {isVendor ? vendor.name : selectedChat.customer.name}
                        </span>
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        isVendor ? 'bg-gray-800 text-white rounded-tr-sm' : 'bg-primary-600 text-white rounded-tl-sm shadow-sm'
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
                        {new Date(msg.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm flex-col gap-3">
              <UserIcon size={48} className="text-gray-200" />
              Select a conversation to view messages
            </div>
          )}
        </div>

      </div>
    </Modal>
  )
}
