import { useState, useRef, useEffect } from 'react'
import { Camera, X, RefreshCw, Loader2, CheckCircle2, Upload, ImageIcon } from 'lucide-react'

export default function ScanFaceModal({ isOpen, onClose, onScan }) {
  const [mode, setMode] = useState('camera') // 'camera' | 'upload'

  // Camera state
  const [stream, setStream] = useState(null)
  const [camError, setCamError] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Upload state
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Start/stop camera when modal opens or mode changes
  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [isOpen, mode])

  // Cleanup upload preview URL
  useEffect(() => {
    return () => { if (uploadPreview) URL.revokeObjectURL(uploadPreview) }
  }, [uploadPreview])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      setStream(mediaStream)
      if (videoRef.current) videoRef.current.srcObject = mediaStream
      setCamError(null)
    } catch {
      setCamError('Could not access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
  }

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) {
        setIsCapturing(true)
        onScan(blob).finally(() => setIsCapturing(false))
      }
    }, 'image/jpeg', 0.9)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (uploadPreview) URL.revokeObjectURL(uploadPreview)
    setUploadFile(file)
    setUploadPreview(URL.createObjectURL(file))
  }

  const handleUploadScan = () => {
    if (!uploadFile) return
    setIsUploading(true)
    onScan(uploadFile).finally(() => setIsUploading(false))
  }

  const switchMode = (m) => {
    setMode(m)
    setUploadFile(null)
    setUploadPreview(null)
    setCamError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Find My Photos</h3>
              <p className="text-xs text-gray-500">Use your face to find photos of you</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
            <X size={20} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 border-b border-gray-100 px-4 pt-3 dark:border-white/10">
          <button
            onClick={() => switchMode('camera')}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2 text-sm font-semibold transition-colors ${
              mode === 'camera'
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Camera size={15} /> Camera
          </button>
          <button
            onClick={() => switchMode('upload')}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2 text-sm font-semibold transition-colors ${
              mode === 'upload'
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Upload size={15} /> Upload Photo
          </button>
        </div>

        {/* ── CAMERA MODE ── */}
        {mode === 'camera' && (
          <>
            <div className="relative aspect-square w-full bg-black">
              {camError ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 rounded-full bg-red-50 p-4 text-red-500"><X size={32} /></div>
                  <p className="text-sm text-gray-200">{camError}</p>
                  <button
                    onClick={startCamera}
                    className="mt-4 flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-gray-900 shadow-lg hover:bg-gray-100"
                  >
                    <RefreshCw size={16} /> Try Again
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay playsInline muted
                    className="h-full w-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-56 w-56 rounded-full border-2 border-dashed border-primary-400/60 flex items-center justify-center">
                      <div className="h-40 w-40 rounded-full border-2 border-white/30 border-t-white animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                  </div>
                  <div className="absolute top-6 left-6 h-7 w-7 border-l-2 border-t-2 border-white/60 rounded-tl-lg" />
                  <div className="absolute top-6 right-6 h-7 w-7 border-r-2 border-t-2 border-white/60 rounded-tr-lg" />
                  <div className="absolute bottom-6 left-6 h-7 w-7 border-l-2 border-b-2 border-white/60 rounded-bl-lg" />
                  <div className="absolute bottom-6 right-6 h-7 w-7 border-r-2 border-b-2 border-white/60 rounded-br-lg" />
                </>
              )}
            </div>

            <div className="p-5">
              <button
                onClick={capture}
                disabled={isCapturing || !!camError || !stream}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary-600 py-4 text-base font-bold text-white transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50"
              >
                {isCapturing ? (
                  <><Loader2 className="animate-spin" size={20} /> Scanning…</>
                ) : (
                  <><div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20"><CheckCircle2 size={15} /></div> Scan My Face</>
                )}
              </button>
              <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-gray-500">
                We use AI to find your photos. Your scan is not stored.
              </p>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {/* ── UPLOAD MODE ── */}
        {mode === 'upload' && (
          <div className="p-5">
            {/* Drop zone / preview */}
            <label
              htmlFor="face-upload-input"
              className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors ${
                uploadPreview
                  ? 'border-primary-300 bg-primary-50/40 dark:bg-primary-900/10'
                  : 'border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/30 dark:bg-white/5'
              } overflow-hidden`}
              style={{ minHeight: '220px' }}
            >
              <input
                id="face-upload-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
              />

              {uploadPreview ? (
                <>
                  <img
                    src={uploadPreview}
                    alt="Selected selfie"
                    className="h-full w-full object-cover"
                    style={{ maxHeight: '220px' }}
                  />
                  <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent pb-3">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800">
                      Tap to change photo
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30">
                    <ImageIcon size={26} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Upload a selfie</p>
                    <p className="mt-1 text-xs text-gray-400">JPG, PNG — clear front-facing photo</p>
                  </div>
                </>
              )}
            </label>

            <button
              onClick={handleUploadScan}
              disabled={!uploadFile || isUploading}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-primary-600 py-4 text-base font-bold text-white transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50"
            >
              {isUploading ? (
                <><Loader2 className="animate-spin" size={20} /> Finding Photos…</>
              ) : (
                <><Upload size={18} /> Find My Photos</>
              )}
            </button>

            <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-gray-500">
              We use AI to find your photos. Your image is not stored.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
