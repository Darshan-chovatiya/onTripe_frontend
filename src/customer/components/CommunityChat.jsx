import { useEffect, useState, useRef } from 'react'
import {
  Send,
  Image as ImageIcon,
  Paperclip,
  Smile,
  MoreVertical,
  X,
  Loader2,
  User as UserIcon,
  ShieldCheck,
  Check,
  Clock,
  Camera
} from 'lucide-react'
import { io } from 'socket.io-client'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5001'
const BASE_IMG_URL = SOCKET_URL

export default function CommunityChat({ packageId, customerId }) {
  const { toast } = useToast()
  const [community, setCommunity] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)

  const fetchCommunity = async () => {
    try {
      const { data } = await axiosInstance.get(`/community/package/${packageId}`)
      if (data?.success) {
        setCommunity(data.data.community)
        fetchMessages(data.data.community._id)
        setupSocket(data.data.community._id)
      }
    } catch (err) {
      toast.error('Could not join community chat')
      setLoading(false)
    }
  }

  const fetchMessages = async (communityId) => {
    try {
      const { data } = await axiosInstance.get(`/community/${communityId}/messages?limit=100`)
      if (data?.success) {
        setMessages(data.data.messages)
      }
    } catch (err) {
      console.error('Failed to fetch messages', err)
    } finally {
      setLoading(false)
    }
  }

  const setupSocket = (communityId) => {
    if (socketRef.current) socketRef.current.disconnect()
    
    socketRef.current = io(SOCKET_URL)
    socketRef.current.emit('join_community', communityId)

    socketRef.current.on('new_message', (msg) => {
      setMessages(prev => {
        // Prevent duplicates if we get live update for our own message
        if (prev.find(p => p._id === msg._id)) return prev
        return [...prev, msg]
      })
    })

    socketRef.current.on('error', (err) => {
      toast.error(err)
    })
  }

  useEffect(() => {
    fetchCommunity()
    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [packageId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || isSending) return

    const content = inputText.trim()
    setInputText('')
    setIsSending(true)

    try {
      // Optimistically we could add it, but backend emits back to us.
      // However, we rely on the backend response to confirm creation.
      const { data } = await axiosInstance.post(`/community/${community._id}/messages`, { content })
      if (!data?.success) {
        toast.error('Message failed to send')
      }
    } catch (err) {
      toast.error('Network error')
    } finally {
      setIsSending(false)
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingImages(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('caption', '') // Optional caption could be implemented

        await axiosInstance.post(`/community/${community._id}/messages/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      toast.success(`${files.length} image(s) shared!`)
    } catch (err) {
      toast.error('Image upload failed')
    } finally {
      setUploadingImages(false)
      e.target.value = null // clear input
    }
  }

  if (loading) return <div className="flex flex-col items-center justify-center p-20 animate-pulse"><Loader2 className="animate-spin text-primary-500 mb-4" size={40} /><p className="text-sm font-black uppercase tracking-widest text-gray-400">Opening Community Vault...</p></div>

  if (!community) return (
    <div className="p-20 text-center bg-white rounded-[3rem] border border-gray-100 flex flex-col items-center">
       <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6"><Paperclip className="text-gray-300" /></div>
       <h3 className="text-xl font-black text-gray-900 mb-2">Private Community</h3>
       <p className="text-gray-500 max-w-xs mx-auto">This group is reserved for travelers on this specific itinerary.</p>
    </div>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl shadow-gray-100/50 border border-gray-50 dark:border-white/5 overflow-hidden flex flex-col h-[700px] max-w-5xl mx-auto animate-fade-in relative">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-50 dark:border-white/5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md flex items-center justify-between z-10">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-200">
               <ImageIcon size={20} strokeWidth={2.5} />
            </div>
            <div>
               <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{community.package?.title} Squad</h3>
               <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {community.agentMembers.length + community.customerMembers.length} Active Explorers
               </div>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button className="p-3 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors"><ShieldCheck size={20} /></button>
            <button className="p-3 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors"><MoreVertical size={20} /></button>
         </div>
      </div>

      {/* Message List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-gray-50/30 dark:bg-transparent"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center"><Smile size={40} /></div>
             <p className="text-xs font-black uppercase tracking-[.2em]">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender?._id === customerId || (typeof msg.sender === 'string' && msg.sender === customerId)
            const senderName = msg.sender?.name || 'Explorer'
            const senderInfo = msg.senderType === 'User' ? (msg.sender?.role || 'Agent') : 'Traveler'
            const showAvatar = idx === 0 || messages[idx-1].sender?._id !== msg.sender?._id

            return (
              <div key={msg._id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {!isMe && (
                  <div className={`w-8 h-8 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[10px] font-black text-primary-500 shrink-0 ${!showAvatar && 'opacity-0'}`}>
                    {senderName.charAt(0)}
                  </div>
                )}

                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && (
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 flex gap-2 items-center">
                       {senderName} 
                       <span className={`px-1.5 py-0.5 rounded text-[8px] border ${msg.senderType === 'User' ? 'text-primary-600 bg-primary-50 border-primary-100' : 'text-gray-400 bg-gray-100 border-gray-200'}`}>
                         {senderInfo}
                       </span>
                    </span>
                  )}
                  
                  <div className={`
                    p-4 rounded-3xl shadow-sm text-sm font-medium leading-relaxed
                    ${isMe 
                      ? 'bg-primary-600 text-white rounded-br-none shadow-primary-100' 
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none border border-gray-100 dark:border-white/5'}
                  `}>
                    {msg.type === 'image' ? (
                      <div className="space-y-2">
                        <img 
                          src={`${BASE_IMG_URL}/${msg.imageUrl}`} 
                          alt="shared" 
                          className="rounded-2xl max-h-96 w-auto object-cover border border-black/5"
                        />
                        {msg.content && <p>{msg.content}</p>}
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-1.5 px-1 opacity-40">
                     <span className="text-[9px] font-bold">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     {isMe && <Check size={10} />}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-white/5">
         <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <div className="relative">
               <input 
                 type="file" 
                 id="chat-images" 
                 multiple 
                 accept="image/*" 
                 onChange={handleImageUpload}
                 className="hidden" 
               />
               <label 
                 htmlFor="chat-images"
                 className={`p-4 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${uploadingImages ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-primary-500 hover:bg-primary-50'}`}
               >
                 {uploadingImages ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
               </label>
            </div>
            
            <div className="flex-1 relative group">
               <input 
                 type="text" 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 placeholder="Pulse check... Type something cool"
                 className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary-500 rounded-3xl py-4 pl-6 pr-14 transition-all text-sm font-bold text-gray-900 dark:text-white"
               />
               <button 
                 type="submit"
                 disabled={!inputText.trim() || isSending}
                 className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-2xl transition-all ${!inputText.trim() || isSending ? 'text-gray-300' : 'bg-primary-600 text-white shadow-lg shadow-primary-200'}`}
               >
                 {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} strokeWidth={2.5} />}
               </button>
            </div>
         </form>
      </div>
    </div>
  )
}
