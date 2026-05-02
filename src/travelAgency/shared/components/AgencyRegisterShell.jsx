import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Upload, FileText, X, ImageIcon, Check, LayoutDashboard, CalendarCheck, MapPin, Users, Sparkles } from 'lucide-react'
import logo from '@/assets/onTripLogo.png'
import './AgencyRegisterShell.css'

/* ─── Step Indicator ─── */
export function StepIndicator({ step }) {
  const steps = ['Your Info', 'KYC Documents']
  return (
    <div className="areg-steps">
      {steps.map((label, i) => {
        const idx = i + 1
        const done = step > idx
        const active = step === idx
        return (
          <div key={label} className="areg-step-item">
            <div className={`areg-step-circle ${done ? 'areg-step-done' : active ? 'areg-step-active' : 'areg-step-idle'}`}>
              {done ? <Check size={13} strokeWidth={3} /> : idx}
            </div>
            <span className={`areg-step-label ${active ? 'areg-step-label-active' : ''}`}>{label}</span>
            {i < steps.length - 1 && (
              <div className={`areg-step-connector ${done ? 'areg-step-connector-done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Main Shell ─── */
export default function AgencyRegisterShell({ title, subtitle, step, children }) {
  return (
    <div className="areg-root">
      {/* Background */}
      <div className="areg-bg">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1800&q=85"
          alt=""
          className="areg-bg-img"
        />
        <div className="areg-bg-overlay" />
      </div>

      <div className="areg-layout">
        <div className="areg-left">
          <div className="areg-tagline-wrap">
            <div className="areg-tagline-badge">
              <span className="areg-badge-dot" />
              Agency Portal
            </div>
            <h1 className="areg-tagline">Join the<br />Network</h1>
            <p className="areg-tagline-desc">
              Register your agency and start managing trips, bookings, and your team today.
            </p>
          </div>

          <div className="areg-stats">
            {[['500+', 'Agencies'], ['2M+', 'Bookings'], ['150+', 'Destinations']].map(([val, lbl]) => (
              <div key={lbl} className="areg-stat">
                <span className="areg-stat-val">{val}</span>
                <span className="areg-stat-lbl">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="areg-card">
          <div className="areg-mobile-logo">
            <img src={logo} alt="OnTrip" />
          </div>

          <div className="areg-card-header">
            <h2 className="areg-card-title">{title}</h2>
            {subtitle && <p className="areg-card-sub">{subtitle}</p>}
          </div>

          {step && <StepIndicator step={step} />}

          <div className="areg-card-body">{children}</div>

          <p className="areg-signin-link">
            Already have an account?{' '}
            <Link to="/login" className="areg-signin-anchor">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── KYC File Slot ─── */
function isPdf(file) {
  return file && (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf'))
}

function isImage(file) {
  return file && file.type.startsWith('image/')
}

function KycFileSlot({ name, label, file, onFileChange, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!file || !isImage(file)) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const hasFile = Boolean(file)

  return (
    <div className="kyc-slot">
      <div className="kyc-slot-header">
        <p className="kyc-slot-label">{label} <span className="kyc-slot-req">*</span></p>
        {hasFile && (
          <button type="button" onClick={() => onRemove(name)} className="kyc-slot-remove" aria-label={`Remove ${label}`}>
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      <label htmlFor={`kyc-input-${name}`} className="kyc-slot-drop">
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

        {!hasFile ? (
          <div className="kyc-slot-empty">
            <div className="kyc-slot-icon-wrap"><Upload size={18} /></div>
            <span className="kyc-slot-upload-text">Click to upload</span>
            <span className="kyc-slot-hint">JPG, PNG or PDF</span>
          </div>
        ) : isImage(file) && previewUrl ? (
          <div className="kyc-slot-preview">
            <img src={previewUrl} alt={`Preview ${label}`} className="kyc-slot-img" />
            <div className="kyc-slot-img-overlay"><p className="kyc-slot-filename">{file.name}</p></div>
          </div>
        ) : isPdf(file) ? (
          <div className="kyc-slot-pdf">
            <div className="kyc-slot-pdf-icon"><FileText size={24} strokeWidth={1.5} /></div>
            <p className="kyc-slot-filename">{file.name}</p>
            <span className="kyc-slot-hint">PDF attached</span>
          </div>
        ) : (
          <div className="kyc-slot-empty">
            <ImageIcon size={22} />
            <p className="kyc-slot-filename">{file.name}</p>
          </div>
        )}

        {hasFile && (
          <div className="kyc-slot-hover-overlay"><span>Change file</span></div>
        )}
      </label>
    </div>
  )
}

/** Optional square logo — JPG / PNG / WebP */
export function AgencyLogoSlot({ file, onFileChange, onRemove, style }) {
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
    <div className="kyc-slot kyc-slot-logo" style={style}>
      <div className="kyc-slot-header">
        <p className="kyc-slot-label">
          <Sparkles size={12} className="inline-block align-middle opacity-70" strokeWidth={2} /> Agency Logo{' '}
          <span className="kyc-slot-req">*</span>
        </p>
        {hasFile && (
          <button type="button" onClick={() => onRemove('agencyLogo')} className="kyc-slot-remove" aria-label="Remove logo">
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>
      <label htmlFor="agency-logo-input" className="kyc-slot-drop kyc-slot-drop-logo">
        <input
          id="agency-logo-input"
          key={file ? `agencyLogo-${file.name}-${file.size}` : 'agencyLogo'}
          type="file"
          name="agencyLogo"
          className="sr-only"
          onChange={onFileChange}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          required={!hasFile}
        />
        {!hasFile ? (
          <div className="kyc-slot-empty">
            <div className="kyc-slot-icon-wrap"><ImageIcon size={18} /></div>
            <span className="kyc-slot-upload-text">Upload brand logo</span>
            <span className="kyc-slot-hint">JPG, PNG or WebP · square works best</span>
          </div>
        ) : previewUrl ? (
          <div className="kyc-slot-preview kyc-slot-preview-logo">
            <img src={previewUrl} alt="Logo preview" className="kyc-slot-img kyc-slot-img-logo" />
            <div className="kyc-slot-img-overlay"><p className="kyc-slot-filename">{file.name}</p></div>
          </div>
        ) : (
          <div className="kyc-slot-empty">
            <ImageIcon size={22} />
            <p className="kyc-slot-filename">{file.name}</p>
          </div>
        )}
        {hasFile && <div className="kyc-slot-hover-overlay"><span>Change logo</span></div>}
      </label>
    </div>
  )
}

export function KycDocumentUploads({ files, onFileChange, onRemoveFile, disclaimer }) {
  return (
    <div className="kyc-wrap">
      <div className="kyc-header">
        <div className="kyc-header-icon"><ShieldCheck size={16} strokeWidth={2} /></div>
        <div>
          <p className="kyc-header-title">KYC Documents</p>
          <p className="kyc-header-sub">Upload clear photos or PDFs of your documents.</p>
        </div>
      </div>

      <div className="kyc-grid">
        <KycFileSlot name="aadharFront" label="Aadhaar Front" file={files.aadharFront} onFileChange={onFileChange} onRemove={onRemoveFile} />
        <KycFileSlot name="aadharBack"  label="Aadhaar Back"  file={files.aadharBack}  onFileChange={onFileChange} onRemove={onRemoveFile} />
        <KycFileSlot name="panCard"     label="PAN Card"      file={files.panCard}      onFileChange={onFileChange} onRemove={onRemoveFile} />
      </div>

      {disclaimer && <p className="kyc-disclaimer">{disclaimer}</p>}
    </div>
  )
}
