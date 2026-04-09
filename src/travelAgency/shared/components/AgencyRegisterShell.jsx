import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Upload, FileText, X, ImageIcon } from 'lucide-react'

/**
 * Shared layout for agency registration pages (parent / child / sub-child).
 * Matches AgentAdminLogin / admin sign-in styling.
 */
export default function AgencyRegisterShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-xl animate-fade-in">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <header className="bg-primary-700 px-6 py-6 text-center sm:px-8 sm:py-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-200">OnTrip</p>
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm leading-snug text-primary-100">{subtitle}</p> : null}
          </header>

          <div className="p-6 sm:p-8">
            {children}

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 underline-offset-2 transition-colors hover:text-primary-700 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} OnTrip. All rights reserved.
        </p>
      </div>
    </div>
  )
}

function isPdf(file) {
  if (!file) return false
  return file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
}

function isImage(file) {
  return file && file.type.startsWith('image/')
}

function KycFileSlot({ name, label, file, onFileChange, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!file || !isImage(file)) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const hasFile = Boolean(file)

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-sm ring-1 ring-black/[0.03] transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-gray-800">
          {label} <span className="text-red-500">*</span>
        </p>
        {hasFile && onRemove ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove(name)
            }}
            className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label={`Remove ${label}`}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      <label
        htmlFor={`kyc-input-${name}`}
        className="group relative block cursor-pointer overflow-hidden rounded-lg bg-gray-50"
      >
        <input
          id={`kyc-input-${name}`}
          key={file ? `${name}-${file.name}-${file.size}` : name}
          type="file"
          name={name}
          className="sr-only"
          onChange={onFileChange}
          accept="image/*,.pdf"
          required={!hasFile}
        />

        <div className="relative flex min-h-[148px] flex-col items-center justify-center border border-dashed border-gray-300 transition-colors group-hover:border-primary-400 group-hover:bg-primary-50/40">
          {!hasFile ? (
            <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
                <Upload className="h-5 w-5 text-primary-600" strokeWidth={2} />
              </div>
              <span className="text-xs font-medium text-gray-600">Click to upload</span>
              <span className="text-[11px] text-gray-400">JPG, PNG or PDF</span>
            </div>
          ) : isImage(file) ? (
            previewUrl ? (
              <div className="relative h-[148px] w-full bg-gray-100">
                <img
                  src={previewUrl}
                  alt={`Preview ${label}`}
                  className="h-full w-full object-contain"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 py-2 pt-8">
                  <p className="truncate text-center text-[11px] font-medium text-white drop-shadow-sm">{file.name}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-[148px] items-center justify-center bg-gray-100">
                <span className="text-xs text-gray-500">Loading preview…</span>
              </div>
            )
          ) : isPdf(file) ? (
            <div className="flex w-full flex-col items-center justify-center gap-3 px-3 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 ring-1 ring-red-100">
                <FileText className="h-7 w-7 text-red-600" strokeWidth={1.5} />
              </div>
              <p className="max-w-full truncate px-1 text-center text-xs font-medium text-gray-800">{file.name}</p>
              <span className="text-[11px] text-gray-500">PDF attached</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-3 py-6">
              <ImageIcon className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
              <p className="max-w-full truncate text-center text-xs text-gray-700">{file.name}</p>
            </div>
          )}

          {hasFile ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
              <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-md">
                Change file
              </span>
            </div>
          ) : null}
        </div>
      </label>
    </div>
  )
}

/**
 * KYC uploads with image preview and PDF label (shared across agency registration forms).
 */
export function KycDocumentUploads({ files, onFileChange, onRemoveFile, disclaimer }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50/95 to-white p-5 shadow-sm ring-1 ring-black/[0.04]">
      <div className="mb-5 border-b border-gray-200/90 pb-4">
        <h3 className="flex items-center gap-2.5 text-sm font-semibold text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
            <ShieldCheck className="h-4 w-4" strokeWidth={2} />
          </span>
          <span>
            KYC documents
            <span className="mt-0.5 block text-xs font-normal text-gray-500">
              Upload clear photos or PDFs. You can preview images before submitting.
            </span>
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KycFileSlot
          name="aadharFront"
          label="Aadhaar front"
          file={files.aadharFront}
          onFileChange={onFileChange}
          onRemove={onRemoveFile}
        />
        <KycFileSlot
          name="aadharBack"
          label="Aadhaar back"
          file={files.aadharBack}
          onFileChange={onFileChange}
          onRemove={onRemoveFile}
        />
        <KycFileSlot
          name="panCard"
          label="PAN card"
          file={files.panCard}
          onFileChange={onFileChange}
          onRemove={onRemoveFile}
        />
      </div>

      {disclaimer ? (
        <p className="mt-5 border-t border-gray-200/80 pt-4 text-[11px] leading-relaxed text-gray-500">{disclaimer}</p>
      ) : null}
    </div>
  )
}
