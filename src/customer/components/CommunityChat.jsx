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
  Camera,
  Trash2,
  Users
} from 'lucide-react'
import { io } from 'socket.io-client'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import Modal from '@/shared/components/Modal.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5001'
const BASE_IMG_URL = SOCKET_URL
const PAGE_SIZE = 30

export default function CommunityChat({ packageId, customerId, currentUserId, embedded = false }) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [community, setCommunity] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryPage, setGalleryPage] = useState(1)
  const [galleryHasMore, setGalleryHasMore] = useState(true)
  const [galleryLoadingMore, setGalleryLoadingMore] = useState(false)
  const [previewSrc, setPreviewSrc] = useState(null)
  const [membersOpen, setMembersOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [openMenuFor, setOpenMenuFor] = useState(null) // messageId
  const [confirmDelete, setConfirmDelete] = useState({ open: false, msg: null })
  const scrollRef = useRef(null)
  const socketRef = useRef(null)
  const suppressAutoScrollRef = useRef(false)

  const selfId = currentUserId || customerId || user?.id
  const isAdmin = user?.role === 'admin'

  const fetchCommunity = async () => {
    try {
      const { data } = await axiosInstance.get(`/community/package/${packageId}`)
      if (data?.success) {
        setCommunity(data.data.community)
        setMessages([])
        setPage(1)
        setHasMore(true)
        await fetchMessages(data.data.community._id, { page: 1, mode: 'replace' })
        setupSocket(data.data.community._id)
      }
    } catch (err) {
      toast.error('Could not join community chat')
      setLoading(false)
    }
  }

  const fetchMessages = async (communityId, { page: pageNum = 1, mode = 'replace' } = {}) => {
    try {
      const { data } = await axiosInstance.get(`/community/${communityId}/messages`, {
        params: { limit: PAGE_SIZE, page: pageNum },
      })
      if (data?.success) {
        const next = data.data.messages || []
        setHasMore(next.length >= PAGE_SIZE)
        if (mode === 'prepend') {
          setMessages((prev) => [...next, ...prev])
        } else if (mode === 'append') {
          setMessages((prev) => [...prev, ...next])
        } else {
          setMessages(next)
        }
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

    socketRef.current.on('message_deleted', ({ messageId }) => {
      if (!messageId) return
      setMessages(prev => prev.filter(m => m._id !== messageId))
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
      if (!suppressAutoScrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
      suppressAutoScrollRef.current = false
    }
  }, [messages])

  useEffect(() => {
    const onDocClick = () => setOpenMenuFor(null)
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

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

  const fetchGallery = async (pageNum = 1, append = false) => {
    if (!community?._id) return
    if (append) setGalleryLoadingMore(true)
    else setGalleryLoading(true)

    try {
      const { data } = await axiosInstance.get(`/community/${community._id}/images`, {
        params: { page: pageNum, limit: 12 }
      })
      if (data?.success) {
        const newImages = data.data.images || []
        if (append) {
          setGalleryImages(prev => [...prev, ...newImages])
        } else {
          setGalleryImages(newImages)
        }
        setGalleryPage(pageNum)
        setGalleryHasMore(newImages.length === 12 && pageNum < (data.data.pagination?.totalPages || 1))
      } else {
        toast.error('Could not load gallery')
      }
    } catch (err) {
      toast.error('Could not load gallery')
    } finally {
      setGalleryLoading(false)
      setGalleryLoadingMore(false)
    }
  }

  const openGallery = async () => {
    setGalleryOpen(true)
    if (galleryImages.length === 0) {
      await fetchGallery(1, false)
    }
  }

  const closeGallery = () => {
    setGalleryOpen(false)
    setPreviewSrc(null)
  }

  const handleDeleteMessage = async (msg) => {
    if (!community?._id || !msg?._id) return
    const ownerMatch = selfId && (msg.sender?._id === selfId || (typeof msg.sender === 'string' && msg.sender === selfId))
    if (!ownerMatch && !isAdmin) return

    // Optimistic remove
    setMessages(prev => prev.filter(m => m._id !== msg._id))
    try {
      const { data } = await axiosInstance.delete(`/community/${community._id}/messages/${msg._id}`)
      if (!data?.success) {
        toast.error('Could not delete message')
        await fetchMessages(community._id, { page: 1, mode: 'replace' })
      }
    } catch (err) {
      toast.error('Could not delete message')
      await fetchMessages(community._id, { page: 1, mode: 'replace' })
    }
  }

  const loadOlder = async () => {
    if (!community?._id || loadingMore || !hasMore) return
    const el = scrollRef.current
    if (!el) return

    setLoadingMore(true)
    suppressAutoScrollRef.current = true
    const prevScrollHeight = el.scrollHeight
    const prevScrollTop = el.scrollTop
    const nextPage = page + 1

    try {
      await fetchMessages(community._id, { page: nextPage, mode: 'prepend' })
      setPage(nextPage)
      // Preserve viewport position after prepending
      requestAnimationFrame(() => {
        const newScrollHeight = el.scrollHeight
        el.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight)
      })
    } finally {
      setLoadingMore(false)
    }
  }

  const onScroll = async () => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop <= 40) {
      await loadOlder()
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

  const shellClass = embedded
    ? 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col h-[min(65vh,560px)] w-full max-w-full mx-0 animate-fade-in relative'
    : 'bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl shadow-gray-100/50 border border-gray-50 dark:border-white/5 overflow-hidden flex flex-col h-[700px] max-w-5xl mx-auto animate-fade-in relative'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl shadow-gray-100/50 border border-gray-50 dark:border-white/5 overflow-hidden flex flex-col animate-fade-in relative">
      
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
            <button
              type="button"
              onClick={() => setMembersOpen(true)}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors inline-flex items-center gap-2"
            >
              <Users size={14} />
              Members
            </button>
            <button
              type="button"
              onClick={openGallery}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Gallery
            </button>
         </div>
      </div>

      {/* Message List */}
      <div 
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-hide bg-gray-50/30 dark:bg-transparen  max-h-[500px] overflow-auto"
      >
        {loadingMore && (
          <div className="sticky top-0 z-10 -mt-2 pb-2">
            <div className="mx-auto w-fit rounded-full bg-white/80 backdrop-blur border border-gray-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Loader2 className="animate-spin" size={12} />
              Loading older…
            </div>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center"><Smile size={40} /></div>
             <p className="text-xs font-black uppercase tracking-[.2em]">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = selfId && (msg.sender?._id === selfId || (typeof msg.sender === 'string' && msg.sender === selfId))
            const senderName = msg.sender?.name || 'Explorer'
            const senderInfo = msg.senderType === 'User' ? (msg.sender?.role || 'Agent') : 'Traveler'
            const showAvatar = idx === 0 || messages[idx-1].sender?._id !== msg.sender?._id
            const canDelete = Boolean(isMe || isAdmin)

            return (
              <div key={msg._id} className={`group flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {!isMe && (
                  <div className={`w-8 h-8 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[10px] font-black text-primary-500 shrink-0 ${!showAvatar && 'opacity-0'}`}>
                    {senderName.charAt(0)}
                  </div>
                )}

                {/* Side actions (outside bubble) */}
                {canDelete ? (
                  <div className={`relative ${isMe ? 'mr-1' : 'ml-1'} self-center`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuFor((prev) => (prev === msg._id ? null : msg._id))
                      }}
                      className={`transition-opacity p-2 rounded-2xl border border-transparent hover:border-gray-200 hover:bg-white shadow-sm`}
                      aria-label="Message actions"
                    >
                      <MoreVertical size={16} className="text-gray-500" />
                    </button>

                    {openMenuFor === msg._id ? (
                      <div
                        className={`absolute z-30 ${isMe ? 'right-0' : 'left-0'} mt-2 w-44 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuFor(null)
                            setConfirmDelete({ open: true, msg })
                          }}
                          className="w-full px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

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
                          className="rounded-2xl max-h-96 w-auto object-cover border border-black/5 cursor-pointer"
                          onClick={() => setPreviewSrc(`${BASE_IMG_URL}/${msg.imageUrl}`)}
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

      <Modal
        isOpen={galleryOpen}
        onClose={closeGallery}
        title="Community gallery"
        size="xl"
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">All photos shared in this community</p>
            <p className="text-sm font-semibold text-gray-900">{galleryImages.length} image(s)</p>
          </div>
          <button
            type="button"
            onClick={fetchGallery}
            disabled={galleryLoading}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {galleryLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
              <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-600" size={24} />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-gray-400">Curating Gallery...</p>
          </div>
        ) : galleryImages.length === 0 ? (
          <div className="py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
             <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Camera size={32} />
             </div>
             <p className="text-sm font-black text-gray-800 uppercase tracking-tight">No shots yet</p>
             <p className="text-xs text-gray-400 mt-2 max-w-[200px] mx-auto">Be the first to share a moment in the community chat!</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="columns-2 sm:columns-3 md:columns-4 gap-4 [column-fill:_balance]">
              {galleryImages.map((img) => {
                const src = `${BASE_IMG_URL}/${img.imageUrl}`
                return (
                  <div key={img._id} className="break-inside-avoid mb-4 group">
                    <button
                      type="button"
                      onClick={() => setPreviewSrc(src)}
                      className="relative w-full overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      title={img.caption || 'View full size'}
                    >
                      <img
                        src={src}
                        alt={img.caption || 'community'}
                        className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-end p-4">
                         {img.caption && (
                           <p className="text-white text-[10px] font-bold mt-auto line-clamp-2">{img.caption}</p>
                         )}
                      </div>
                    </button>
                    <div className="mt-2 px-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                       <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400 italic">@{img.uploader?.name?.split(' ')[0] || 'Explorer'}</span>
                       <span className="text-[9px] font-bold text-gray-300">{new Date(img.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {galleryHasMore && (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => fetchGallery(galleryPage + 1, true)}
                  disabled={galleryLoadingMore}
                  className="group relative px-8 py-4 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-primary-100/30 hover:border-primary-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    {galleryLoadingMore ? (
                      <Loader2 className="animate-spin text-primary-600" size={18} />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                         <span className="text-lg leading-none">+</span>
                      </div>
                    )}
                    <span className="text-[11px] font-black uppercase tracking-[.2em] text-gray-600 group-hover:text-primary-600 transition-colors">
                      {galleryLoadingMore ? 'Loading Vibe...' : 'Load More Magic'}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {previewSrc && (
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewSrc(null)}>
            <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black uppercase tracking-widest text-white/70">Preview</p>
                <button type="button" onClick={() => setPreviewSrc(null)} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20">
                  <X size={18} />
                </button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/60 p-2">
                <img src={previewSrc} alt="preview" className="max-h-[75vh] w-full object-contain rounded-xl" />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={membersOpen}
        onClose={() => {
          setMembersOpen(false)
          setMemberSearch('')
        }}
        title="Community members"
        size="lg"
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold text-gray-900">{(community?.agentMembers?.length || 0) + (community?.customerMembers?.length || 0)}</span>
            </div>
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members…"
              className="input-field sm:w-64"
            />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Agents</p>
            {(community?.agentMembers || []).filter((m) => {
              if (!memberSearch.trim()) return true
              const q = memberSearch.toLowerCase()
              return (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q) || String(m.phone || '').includes(memberSearch)
            }).length ? (
              <ul className="space-y-2">
                {community.agentMembers
                  .filter((m) => {
                    if (!memberSearch.trim()) return true
                    const q = memberSearch.toLowerCase()
                    return (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q) || String(m.phone || '').includes(memberSearch)
                  })
                  .map((m) => (
                  <li key={m._id} className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{m.name || '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{m.email || m.phone || '—'}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-primary-100 bg-primary-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-700">
                      {m.role || 'agent'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No agents listed.</p>
            )}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Travelers</p>
            {(community?.customerMembers || []).filter((m) => {
              if (!memberSearch.trim()) return true
              const q = memberSearch.toLowerCase()
              return (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q) || String(m.phone || '').includes(memberSearch)
            }).length ? (
              <ul className="space-y-2">
                {community.customerMembers
                  .filter((m) => {
                    if (!memberSearch.trim()) return true
                    const q = memberSearch.toLowerCase()
                    return (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q) || String(m.phone || '').includes(memberSearch)
                  })
                  .map((m) => (
                  <li key={m._id} className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{m.name || 'Traveler'}</p>
                      <p className="text-xs text-gray-500 truncate">{m.email || m.phone || '—'}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-600">
                      traveler
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No travelers yet.</p>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, msg: null })}
        onConfirm={async () => {
          const msg = confirmDelete.msg
          setConfirmDelete({ open: false, msg: null })
          if (msg) await handleDeleteMessage(msg)
        }}
        title="Delete message?"
        message="This will permanently remove the message for everyone in this community."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
