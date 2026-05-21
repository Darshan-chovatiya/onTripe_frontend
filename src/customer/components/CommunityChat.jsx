import { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
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
  MessageSquare,
  Bell,
  BellOff,
  Download,
  CheckSquare,
  Square,
  CheckCircle2,
  Video,
  Play,
  Settings,
  Lock,
  AlertCircle,
} from 'lucide-react'
import { io } from 'socket.io-client'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import { ROLES } from '@/shared/utils/constants.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { AUTH_SCOPES, getScopeForRole, getScopeFromBrowserPath } from '@/shared/utils/authStorage.js'
import ScanFaceModal from './ScanFaceModal.jsx'
import faceRecognitionService from '@/shared/services/faceRecognitionService.js'


const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5001'
const BASE_IMG_URL = SOCKET_URL
const PAGE_SIZE = 30

const AGENT_ROLES = [ROLES.ADMIN, ROLES.PARENT_AGENCY, ROLES.CHILD_AGENCY, ROLES.SUB_CHILD]

function idStr(x) {
  if (x == null) return ''
  return String(x._id ?? x)
}

/** Whether a traveler (customer) may post in chat under current community rules. */
function travelerCanSendInCommunity(comm, customerId) {
  if (!comm || !customerId) return true
  const cid = String(customerId)
  const globalOn = comm.travelersCanSendGlobally !== false
  const deny = (comm.travelerSendDenyList || []).map(idStr)
  const allow = (comm.travelerSendAllowList || []).map(idStr)
  if (globalOn) return !deny.includes(cid)
  return allow.includes(cid)
}

/**
 * @param {'embedded' | 'page'} layout — page: full-height chat shell (WhatsApp-like); embedded: compact card for small embeds
 * @param {boolean} [flush] — with layout "page": no outer radius/shadow/border (edge-to-edge panel)
 * @param {() => void} [onBack] — show back control in main chat header (e.g. admin / agency full-page chat)
 */
export default function CommunityChat({
  packageId,
  customerId,
  currentUserId,
  layout = 'embedded',
  onToggleSidebar,
  flush = false,
  onBack,
}) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [community, setCommunity] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const communityAuthScope = useMemo(() => {
    if (user?.role) return getScopeForRole(user.role)
    return getScopeFromBrowserPath()
  }, [user?.role])

  const communityAuthConfig = useMemo(
    () => ({ authScope: communityAuthScope }),
    [communityAuthScope]
  )
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  /** Staged files before send: { id, file, previewUrl } */
  const [pendingImages, setPendingImages] = useState([])
  const pendingImagesRef = useRef([])
  const inputRef = useRef(null)
  /** null = main chat; members | gallery = full-panel (in-page, not modal) */
  const [subScreen, setSubScreen] = useState(null)
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryInitialized, setGalleryInitialized] = useState(false)
  const [galleryPage, setGalleryPage] = useState(1)
  const [galleryHasMore, setGalleryHasMore] = useState(true)
  const [galleryLoadingMore, setGalleryLoadingMore] = useState(false)
  const [previewSrc, setPreviewSrc] = useState(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [openMenuFor, setOpenMenuFor] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, msg: null })
  const [messagingSaving, setMessagingSaving] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [notifToggling, setNotifToggling] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [faceSearchResults, setFaceSearchResults] = useState(null)
  const [isFilteringByFace, setIsFilteringByFace] = useState(false)
  const [isSearchingFace, setIsSearchingFace] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  // Settings
  const [isSocketEnabled, setIsSocketEnabled] = useState(() => {
    const saved = localStorage.getItem('chat_socket_enabled')
    return saved !== 'false'
  })
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('chat_muted')
    return saved === 'true'
  })

  const scrollRef = useRef(null)
  const socketRef = useRef(null)
  const suppressAutoScrollRef = useRef(false)
  const prevSubScreenRef = useRef(null)
  const wasLoadingRef = useRef(true)

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [])

  const selfId = currentUserId || customerId || user?.id
  const isAdmin = user?.role === 'admin'
  const isPage = layout === 'page'
  const isFlush = Boolean(flush && isPage)

  // Match backend: anyone listed in agentMembers may manage traveler messaging (User ids only).
  // Do not require AGENT_ROLES — a mis-mapped role would hide controls while the API still allows the user.
  const isAgentManager = useMemo(() => {
    if (!user || !community) return false
    if (user.role === ROLES.ADMIN) return true
    const uid = idStr(user)
    if (!uid) return false
    return (community.agentMembers || []).some((m) => idStr(m) === uid)
  }, [user, community])

  const canPostInCommunity = useMemo(() => {
    if (!community || !user) return true
    if (AGENT_ROLES.includes(user.role) || user.role === ROLES.VENDOR) return true
    if (user.role !== ROLES.CUSTOMER) return true
    const cid = idStr(selfId || user.id)
    if (!cid) return true
    return travelerCanSendInCommunity(community, cid)
  }, [community, user, selfId])

  const canDeleteBulk = useMemo(() => {
    if (selectedImages.length === 0) return false
    if (isAdmin) return true
    // Verify all selected images belong to the current user
    const allLoaded = [...galleryImages, ...(faceSearchResults || [])]
    const selectedImgObjects = allLoaded.filter(img => selectedImages.includes(img._id || img.image_path))
    if (selectedImgObjects.length === 0) return false
    // If we have selected images that aren't in the current loaded lists, 
    // or if any of the found ones don't belong to the user, disable delete.
    if (selectedImgObjects.length < selectedImages.length) return false
    return selectedImgObjects.every(img => idStr(img.uploader) === idStr(selfId))
  }, [selectedImages, isAdmin, galleryImages, faceSearchResults, selfId])

  const fetchCommunity = async () => {
    setLoading(true)
    setLoadError(null)
    setCommunity(null)
    try {
      const { data } = await axiosInstance.get(`/community/package/${packageId}`, communityAuthConfig)
      if (data?.success && data?.data?.community) {
        setCommunity(data.data.community)
        setMessages([])
        setPage(1)
        setHasMore(true)
        await fetchMessages(data.data.community._id, { page: 1, mode: 'replace' })
        setupSocket(data.data.community._id)
        axiosInstance
          .get(`/community/${data.data.community._id}/notification-preference`, communityAuthConfig)
          .then(({ data: np }) => {
            if (np?.success) setNotificationsEnabled(np.data?.notificationsEnabled !== false)
          })
          .catch(() => {})
      } else {
        setLoadError({
          status: 404,
          message: data?.message || 'Community is not available for this trip yet.',
        })
      }
    } catch (err) {
      const status = err?.response?.status
      setLoadError({
        status,
        message: getApiErrorMessage(err),
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (communityId, { page: pageNum = 1, mode = 'replace' } = {}) => {
    try {
      const { data } = await axiosInstance.get(`/community/${communityId}/messages`, {
        ...communityAuthConfig,
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
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    if (!isSocketEnabled) return

    socketRef.current = io(SOCKET_URL)
    socketRef.current.emit('join_community', communityId)

    socketRef.current.on('new_message', (msg) => {
      setMessages((prev) => {
        const mid = msg?._id != null ? String(msg._id) : ''
        if (mid && prev.some((p) => String(p._id) === mid)) return prev
        
        // Play sound if not muted and not from self
        const msgMe = selfId && (msg.sender?._id === selfId || (typeof msg.sender === 'string' && msg.sender === selfId))
        if (!msgMe) {
          const savedMuted = localStorage.getItem('chat_muted') === 'true'
          if (!savedMuted) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3')
            audio.volume = 0.5
            audio.play().catch(() => {}) // Browser might block autoplay without interaction
          }
        }

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

    socketRef.current.on('community_messaging_rules', (rules) => {
      setCommunity((c) =>
        c
          ? {
              ...c,
              travelersCanSendGlobally: rules.travelersCanSendGlobally,
              travelerSendDenyList: rules.travelerSendDenyList || [],
              travelerSendAllowList: rules.travelerSendAllowList || [],
            }
          : c
      )
    })
  }

  useEffect(() => {
    fetchCommunity()
    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [packageId, isSocketEnabled])

  useEffect(() => {
    pendingImagesRef.current = pendingImages
  }, [pendingImages])

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
  }, [])

  // Snap to latest messages before paint (reload / new messages). Prepend uses suppressAutoScrollRef.
  useLayoutEffect(() => {
    if (suppressAutoScrollRef.current) {
      suppressAutoScrollRef.current = false
      return
    }
    if (!scrollRef.current || messages.length === 0) return
    scrollToBottom()
    requestAnimationFrame(() => {
      scrollToBottom()
      requestAnimationFrame(scrollToBottom)
    })
  }, [messages, scrollToBottom])

  // After first load, images/layout can grow scrollHeight — nudge bottom a few times (page reload).
  useEffect(() => {
    const wasLoading = wasLoadingRef.current
    wasLoadingRef.current = loading
    if (!wasLoading || loading || messages.length === 0) return
    const timers = [80, 250, 600].map((ms) =>
      setTimeout(() => {
        if (!suppressAutoScrollRef.current) scrollToBottom()
      }, ms)
    )
    return () => timers.forEach(clearTimeout)
  }, [loading, messages.length, scrollToBottom])

  // After closing Members / Media, chat remounts and scroll resets to top — jump to latest messages.
  useLayoutEffect(() => {
    const prev = prevSubScreenRef.current
    if (prev && subScreen === null && scrollRef.current) {
      const el = scrollRef.current
      el.scrollTop = el.scrollHeight
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      })
    }
    prevSubScreenRef.current = subScreen
  }, [subScreen])

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
        ...communityAuthConfig,
        params: { page: pageNum, limit: 12 },
      })
      if (data?.success) {
        if (!append) setGalleryInitialized(true)
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
  }, [community?._id, toast, communityAuthConfig])

  useEffect(() => {
    if (subScreen === 'gallery' && community?._id && !galleryInitialized && !galleryLoading) {
      fetchGallery(1, false)
    }
  }, [subScreen, community?._id, galleryInitialized, galleryLoading, fetchGallery])

  const openGalleryScreen = () => {
    setSubScreen('gallery')
    setPreviewSrc(null)
  }

  const backToChat = () => {
    setSubScreen(null)
    setMemberSearch('')
    setPreviewSrc(null)
    setIsFilteringByFace(false)
    setFaceSearchResults(null)
    setGalleryInitialized(false)
  }

  const handleFaceScan = async (blob) => {
    if (!community?._id) return
    setIsSearchingFace(true)
    try {
      // Use community._id as the groupId for face matching (matches disk folder)
      const data = await faceRecognitionService.findMyPhotos(blob, community._id, 0.45)
      if (data?.success) {
        if (data.personalized_photos && data.personalized_photos.length > 0) {
          setFaceSearchResults(data.personalized_photos)
          setIsFilteringByFace(true)
          setIsScanModalOpen(false)
          toast.success(`Found ${data.personalized_photos.length} photos with your face!`)
        } else {
          toast.info("No photos found with your face in this trip.")
        }
      } else {
        toast.error(data?.detail || "Could not match face.")
      }
    } catch (err) {
      toast.error("Face recognition service error.")
      console.error(err)
    } finally {
      setIsSearchingFace(false)
    }
  }

  const clearFaceFilter = () => {
    setIsFilteringByFace(false)
    setFaceSearchResults(null)
  }

  const toggleSelection = (imgId) => {
    setSelectedImages(prev => 
      prev.includes(imgId) ? prev.filter(id => id !== imgId) : [...prev, imgId]
    )
  }

  const selectAll = () => {
    const allIds = (isFilteringByFace ? faceSearchResults : galleryImages).map(img => img._id || img.image_path)
    if (selectedImages.length === allIds.length) {
      setSelectedImages([])
    } else {
      setSelectedImages(allIds)
    }
  }

  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename || 'ontrip-image.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      toast.error('Failed to download image')
    }
  }

  const downloadSelected = async () => {
    if (selectedImages.length === 0) return
    toast.info(`Starting download of ${selectedImages.length} images...`)
    
    const imagesToDownload = (isFilteringByFace ? faceSearchResults : galleryImages).filter(img => 
      selectedImages.includes(img._id || img.image_path)
    )

    for (const img of imagesToDownload) {
      const src = isFilteringByFace 
      
        ? `${SOCKET_URL}/${img.image_path}` 
        : `${BASE_IMG_URL}/${img.mediaType === 'video' ? img.videoUrl : img.imageUrl}`
      const filename = (img.mediaType === 'video' ? img.videoUrl : (img.imageUrl || img.image_path)).split('/').pop()
      await downloadImage(src, filename)
    }
    toast.success('Downloads completed')
  }

  const deleteSelected = async () => {
    if (selectedImages.length === 0 || !community?._id) return
    
    // Gather all selected image objects to verify ownership and get IDs
    const allLoaded = [...galleryImages, ...(faceSearchResults || [])]
    const selectedImgObjects = allLoaded.filter(img => selectedImages.includes(img._id || img.image_path))

    if (!isAdmin) {
      const hasUnauthorized = selectedImgObjects.some(img => idStr(img.uploader) !== idStr(selfId))
      if (hasUnauthorized || selectedImgObjects.length < selectedImages.length) {
        toast.error('You can only delete your own images')
        return
      }
    }

    const idsToDelete = [...new Set(selectedImgObjects.map(img => img._id).filter(Boolean))]

    if (idsToDelete.length === 0) {
      toast.error('Cannot delete these images')
      return
    }

    try {
      const { data } = await axiosInstance.delete(`/community/${community._id}/bulk-delete-images`, {
        ...communityAuthConfig,
        data: { imageIds: idsToDelete },
      })
      if (data?.success) {
        toast.success(data.message)
        setSelectedImages([])
        setIsSelectionMode(false)
        fetchGallery(1, false)
      } else {
        toast.error(data?.message || 'Failed to delete images')
      }
    } catch (err) {
      toast.error('Failed to delete images')
    }
  }

  const deleteSingleImage = async (imgId) => {
    if (!community?._id || !imgId) return
    try {
      const { data } = await axiosInstance.delete(`/community/${community._id}/images/${imgId}`, communityAuthConfig)
      if (data?.success) {
        toast.success('Image deleted')
        setGalleryImages(prev => prev.filter(img => img._id !== imgId))
        if (isFilteringByFace) {
          setFaceSearchResults(prev => prev.filter(img => img._id !== imgId))
        }
      } else {
        toast.error(data?.message || 'Failed to delete image')
      }
    } catch (err) {
      toast.error('Failed to delete image')
    }
  }


  const removePendingImage = (id) => {
    setPendingImages((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  const handleMediaPick = (e) => {
    const picked = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
    if (picked.length === 0) {
      e.target.value = ''
      return
    }
    const next = picked.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      file,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      previewUrl: URL.createObjectURL(file),
    }))
    setPendingImages((p) => [...p, ...next])
    e.target.value = ''
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!canPostInCommunity) {
      toast.error('You cannot send messages in this community')
      return
    }
    const text = inputText.trim()
    const queue = pendingImages
    if ((!text && queue.length === 0) || isSending || !community?._id) return

    setIsSending(true)
    try {
      if (queue.length === 0) {
        const { data } = await axiosInstance.post(`/community/${community._id}/messages`, { content: text }, communityAuthConfig)
        if (!data?.success) toast.error('Message failed to send')
        else setInputText('')
        return
      }

      // One text bubble for the whole batch: with 2+ photos, send the line as a normal message first
      // so it is not hidden as a caption on only the first image.
      if (text && queue.length > 1) {
        const { data: textRes } = await axiosInstance.post(
          `/community/${community._id}/messages`,
          { content: text },
          communityAuthConfig
        )
        if (!textRes?.success) {
          toast.error('Message failed to send')
          return
        }
        setInputText('')
      }

      const captionOnImage = text && queue.length === 1 ? text : ''

      let lastOk = -1
      for (let i = 0; i < queue.length; i++) {
        const formData = new FormData()
        formData.append('media', queue[i].file)
        formData.append('caption', captionOnImage)

        const { data } = await axiosInstance.post(`/community/${community._id}/messages/image`, formData, {
          ...communityAuthConfig,
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        if (!data?.success) {
          toast.error('A photo failed to send')
          break
        }
        lastOk = i
      }

      if (lastOk === queue.length - 1) {
        queue.forEach((q) => URL.revokeObjectURL(q.previewUrl))
        setPendingImages([])
        if (queue.length === 1) setInputText('')
        toast.success(queue.length === 1 ? (queue[0].type === 'video' ? 'Video sent' : 'Photo sent') : `${queue.length} items sent`)
      } else if (lastOk >= 0) {
        for (let j = 0; j <= lastOk; j++) {
          URL.revokeObjectURL(queue[j].previewUrl)
        }
        setPendingImages(queue.slice(lastOk + 1))
        toast.error('Some photos were not sent — you can retry the rest')
      }
    } catch {
      toast.error(queue.length > 0 ? 'Image upload failed' : 'Network error')
    } finally {
      setIsSending(false)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }

  const handleDeleteMessage = async (msg) => {
    if (!community?._id || !msg?._id) return
    const ownerMatch =
      selfId && (msg.sender?._id === selfId || (typeof msg.sender === 'string' && msg.sender === selfId))
    if (!ownerMatch && !isAdmin) return

    setMessages((prev) => prev.filter((m) => m._id !== msg._id))
    try {
      const { data } = await axiosInstance.delete(`/community/${community._id}/messages/${msg._id}`, communityAuthConfig)
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

  const applyTravelerMessagingPatch = useCallback(
    async (body) => {
      const cid = community?._id
      if (!cid) return
      setMessagingSaving(true)
      try {
        const { data } = await axiosInstance.patch(`/community/${cid}/traveler-messaging`, body, communityAuthConfig)
        if (data?.success && data?.data?.community) {
          setCommunity(data.data.community)
          toast.success('Messaging settings saved')
        }
      } catch (e) {
        toast.error(getApiErrorMessage(e))
      } finally {
        setMessagingSaving(false)
      }
    },
    [community?._id, toast, communityAuthConfig]
  )

  const handleGlobalTravelerMessagingToggle = async () => {
    if (!community || messagingSaving) return
    const nextGlobal = !(community.travelersCanSendGlobally !== false)
    await applyTravelerMessagingPatch({
      travelersCanSendGlobally: nextGlobal,
      travelerSendDenyList: [],
      travelerSendAllowList: [],
    })
  }

  const handleTravelerRowToggle = async (m) => {
    if (!community || messagingSaving) return
    const mid = idStr(m)
    const currentlyAllowed = travelerCanSendInCommunity(community, m._id)
    const nextAllowed = !currentlyAllowed
    const globalOn = community.travelersCanSendGlobally !== false
    let deny = (community.travelerSendDenyList || []).map(idStr)
    let allow = (community.travelerSendAllowList || []).map(idStr)
    if (globalOn) {
      if (nextAllowed) deny = deny.filter((id) => id !== mid)
      else if (!deny.includes(mid)) deny = [...deny, mid]
    } else if (nextAllowed) {
      if (!allow.includes(mid)) allow = [...allow, mid]
    } else {
      allow = allow.filter((id) => id !== mid)
    }
    await applyTravelerMessagingPatch({
      travelersCanSendGlobally: globalOn,
      travelerSendDenyList: deny,
      travelerSendAllowList: allow,
    })
  }

  const handleNotificationToggle = async () => {
    if (!community?._id || notifToggling) return
    const next = !notificationsEnabled
    setNotifToggling(true)
    try {
      const { data } = await axiosInstance.patch(
        `/community/${community._id}/notification-preference`,
        { enabled: next },
        communityAuthConfig
      )
      if (data?.success) {
        setNotificationsEnabled(next)
        toast.success(next ? 'Notifications enabled' : 'Notifications muted')
      }
    } catch {
      toast.error('Could not update notification preference')
    } finally {
      setNotifToggling(false)
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
    const isUnauthorized = loadError?.status === 401
    const isForbidden = loadError?.status === 403
    const isNotFound = loadError?.status === 404 || !loadError?.status

    const title = isUnauthorized
      ? 'Please sign in again'
      : isForbidden
        ? 'Community access restricted'
        : isNotFound
          ? 'Community not available'
          : 'Unable to open community'

    const description = isUnauthorized
      ? 'Your session may have expired. Log in again to join the group chat for this trip.'
      : isForbidden
        ? (loadError?.message || 'You are not a member of this trip community yet.')
        : isNotFound
          ? (loadError?.message || 'Group chat has not been set up for this package yet. Check back after your booking is confirmed.')
          : (loadError?.message || 'Something went wrong while loading the community. Please try again later.')

    const Icon = isUnauthorized ? Lock : isForbidden ? AlertCircle : MessageSquare

    return (
      <div className={`flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center ${isPage ? 'min-h-[50vh] bg-gray-50/30' : 'rounded-xl border border-gray-200 bg-gray-50/50 py-14'}`}>
        <div className={`flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg ${
          isUnauthorized ? 'bg-amber-100 text-amber-600' : isForbidden ? 'bg-orange-100 text-orange-600' : 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-primary-200'
        }`}>
          <Icon size={36} strokeWidth={1.5} />
        </div>
        <div className="max-w-sm space-y-2">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
        {isUnauthorized && communityAuthScope === AUTH_SCOPES.CUSTOMER && (
          <Link
            to="/customer/login"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Customer Login
          </Link>
        )}
        {isUnauthorized && communityAuthScope === AUTH_SCOPES.VENDOR && (
          <Link
            to="/vendor/login"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Vendor Login
          </Link>
        )}
        {isUnauthorized && communityAuthScope === AUTH_SCOPES.APP && (
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Agency Login
          </Link>
        )}
        {!isUnauthorized && packageId && (
          <button
            type="button"
            onClick={() => fetchCommunity()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  const memberTotal =
    (community.agentMembers?.length || 0) +
    (community.customerMembers?.length || 0) +
    (community.vendorMembers?.length || 0)

  const shellClass = isFlush
    ? 'flex h-full min-h-0 flex-1 flex-col overflow-hidden border-0 bg-white dark:bg-gray-950'
    : isPage
      ? 'flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-gray-950 dark:shadow-none'
      : 'flex h-[90vh] w-full max-w-full flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-gray-950 dark:shadow-none'

  const headerClass = isFlush
    ? 'flex h-[72px] shrink-0 items-center gap-4 border-b border-gray-100 bg-white/80 px-4 backdrop-blur-xl dark:border-white/5 dark:bg-gray-950/80'
    : 'flex h-[72px] shrink-0 items-center gap-4 border-b border-gray-100 bg-white/80 px-4 backdrop-blur-xl dark:border-white/5 dark:bg-gray-950/80'

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
              <div className="flex items-center gap-1">
                {isFilteringByFace ? (
                   <button
                    type="button"
                    onClick={clearFaceFilter}
                    className="shrink-0 rounded-lg bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                  >
                    Clear Filter
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsScanModalOpen(true)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-50 px-2 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400"
                  >
                    <Camera size={14} strokeWidth={2.5} />
                    Find Me
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fetchGallery(1, false)}
                  disabled={galleryLoading}
                  className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-black/5 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/10"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode)
                    setSelectedImages([])
                  }}
                  className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                    isSelectionMode 
                      ? 'bg-primary-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10'
                  }`}
                >
                  {isSelectionMode ? 'Cancel' : 'Select'}
                </button>
              </div>
            ) : null}

          </>
        ) : (
          <>
            {typeof onBack === 'function' ? (
              <button
                type="button"
                onClick={onBack}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10"
                aria-label="Back"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={2} />
              </button>
            ) : null}
            <div className={`flex min-w-0 flex-1 items-center gap-3 ${onBack ? '' : 'pl-1'}`}>
              {onToggleSidebar ? (
                <button
                  onClick={onToggleSidebar}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-200 transition-all active:scale-95 lg:hidden"
                >
                  <MessageSquare size={18} />
                </button>
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-800 dark:bg-primary-900/60 dark:text-primary-100">
                  {(community.package?.title || 'T').charAt(0).toUpperCase()}
                </div>
              )}
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
                onClick={handleNotificationToggle}
                disabled={notifToggling}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-black/5 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
                title={notificationsEnabled ? 'Mute notifications' : 'Unmute notifications'}
                aria-label={notificationsEnabled ? 'Mute notifications' : 'Unmute notifications'}
              >
                {notificationsEnabled
                  ? <Bell className="h-5 w-5" strokeWidth={2} />
                  : <BellOff className="h-5 w-5 text-gray-400" strokeWidth={2} />
                }
              </button>
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
              <button
                type="button"
                onClick={() => setSubScreen('settings')}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </>
        )}
      </header>

      {subScreen === 'members' ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-gray-950">
          <div className="sticky top-0 z-[1] border-b border-gray-100 bg-white dark:border-white/10 dark:bg-gray-950">
            <div className="p-3 pb-2">
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            {isAgentManager ? (
              <div className="border-t border-primary-100/80 bg-primary-50/40 px-3 py-3 dark:border-primary-900/30 dark:bg-primary-950/20">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-800 dark:text-primary-200">
                  Traveler messaging
                </p>
                <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                  Control who can send text and photos in this chat (all travelers or selected only).
                </p>
                <label className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-gray-900">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">All travelers can send</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={community.travelersCanSendGlobally !== false}
                    disabled={messagingSaving}
                    onChange={() => handleGlobalTravelerMessagingToggle()}
                  />
                </label>
                {community.travelersCanSendGlobally === false ? (
                  <p className="mt-2 text-xs text-amber-900 dark:text-amber-100/90">
                    Only travelers with “Can send” below may post. Turn the switch on to allow everyone again.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    Turn off for allow-list only, or use Muted / Can send on each traveler below.
                  </p>
                )}
              </div>
            ) : user?.role === ROLES.CUSTOMER ? (
              <div className="border-t border-gray-100 px-3 py-2.5 dark:border-white/10">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your agent manages who can send messages in this group.
                </p>
              </div>
            ) : null}
          </div>
          <div className="p-3">
            <p className="mb-2 px-1 text-xs font-medium text-gray-500">Agents</p>
            <ul className="space-y-1">
              {filterMembers(community.agentMembers || []).map((m) => {
                const agentInitial = (m.name || '?').charAt(0).toUpperCase()
                const agentImg = m.agencyLogo || m.profileImage
                const agentImgUrl = agentImg ? `${BASE_IMG_URL}/${String(agentImg).replace(/^\//, '')}` : null
                return (
                <li
                  key={m._id}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-[10px] font-bold text-white">
                      {agentImgUrl ? <img src={agentImgUrl} alt={m.name} className="h-full w-full object-cover" /> : agentInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{m.name || '—'}</p>
                      <p className="truncate text-xs text-gray-500">{m.email || m.phone || '—'}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium capitalize text-primary-700 dark:text-primary-400">
                    {(m.role || 'agent').replace(/_/g, ' ')}
                  </span>
                </li>
                )
              })}
            </ul>
            <p className="mb-2 mt-4 px-1 text-xs font-medium text-gray-500">Travelers</p>
            <ul className="space-y-1">
              {filterMembers(community.customerMembers || []).map((m) => {
                const travelerAllowed = travelerCanSendInCommunity(community, m._id)
                const travelerInitial = (m.name || '?').charAt(0).toUpperCase()
                const travelerImgUrl = m.profileImage ? `${BASE_IMG_URL}/${String(m.profileImage).replace(/^\//, '')}` : null
                return (
                  <li
                    key={m._id}
                    className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[10px] font-bold text-white">
                        {travelerImgUrl ? <img src={travelerImgUrl} alt={m.name} className="h-full w-full object-cover" /> : travelerInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{m.name || 'Traveler'}</p>
                        <p className="truncate text-xs text-gray-500">{m.email || m.phone || '—'}</p>
                      </div>
                    </div>
                    {isAgentManager ? (
                      <button
                        type="button"
                        disabled={messagingSaving}
                        onClick={() => handleTravelerRowToggle(m)}
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                          travelerAllowed
                            ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-200 hover:bg-primary-100 dark:bg-primary-950/50 dark:text-primary-200 dark:ring-primary-800'
                            : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-white/10'
                        }`}
                      >
                        {travelerAllowed ? 'Can send' : 'Muted'}
                      </button>
                    ) : (
                      <span className="shrink-0 text-[11px] font-medium text-gray-500">Traveler</span>
                    )}
                  </li>
                )
              })}
            </ul>
            {(community.vendorMembers?.length || 0) > 0 && (
              <>
                <p className="mb-2 mt-4 px-1 text-xs font-medium text-gray-500">Vendors</p>
                <ul className="space-y-1">
                  {filterMembers(community.vendorMembers || []).map((m) => {
                    const vendorInitial = (m.name || '?').charAt(0).toUpperCase()
                    return (
                      <li
                        key={m._id}
                        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-[10px] font-bold text-white">
                            {vendorInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{m.name || '—'}</p>
                            <p className="truncate text-xs text-gray-500">{m.phone || m.email || '—'}</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium capitalize text-amber-700 dark:text-amber-400">
                          {(m.type || 'vendor').replace(/_/g, ' ')}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      ) : subScreen === 'settings' ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-gray-950">
          <div className="p-4 space-y-6">
            <section>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">Connectivity</h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Online Status</p>
                    <p className="text-xs text-gray-500">Enable real-time message updates</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isSocketEnabled
                      setIsSocketEnabled(next)
                      localStorage.setItem('chat_socket_enabled', String(next))
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isSocketEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSocketEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
              </div>
            </section>

            <section>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">Notifications</h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Message Sounds</p>
                    <p className="text-xs text-gray-500">Play a sound for incoming messages</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isMuted
                      setIsMuted(next)
                      localStorage.setItem('chat_muted', String(next))
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      !isMuted ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!isMuted ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Push Notifications</p>
                    <p className="text-xs text-gray-500">Server-side notification preference</p>
                  </div>
                  <button
                    type="button"
                    disabled={notifToggling}
                    onClick={handleNotificationToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationsEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
              </div>
            </section>

            <div className="pt-4 border-t border-gray-100 dark:border-white/5 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Package Chat Settings</p>
            </div>
          </div>
        </div>
      ) : subScreen === 'gallery' ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 dark:bg-gray-950">
          {galleryLoading || isSearchingFace ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
              <p className="text-sm text-gray-500">{isSearchingFace ? 'Finding your photos...' : 'Loading…'}</p>
            </div>
          ) : (isFilteringByFace ? (faceSearchResults || []) : galleryImages).length === 0 ? (
            <div className="py-16 text-center">
              <Camera className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                {isFilteringByFace ? "No photos found with your face" : "No media yet"}
              </p>
              {isFilteringByFace && (
                <button 
                  onClick={clearFaceFilter}
                  className="mt-2 text-xs font-medium text-primary-600 hover:underline"
                >
                  Show all photos
                </button>
              )}
            </div>
          ) : (
            <div className="p-2">
              {isFilteringByFace && (
                <div className="mb-3 flex items-center justify-between rounded-xl bg-primary-50/50 p-3 ring-1 ring-primary-100 dark:bg-primary-900/20 dark:ring-primary-900/30">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                      {faceSearchResults?.length}
                    </div>
                    <span className="text-xs font-semibold text-primary-900 dark:text-primary-100">Photos found with your face</span>
                  </div>
                  <button onClick={clearFaceFilter} className="text-[10px] font-bold uppercase tracking-wider text-primary-700 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200">
                    Show All
                  </button>
                </div>
              )}

              {isSelectionMode && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-900 ring-1 ring-gray-100 dark:ring-white/5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAll}
                      className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors"
                    >
                      {selectedImages.length === (isFilteringByFace ? faceSearchResults : galleryImages).length ? (
                        <CheckSquare size={16} className="text-primary-600" />
                      ) : (
                        <Square size={16} />
                      )}
                      Select All
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {selectedImages.length} Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadSelected}
                      disabled={selectedImages.length === 0}
                      className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 hover:bg-primary-100 disabled:opacity-40 transition-all active:scale-95"
                    >
                      <Download size={14} />
                      Download
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ 
                        open: true, 
                        msg: { _id: 'bulk', isBulk: true } 
                      })}
                      disabled={!canDeleteBulk}
                      className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-40 transition-all active:scale-95"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-0.5 sm:grid-cols-6">
                {(isFilteringByFace ? (faceSearchResults || []) : galleryImages).map((img, idx) => {
                  const id = img._id || img.image_path
                  const isSelected = selectedImages.includes(id)
                  const src = isFilteringByFace 
                    ? `${SOCKET_URL}/${img.image_path}` 
                    : `${BASE_IMG_URL}/${img.mediaType === 'video' ? img.videoUrl : img.imageUrl}`
                  
                  return (
                    <div key={isFilteringByFace ? `face-${idx}` : img._id} className="relative aspect-square group">
                      <button
                        type="button"
                        onClick={() => isSelectionMode ? toggleSelection(id) : setPreviewSrc({ src, type: img.mediaType || 'image' })}
                        className={`h-full w-full overflow-hidden bg-black/5 transition-all ${
                          isSelected ? 'p-2 bg-primary-100 dark:bg-primary-900/40' : 'active:scale-95'
                        }`}
                      >
                        {img.mediaType === 'video' ? (
                          <div className="relative h-full w-full">
                            <video 
                              src={src} 
                              muted
                              playsInline
                              className={`h-full w-full object-cover transition-all ${
                                isSelected ? 'rounded-lg shadow-inner ring-2 ring-primary-500' : ''
                              }`}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Play size={20} className="text-white fill-current" />
                            </div>
                          </div>
                        ) : (
                          <img 
                            src={src} 
                            alt="" 
                            className={`h-full w-full object-cover transition-all ${
                              isSelected ? 'rounded-lg shadow-inner ring-2 ring-primary-500' : ''
                            }`} 
                            loading="lazy" 
                          />
                        )}
                      </button>
                      
                      {isSelectionMode && (
                        <div 
                          className="absolute right-1.5 top-1.5 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelection(id)
                          }}
                        >
                          {isSelected ? (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg ring-2 ring-white">
                              <Check size={12} strokeWidth={4} />
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-white bg-black/20 shadow-lg backdrop-blur-sm" />
                          )}
                        </div>
                      )}

                      {!isSelectionMode && (
                        <div className="absolute bottom-1.5 right-1.5 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const filename = (img.mediaType === 'video' ? img.videoUrl : (img.imageUrl || img.image_path)).split('/').pop();
                                downloadImage(src, filename);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                          {(isAdmin || idStr(img.uploader) === idStr(selfId)) && img._id && (
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDelete({ open: true, msg: { _id: img._id, isSingle: true } })
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/40 text-white hover:bg-red-500/60 backdrop-blur-sm"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {!isFilteringByFace && galleryHasMore ? (
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
            className={`min-h-0 flex-1 space-y-1 overflow-y-auto bg-[#F8F9FA] dark:bg-gray-950 ${isFlush ? 'px-0' : 'px-4 sm:px-6'} py-6 custom-scrollbar`}
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
                <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
                  <MessageSquare size={28} className="text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">No messages yet</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Be the first to start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe =
                  selfId &&
                  (msg.sender?._id === selfId || (typeof msg.sender === 'string' && msg.sender === selfId))
                
                const senderName = msg.sender?.name || 'Member'
                const senderInfo =
                  msg.senderType === 'User'
                    ? (msg.sender?.role || 'Agent').replace(/_/g, ' ')
                    : msg.senderType === 'Vendor'
                      ? (msg.sender?.type || 'vendor').replace(/_/g, ' ')
                      : 'Traveler'
                
                // Grouping Logic
                const prevMsg = messages[idx - 1]
                const nextMsg = messages[idx + 1]
                const isFirstInGroup = !prevMsg || prevMsg.sender?._id !== msg.sender?._id
                const isLastInGroup = !nextMsg || nextMsg.sender?._id !== msg.sender?._id
                
                const canDelete = Boolean(isMe || isAdmin)
                const initial = (senderName.charAt(0) || '?').toUpperCase()
                const senderImg = msg.sender?.profileImage || msg.sender?.agencyLogo || null
                const senderImgUrl = senderImg ? `${BASE_IMG_URL}/${String(senderImg).replace(/^\//, '')}` : null

                // Date separator logic
                const msgDate = new Date(msg.createdAt).toDateString()
                const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null
                const showDateSeparator = msgDate !== prevMsgDate

                return (
                  <div key={msg._id} className="flex flex-col">
                    {showDateSeparator && (
                      <div className="flex justify-center my-6">
                        <div className="px-4 py-1 rounded-full bg-gray-200/50 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-white/5 dark:text-gray-400">
                          {msgDate === new Date().toDateString() ? 'Today' : 
                           msgDate === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday' : 
                           msgDate}
                        </div>
                      </div>
                    )}

                    <div className={`group flex items-end gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isLastInGroup ? 'mb-4' : 'mb-0.5'}`}>
                      {/* Avatar for others - Top aligned */}
                      {!isMe && (
                        <div className={`w-8 shrink-0 flex justify-center ${!isFirstInGroup ? 'invisible' : ''}`}>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm overflow-hidden">
                            {senderImgUrl
                              ? <img src={senderImgUrl} alt={senderName} className="w-full h-full object-cover" />
                              : initial
                            }
                          </div>
                        </div>
                      )}

                      <div className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                        
                        {/* Outside Bubble: Name and Time */}
                        {isFirstInGroup && (
                          <div className="flex items-center gap-1 mb-1 px-1">
                            {!isMe && (
                              <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                                {senderName},
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500 font-medium">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}

                        <div className="relative group/bubble flex items-start">
                          <div
                            className={`px-3 py-2 text-sm leading-relaxed shadow-sm transition-all duration-300 w-full ${
                              isMe
                                ? `bg-primary-600 text-white rounded-2xl rounded-tr-sm`
                                : `bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-white/5`
                            }`}
                          >
                            {/* Message Content */}
                            {msg.type === 'image' ? (
                              <div className="space-y-2 py-1">
                                <div className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-100/50">
                                  <img
                                    src={`${BASE_IMG_URL}/${msg.imageUrl}`}
                                    alt=""
                                    className="max-h-[300px] w-full object-cover cursor-zoom-in transition-transform duration-500 hover:scale-105"
                                    onClick={() => setPreviewSrc({ src: `${BASE_IMG_URL}/${msg.imageUrl}`, type: 'image' })}
                                  />
                                </div>
                                {msg.content ? <p className="font-medium text-[13px]">{msg.content}</p> : null}
                              </div>
                            ) : msg.type === 'video' ? (
                              <div className="space-y-2 py-1">
                                <div className="relative overflow-hidden rounded-xl bg-black shadow-lg">
                                  <video
                                    src={`${BASE_IMG_URL}/${msg.videoUrl}`}
                                    controls
                                    className="max-h-[300px] w-full"
                                  />
                                </div>
                                {msg.content ? <p className="font-medium text-[13px]">{msg.content}</p> : null}
                              </div>
                            ) : (
                              <div className="flex items-end gap-2">
                                <p className="whitespace-pre-wrap break-words font-medium text-[13px]">{msg.content}</p>
                                {isMe && (
                                  <Check className="w-3.5 h-3.5 text-primary-200 shrink-0 mb-0.5" strokeWidth={3} />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Menu - Floating */}
                          {canDelete && (
                            <div className={`absolute top-2 ${isMe ? '-left-10' : '-right-10'} opacity-0 group-hover/bubble:opacity-100 transition-opacity`}>
                               <button
                                onClick={() => setConfirmDelete({ open: true, msg })}
                                className="p-1.5 rounded-full bg-white shadow-md border border-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                               >
                                 <Trash2 size={14} />
                               </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

            <div className={`p-4 bg-white dark:bg-gray-950 ${isFlush ? 'px-0' : 'px-4'}`}>
              {!canPostInCommunity ? (
                <div
                  className="mb-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-center text-xs font-medium text-amber-800 dark:border-amber-900/20 dark:bg-amber-950/20 dark:text-amber-200"
                >
                  Messaging is currently limited to agents in this group.
                </div>
              ) : null}

              <form onSubmit={handleSendMessage} className="space-y-3">
                {pendingImages.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto py-2 px-1 custom-scrollbar">
                    {pendingImages.map((item) => (
                      <div
                        key={item.id}
                        className="relative h-20 w-20 shrink-0 group"
                      >
                        <div className="absolute inset-0 rounded-2xl ring-2 ring-primary-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {item.type === 'video' ? (
                          <div className="h-full w-full rounded-2xl bg-gray-100 flex items-center justify-center dark:bg-gray-800 border border-gray-200 dark:border-white/10">
                            <Video className="h-8 w-8 text-gray-400" />
                          </div>
                        ) : (
                          <img src={item.previewUrl} alt="" className="h-full w-full object-cover rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm" />
                        )}
                        <button
                          type="button"
                          onClick={() => removePendingImage(item.id)}
                          className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transform transition-transform hover:scale-110 active:scale-90"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:bg-white transition-all">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        pendingImages.length > 1
                          ? 'Add a caption for your items...'
                          : pendingImages.length === 1
                            ? 'Add a caption...'
                            : 'Type your message...'
                      }
                      ref={inputRef}
                      disabled={!canPostInCommunity}
                      className="flex-1 bg-transparent border-none py-2.5 px-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                    />

                    <div className="flex items-center gap-1 pr-1 border-l border-gray-200 pl-2 ml-1">
                      <input
                        type="file"
                        id="chat-images"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleMediaPick}
                        disabled={!canPostInCommunity || isSending}
                        className="hidden"
                      />
                      <label
                        htmlFor="chat-images"
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
                          !canPostInCommunity || isSending 
                            ? 'opacity-40 grayscale pointer-events-none' 
                            : 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500'
                        }`}
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera size={18} strokeWidth={2} />
                        )}
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={(!inputText.trim() && pendingImages.length === 0) || isSending || !canPostInCommunity}
                    className={`p-2 shrink-0 items-center justify-center rounded-xl transition-all transform active:scale-95 ${
                      (!inputText.trim() && pendingImages.length === 0) || isSending || !canPostInCommunity
                        ? 'bg-gray-800 text-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-gray-900 text-white shadow-lg hover:bg-black hover:-translate-y-0.5'
                    }`}
                  >
                    <Send size={22} strokeWidth={2} className="" />
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
            {previewSrc.type === 'video' ? (
              <video src={previewSrc.src} controls autoPlay className="max-h-[85vh] w-full rounded-lg" />
            ) : (
              <img src={previewSrc.src} alt="" className="max-h-[85vh] w-full rounded-lg object-contain" />
            )}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, msg: null })}
        onConfirm={async () => {
          const msg = confirmDelete.msg
          setConfirmDelete({ open: false, msg: null })
          if (msg?.isBulk) {
            await deleteSelected()
          } else if (msg?.isSingle) {
            await deleteSingleImage(msg._id)
          } else if (msg) {
            await handleDeleteMessage(msg)
          }
        }}
        title={confirmDelete.msg?.isBulk ? `Delete ${selectedImages.length} images?` : confirmDelete.msg?.isSingle ? "Delete image?" : "Delete message?"}
        message={confirmDelete.msg?.isBulk 
          ? "This will permanently remove the selected images from the gallery." 
          : confirmDelete.msg?.isSingle
          ? "This will permanently remove this image from the gallery."
          : "This will remove the message for everyone."}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ScanFaceModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScan={handleFaceScan}
      />
    </div>

  )
}
