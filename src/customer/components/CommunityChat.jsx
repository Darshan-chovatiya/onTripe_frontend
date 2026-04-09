import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Send,
  Image as ImageIcon,
  MoreVertical,
  X,
  Loader2,
  Check,
  Camera,
  Trash2,
  Users,
  ChevronLeft,
} from 'lucide-react'
import { io } from 'socket.io-client'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5001'
const BASE_IMG_URL = SOCKET_URL
const PAGE_SIZE = 30

/**
 * @param {'embedded' | 'page'} layout — page: full-height chat shell (WhatsApp-like); embedded: compact card for small embeds
 */
export default function CommunityChat({
  packageId,
  customerId,
  currentUserId,
  layout = 'embedded',
}) {
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
  /** null = main chat; members | gallery = full-panel (in-page, not modal) */
  const [subScreen, setSubScreen] = useState(null)
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryPage, setGalleryPage] = useState(1)
  const [galleryHasMore, setGalleryHasMore] = useState(true)
  const [galleryLoadingMore, setGalleryLoadingMore] = useState(false)
  const [previewSrc, setPreviewSrc] = useState(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [openMenuFor, setOpenMenuFor] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, msg: null })
  const scrollRef = useRef(null)
  const socketRef = useRef(null)
  const suppressAutoScrollRef = useRef(false)

  const selfId = currentUserId || customerId || user?.id
  const isAdmin = user?.role === 'admin'
  const isPage = layout === 'page'

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
      setMessages((prev) => {
        if (prev.find((p) => p._id === msg._id)) return prev
        return [...prev, msg]
      })
    })

    socketRef.current.on('message_deleted', ({ messageId }) => {
      if (!messageId) return
      setMessages((prev) => prev.filter((m) => m._id !== messageId))
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

  const fetchGallery = useCallback(async (pageNum = 1, append = false) => {
    if (!community?._id) return
    if (append) setGalleryLoadingMore(true)
    else setGalleryLoading(true)

    try {
      const { data } = await axiosInstance.get(`/community/${community._id}/images`, {
        params: { page: pageNum, limit: 12 },
      })
      if (data?.success) {
        const newImages = data.data.images || []
        if (append) {
          setGalleryImages((prev) => [...prev, ...newImages])
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
  }, [community?._id, toast])

  useEffect(() => {
    if (subScreen === 'gallery' && community?._id) {
      if (galleryImages.length === 0) fetchGallery(1, false)
    }
  }, [subScreen, community?._id, galleryImages.length, fetchGallery])

  const openGalleryScreen = () => {
    setSubScreen('gallery')
    setPreviewSrc(null)
  }

  const backToChat = () => {
    setSubScreen(null)
    setMemberSearch('')
    setPreviewSrc(null)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || isSending) return

    const content = inputText.trim()
    setInputText('')
    setIsSending(true)

    try {
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
        formData.append('caption', '')

        await axiosInstance.post(`/community/${community._id}/messages/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      toast.success(`${files.length} photo(s) sent`)
    } catch (err) {
      toast.error('Image upload failed')
    } finally {
      setUploadingImages(false)
      e.target.value = null
    }
  }

  const handleDeleteMessage = async (msg) => {
    if (!community?._id || !msg?._id) return
    const ownerMatch =
      selfId && (msg.sender?._id === selfId || (typeof msg.sender === 'string' && msg.sender === selfId))
    if (!ownerMatch && !isAdmin) return

    setMessages((prev) => prev.filter((m) => m._id !== msg._id))
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

  if (loading) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
        <p className="text-sm text-gray-500">Loading chat…</p>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50/50 px-6 py-14 text-center">
        <p className="text-base font-medium text-gray-900">Chat unavailable</p>
        <p className="mt-1 max-w-sm text-sm text-gray-500">You need to be on this trip to use group chat.</p>
      </div>
    )
  }

  const memberTotal =
    (community.agentMembers?.length || 0) + (community.customerMembers?.length || 0)

  const shellClass = isPage
    ? 'flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-gray-950 dark:shadow-none'
    : 'flex h-[min(65vh,560px)] w-full max-w-full flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-gray-950 dark:shadow-none'

  const headerClass =
    'flex h-[52px] shrink-0 items-center gap-2 border-b border-gray-100 bg-white/95 px-2 backdrop-blur-sm dark:border-white/10 dark:bg-gray-950/95 sm:px-3'

  const filterMembers = (list) => {
    if (!memberSearch.trim()) return list
    const q = memberSearch.toLowerCase()
    return list.filter(
      (m) =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        String(m.phone || '').includes(memberSearch)
    )
  }

  return (
    <div className={`${shellClass} animate-fade-in`}>
      {/* Top bar — WhatsApp-style */}
      <header className={headerClass}>
        {subScreen ? (
          <>
            <button
              type="button"
              onClick={backToChat}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10"
              aria-label="Back to chat"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2} />
            </button>
            <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900 dark:text-white">
              {subScreen === 'members' ? 'Group members' : 'Media'}
            </h2>
            {subScreen === 'gallery' ? (
              <button
                type="button"
                onClick={() => fetchGallery(1, false)}
                disabled={galleryLoading}
                className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-primary-700 hover:bg-black/5 disabled:opacity-50 dark:text-primary-400 dark:hover:bg-white/10"
              >
                Refresh
              </button>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-3 pl-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-800 dark:bg-primary-900/60 dark:text-primary-100">
                {(community.package?.title || 'T').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-semibold leading-tight text-gray-900 dark:text-white">
                  {community.package?.title || 'Trip chat'}
                </h3>
                <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                  {memberTotal} participants
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => setSubScreen('members')}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
                title="Members"
                aria-label="Members"
              >
                <Users className="h-5 w-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={openGalleryScreen}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
                title="Media"
                aria-label="Media"
              >
                <ImageIcon className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </>
        )}
      </header>

      {subScreen === 'members' ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-gray-950">
          <div className="sticky top-0 z-[1] border-b border-gray-100 bg-white p-3 dark:border-white/10 dark:bg-gray-950">
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <div className="p-3">
            <p className="mb-2 px-1 text-xs font-medium text-gray-500">Agents</p>
            <ul className="space-y-1">
              {filterMembers(community.agentMembers || []).map((m) => (
                <li
                  key={m._id}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{m.name || '—'}</p>
                    <p className="truncate text-xs text-gray-500">{m.email || m.phone || '—'}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium capitalize text-primary-700 dark:text-primary-400">
                    {(m.role || 'agent').replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mb-2 mt-4 px-1 text-xs font-medium text-gray-500">Travelers</p>
            <ul className="space-y-1">
              {filterMembers(community.customerMembers || []).map((m) => (
                <li
                  key={m._id}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{m.name || 'Traveler'}</p>
                    <p className="truncate text-xs text-gray-500">{m.email || m.phone || '—'}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium text-gray-500">Traveler</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : subScreen === 'gallery' ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 dark:bg-gray-950">
          {galleryLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
              <p className="text-sm text-gray-500">Loading…</p>
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="py-16 text-center">
              <Camera className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">No media yet</p>
            </div>
          ) : (
            <div className="p-2">
              <div className="grid grid-cols-3 gap-0.5 sm:grid-cols-4">
                {galleryImages.map((img) => {
                  const src = `${BASE_IMG_URL}/${img.imageUrl}`
                  return (
                    <button
                      key={img._id}
                      type="button"
                      onClick={() => setPreviewSrc(src)}
                      className="aspect-square overflow-hidden bg-black/5"
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  )
                })}
              </div>
              {galleryHasMore ? (
                <div className="mt-4 flex justify-center pb-4">
                  <button
                    type="button"
                    onClick={() => fetchGallery(galleryPage + 1, true)}
                    disabled={galleryLoadingMore}
                    className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-200"
                  >
                    {galleryLoadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-zinc-50 via-white to-zinc-50/80 px-2 py-3 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 sm:px-3"
          >
            {loadingMore && (
              <div className="sticky top-0 z-10 flex justify-center pb-1">
                <div className="rounded-full bg-white/90 px-3 py-1 text-xs text-gray-500 shadow-sm dark:bg-gray-800">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Older messages…
                  </span>
                </div>
              </div>
            )}
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center">
                <p className="text-sm text-gray-600/80 dark:text-gray-400">No messages yet</p>
                <p className="mt-0.5 text-xs text-gray-500/90 dark:text-gray-500">Send a message to start</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe =
                  selfId &&
                  (msg.sender?._id === selfId || (typeof msg.sender === 'string' && msg.sender === selfId))
                const senderName = msg.sender?.name || 'Member'
                const senderInfo = msg.senderType === 'User' ? (msg.sender?.role || 'Agent') : 'Traveler'
                const showAvatar = idx === 0 || messages[idx - 1].sender?._id !== msg.sender?._id
                const canDelete = Boolean(isMe || isAdmin)

                return (
                  <div key={msg._id} className={`group flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && (
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-gray-600 shadow-sm ring-1 ring-gray-200/80 dark:bg-gray-700 dark:text-gray-200 dark:ring-white/10 ${!showAvatar ? 'invisible' : ''}`}
                      >
                        {(senderName.charAt(0) || '?').toUpperCase()}
                      </div>
                    )}

                    {canDelete ? (
                      <div className="relative self-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuFor((prev) => (prev === msg._id ? null : msg._id))
                          }}
                          className="rounded-full p-1 text-gray-500 opacity-0 hover:bg-black/5 group-hover:opacity-100 dark:hover:bg-white/10"
                          aria-label="Message actions"
                        >
                          <MoreVertical className="h-4 w-4" strokeWidth={2} />
                        </button>

                        {openMenuFor === msg._id ? (
                          <div
                            className={`absolute z-30 ${isMe ? 'right-0' : 'left-0'} mt-1 w-32 overflow-hidden rounded-lg border border-gray-200 bg-white py-0.5 shadow-lg dark:border-white/10 dark:bg-gray-800`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuFor(null)
                                setConfirmDelete({ open: true, msg })
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className={`flex max-w-[min(100%,26rem)] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {showAvatar && (
                        <span
                          className={`mb-0.5 flex items-center gap-1.5 px-0.5 text-[11px] ${
                            isMe
                              ? 'text-primary-700/90 dark:text-primary-300/90'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <span className="font-medium">{senderName}</span>
                          <span
                            className={
                              isMe
                                ? 'text-primary-600/70 dark:text-primary-400/70'
                                : 'text-gray-400 dark:text-gray-500'
                            }
                          >
                            · {senderInfo}
                          </span>
                        </span>
                      )}

                      <div
                        className={`rounded-xl px-2.5 py-1.5 text-sm leading-snug shadow-sm ${
                          isMe
                            ? 'rounded-br-md bg-primary-600 text-white dark:bg-primary-600 dark:text-white'
                            : 'rounded-bl-md border border-gray-200/90 bg-white text-gray-900 shadow-gray-200/30 dark:border-white/10 dark:bg-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {msg.type === 'image' ? (
                          <div className="space-y-1">
                            <img
                              src={`${BASE_IMG_URL}/${msg.imageUrl}`}
                              alt=""
                              className="max-h-64 cursor-pointer rounded-md object-cover"
                              onClick={() => setPreviewSrc(`${BASE_IMG_URL}/${msg.imageUrl}`)}
                            />
                            {msg.content ? <p className="mt-1">{msg.content}</p> : null}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                      </div>

                      <div
                        className={`mt-0.5 flex items-center gap-1 px-0.5 text-[10px] ${
                          isMe
                            ? 'text-primary-700/75 dark:text-primary-200/70'
                            : 'text-gray-500 dark:text-gray-500'
                        } ${isMe ? 'flex-row-reverse' : ''}`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMe ? (
                          <Check className="h-3 w-3 opacity-50 text-current" strokeWidth={2} />
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="shrink-0 border-t border-gray-100 bg-white px-2 py-2 dark:border-white/10 dark:bg-gray-950">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
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
                className={`mb-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10 ${
                  uploadingImages ? 'opacity-50' : ''
                }`}
                title="Photo"
              >
                {uploadingImages ? (
                  <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
                ) : (
                  <Camera className="h-6 w-6" strokeWidth={1.75} />
                )}
              </label>

              <div className="relative mb-0.5 min-w-0 flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Message"
                  className="w-full rounded-full border-0 bg-white py-2.5 pl-4 pr-12 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-[#2a3942] dark:text-white dark:placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary-600 text-white transition-opacity disabled:opacity-30 dark:bg-primary-600"
                  aria-label="Send"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <Send className="h-4 w-4" strokeWidth={2} />
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {previewSrc ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewSrc(null)}
          role="presentation"
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewSrc(null)}
              className="absolute -right-1 -top-10 rounded-full p-2 text-white hover:bg-white/10 sm:-top-12"
              aria-label="Close"
            >
              <X className="h-6 w-6" strokeWidth={2} />
            </button>
            <img src={previewSrc} alt="" className="max-h-[85vh] w-full rounded-lg object-contain" />
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, msg: null })}
        onConfirm={async () => {
          const msg = confirmDelete.msg
          setConfirmDelete({ open: false, msg: null })
          if (msg) await handleDeleteMessage(msg)
        }}
        title="Delete message?"
        message="This will remove the message for everyone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
