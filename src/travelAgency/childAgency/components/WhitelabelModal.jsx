import { useEffect, useState } from 'react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

const emptyCreate = (pkg) => {
  const isWl = pkg?.sourceType === 'whitelabel'
  let title = isWl ? (pkg.customTitle || pkg.originalPackage?.title) : (pkg?.title || '')
  
  // Strip existing suffix if it's already a whitelabel to avoid "Package - your offer - your offer"
  if (title) {
    title = title.replace(/\s*[—|-]\s*your\s*offer$/i, '').trim()
  }

  const description = isWl ? (pkg.customDescription || pkg.originalPackage?.description) : (pkg?.description || '')

  return {
    packageId: (!isWl && pkg?._id) || '',
    parentWhitelabelId: (isWl && pkg?._id) || '',
    customTitle: title ? `${title} — your offer` : '',
    customDescription: description || '',
    commissionType: 'flat',
    commissionValue: '0',
  }
}

const emptyEdit = (item) => ({
  customTitle: item?.customTitle || '',
  customDescription: item?.customDescription || '',
  commissionType: item?.commissionType || 'flat',
  commissionValue: String(item?.commissionValue ?? 0),
  isActive: item?.isActive !== false,
  visibleToSubChildren: item?.visibleToSubChildren !== false,
  isPriceLocked: item?.isPriceLocked || false,
})

export default function WhitelabelModal({
  isOpen,
  onClose,
  mode,
  sourcePackage,
  whitelabel,
  eligiblePackages,
  onSubmit,
  loading,
}) {
  const [form, setForm] = useState(() => emptyCreate(null))

  useEffect(() => {
    if (!isOpen) return
    if (mode === 'edit' && whitelabel) {
      setForm(emptyEdit(whitelabel))
    } else {
      setForm(emptyCreate(sourcePackage || null))
    }
  }, [isOpen, mode, whitelabel, sourcePackage])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const commissionValue = Number(form.commissionValue)
    if (Number.isNaN(commissionValue) || commissionValue < 0) return

    if (mode === 'create') {
      const payload = {
        customTitle: form.customTitle.trim(),
        customDescription: form.customDescription.trim(),
        commissionType: form.commissionType,
        commissionValue,
      }

      // If sourcePackage is passed (direct action from card)
      if (sourcePackage) {
        if (sourcePackage.sourceType === 'whitelabel') {
          payload.parentWhitelabelId = sourcePackage._id
        } else {
          payload.packageId = sourcePackage._id
        }
      } else {
        // If selecting from dropdown
        const selected = eligiblePackages.find(p => String(p._id) === String(form.packageId))
        if (!selected) return
        
        if (selected.sourceType === 'whitelabel') {
          payload.parentWhitelabelId = selected._id
        } else {
          payload.packageId = selected._id
        }
      }

      if (!payload.packageId && !payload.parentWhitelabelId) return
      await onSubmit(payload)
    } else if (whitelabel?._id) {
      await onSubmit(whitelabel._id, {
        customTitle: form.customTitle.trim(),
        customDescription: form.customDescription.trim(),
        commissionType: form.commissionType,
        commissionValue,
        isActive: form.isActive,
        visibleToChildren: form.visibleToSubChildren,
      })
    }
  }

  const title = mode === 'create' ? 'Create white-label package' : 'Edit white-label package'

  const footer = (
    <div className="flex justify-end gap-3 p-4">
      <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="whitelabel-form"
        disabled={
          loading ||
          (mode === 'create' && !sourcePackage && eligiblePackages.length === 0)
        }
      >
        {loading ? 'Saving…' : mode === 'create' ? 'Create' : 'Save changes'}
      </Button>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="md">
      <form id="whitelabel-form" onSubmit={handleSubmit} className="space-y-4">
        {mode === 'create' && !sourcePackage && (
          <div>
            <label htmlFor="wl-package" className="mb-1 block text-sm font-medium text-gray-700">
              Parent package
            </label>
            {eligiblePackages.length === 0 ? (
              <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Every available package already has a white-label. Edit an existing offer from the list below or from
                the package card.
              </p>
            ) : (
              <select
                id="wl-package"
                className="input-field w-full"
                value={form.packageId}
                onChange={(e) => {
                  const id = e.target.value
                  const selected = eligiblePackages.find(p => String(p._id) === String(id))
                  if (selected) {
                    const isWl = selected.sourceType === 'whitelabel'
                    let title = isWl ? (selected.customTitle || selected.originalPackage?.title) : (selected.title || '')
                    if (title) {
                      title = title.replace(/\s*[—|-]\s*your\s*offer$/i, '').trim()
                    }
                    const desc = isWl ? (selected.customDescription || selected.originalPackage?.description) : (selected.description || '')
                    setForm(f => ({
                      ...f,
                      packageId: id,
                      customTitle: title ? `${title} — your offer` : '',
                      customDescription: desc || ''
                    }))
                  } else {
                    setForm(f => ({ ...f, packageId: id }))
                  }
                }}
                required
              >
                <option value="">Select a package…</option>
                {eligiblePackages.map((p) => {
                  const isWl = p.sourceType === 'whitelabel'
                  const pTitle = isWl ? (p.customTitle || p.originalPackage?.title) : p.title
                  return (
                    <option key={p._id} value={p._id}>
                      {isWl ? '[WL] ' : ''}{pTitle}
                      {p.destination ? ` — ${p.destination}` : ''}
                    </option>
                  )
                })}
              </select>
            )}
          </div>
        )}

        {mode === 'create' && sourcePackage && (
          <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <span className="font-medium text-gray-800">Base package:</span> {sourcePackage.sourceType === 'whitelabel' ? (sourcePackage.customTitle || sourcePackage.originalPackage?.title) : sourcePackage.title}
            {(sourcePackage.basePrice != null || sourcePackage.finalPrice != null) ? (
              <span className="text-gray-500"> · Base ₹{Number(sourcePackage.sourceType === 'whitelabel' ? sourcePackage.finalPrice : sourcePackage.basePrice).toLocaleString('en-IN')}</span>
            ) : null}
          </p>
        )}

        {mode === 'edit' && whitelabel?.originalPackage && (
          <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <span className="font-medium text-gray-800">Original:</span>{' '}
            {whitelabel.originalPackage.title || '—'}
          </p>
        )}

        <div>
          <label htmlFor="wl-title" className="mb-1 block text-sm font-medium text-gray-700">
            Display title
          </label>
          <input
            id="wl-title"
            className="input-field w-full"
            value={form.customTitle}
            onChange={(e) => setForm((f) => ({ ...f, customTitle: e.target.value }))}
            required
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="wl-desc" className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="wl-desc"
            className="input-field min-h-[88px] w-full resize-y"
            value={form.customDescription}
            onChange={(e) => setForm((f) => ({ ...f, customDescription: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">Markup type</span>
            <div className="flex gap-4 text-sm">
              <label className={`flex items-center gap-2 ${form.isPriceLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input
                  type="radio"
                  name="commissionType"
                  checked={form.commissionType === 'flat'}
                  onChange={() => setForm((f) => ({ ...f, commissionType: 'flat' }))}
                  disabled={form.isPriceLocked}
                />
                Flat (₹)
              </label>
              <label className={`flex items-center gap-2 ${form.isPriceLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input
                  type="radio"
                  name="commissionType"
                  checked={form.commissionType === 'percentage'}
                  onChange={() => setForm((f) => ({ ...f, commissionType: 'percentage' }))}
                  disabled={form.isPriceLocked}
                />
                Percent (%)
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="wl-commission" className="mb-1 block text-sm font-medium text-gray-700">
              Markup value
            </label>
            <input
              id="wl-commission"
              type="number"
              min={0}
              step="0.01"
              className="input-field w-full disabled:bg-gray-50 disabled:text-gray-400"
              value={form.commissionValue}
              onChange={(e) => setForm((f) => ({ ...f, commissionValue: e.target.value }))}
              onWheel={(e) => e.target.blur()}
              required
              disabled={form.isPriceLocked}
            />
          </div>
        </div>
        {form.isPriceLocked && (
          <p className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-600">!</span>
            Markup is locked once the white-label offer is created.
          </p>
        )}

        {mode === 'edit' && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-primary-50 to-primary-50/50 border border-primary-100 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Offer Status</p>
                <p className="mt-0.5 text-xs text-gray-600">
                  {form.isActive ? 'This offer is active and bookable' : 'This offer is paused'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  form.isActive
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                    form.isActive ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
