import { useEffect, useState } from 'react'
import Modal from '@/shared/components/Modal.jsx'
import Button from '@/shared/components/Button.jsx'

const emptyCreate = (pkg) => ({
  packageId: pkg?._id || '',
  customTitle: pkg ? `${pkg.title} — your offer` : '',
  customDescription: pkg?.description || '',
  commissionType: 'flat',
  commissionValue: '0',
})

const emptyEdit = (item) => ({
  customTitle: item?.customTitle || '',
  customDescription: item?.customDescription || '',
  commissionType: item?.commissionType || 'flat',
  commissionValue: String(item?.commissionValue ?? 0),
  isActive: item?.isActive !== false,
  visibleToSubChildren: item?.visibleToSubChildren !== false,
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
      const packageId = sourcePackage?._id || form.packageId
      if (!packageId) return
      await onSubmit({
        packageId,
        customTitle: form.customTitle.trim(),
        customDescription: form.customDescription.trim(),
        commissionType: form.commissionType,
        commissionValue,
      })
    } else if (whitelabel?._id) {
      await onSubmit(whitelabel._id, {
        customTitle: form.customTitle.trim(),
        customDescription: form.customDescription.trim(),
        commissionType: form.commissionType,
        commissionValue,
        isActive: form.isActive,
        visibleToSubChildren: form.visibleToSubChildren,
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
                onChange={(e) => setForm((f) => ({ ...f, packageId: e.target.value }))}
                required
              >
                <option value="">Select a package…</option>
                {eligiblePackages.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                    {p.destination ? ` — ${p.destination}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {mode === 'create' && sourcePackage && (
          <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <span className="font-medium text-gray-800">Base package:</span> {sourcePackage.title}
            {sourcePackage.basePrice != null ? (
              <span className="text-gray-500"> · Base ₹{Number(sourcePackage.basePrice).toLocaleString('en-IN')}</span>
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
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="commissionType"
                  checked={form.commissionType === 'flat'}
                  onChange={() => setForm((f) => ({ ...f, commissionType: 'flat' }))}
                />
                Flat (₹)
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="commissionType"
                  checked={form.commissionType === 'percentage'}
                  onChange={() => setForm((f) => ({ ...f, commissionType: 'percentage' }))}
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
              className="input-field w-full"
              value={form.commissionValue}
              onChange={(e) => setForm((f) => ({ ...f, commissionValue: e.target.value }))}
              required
            />
          </div>
        </div>

        {mode === 'edit' && (
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active (offer is bookable)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.visibleToSubChildren}
                onChange={(e) => setForm((f) => ({ ...f, visibleToSubChildren: e.target.checked }))}
              />
              Visible to sub-child agents
            </label>
          </div>
        )}
      </form>
    </Modal>
  )
}
