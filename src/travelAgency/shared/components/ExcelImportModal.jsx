import { useState, useEffect, useMemo } from 'react'
import ExcelJS from 'exceljs'
import { X, Check, AlertCircle, Loader2, AlertTriangle } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'

const CRM_FIELDS = [
  { id: 'name',  label: 'Name',  required: true  },
  { id: 'phone', label: 'Phone', required: true,  validate: 'phone' },
  { id: 'email', label: 'Email', required: false, validate: 'email' },
  { id: 'notes', label: 'Notes', required: false  },
]

/* ── validators ─────────────────────────────────────────────── */
const PHONE_RE = /^[\d\s\+\-\(\)\.]{7,15}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function looksLikePhone(val) {
  if (!val) return false
  const s = String(val).trim()
  return PHONE_RE.test(s) && (s.replace(/\D/g, '').length >= 7)
}

function looksLikeEmail(val) {
  if (!val) return true  // email is optional — empty is fine
  return EMAIL_RE.test(String(val).trim())
}

/* check the first few non-empty sample values from a column */
function columnPassesValidation(rows, colIdx, type, sampleSize = 5) {
  if (!type) return { ok: true }
  const samples = rows
    .map(r => r[colIdx])
    .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
    .slice(0, sampleSize)

  if (samples.length === 0) return { ok: true } // no data to validate against

  const passed = samples.filter(v =>
    type === 'phone' ? looksLikePhone(v) : looksLikeEmail(v)
  )

  if (passed.length === 0) {
    return {
      ok: false,
      message: type === 'phone'
        ? 'This column does not look like phone numbers. Please map the correct column.'
        : 'This column does not look like email addresses.',
    }
  }
  return { ok: true }
}

export default function ExcelImportModal({ isOpen, onClose, onImport, file }) {
  const [loading, setLoading] = useState(false)
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])
  const [mapping, setMapping] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isOpen && file) loadFileData()
  }, [isOpen, file])

  const loadFileData = async () => {
    setLoading(true)
    try {
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(file)
      const ws = wb.getWorksheet(1)
      const fileRows = []

      ws.eachRow((row, i) => {
        const values = Array.isArray(row.values) ? row.values.slice(1) : []
        if (i === 1) {
          setHeaders(values.map(v => String(v || '').trim()))
        } else {
          fileRows.push(values)
        }
      })
      setRows(fileRows)

      // Auto-mapping
      const hNames = ws.getRow(1).values.slice(1).map(v => String(v || '').toLowerCase().trim())
      const autoMapping = {}
      CRM_FIELDS.forEach(f => {
        const idx = hNames.findIndex(h => h.includes(f.id) || h === f.label.toLowerCase())
        if (idx !== -1) autoMapping[f.id] = idx
      })
      setMapping(autoMapping)
    } catch (err) {
      console.error('Failed to load excel:', err)
    } finally {
      setLoading(false)
    }
  }

  /* validation errors per field */
  const fieldErrors = useMemo(() => {
    const errs = {}
    CRM_FIELDS.forEach(f => {
      if (!f.validate) return
      if (mapping[f.id] === undefined) return
      const result = columnPassesValidation(rows, mapping[f.id], f.validate)
      if (!result.ok) errs[f.id] = result.message
    })
    return errs
  }, [mapping, rows])

  const handleMap = (fieldId, headerIdx) => {
    setMapping(prev => ({ ...prev, [fieldId]: headerIdx === '' ? undefined : Number(headerIdx) }))
  }

  const isValid = useMemo(() => {
    const requiredMapped = CRM_FIELDS.filter(f => f.required).every(f => mapping[f.id] !== undefined)
    const noErrors = Object.keys(fieldErrors).length === 0
    return requiredMapped && noErrors
  }, [mapping, fieldErrors])

  const handleFinalImport = async () => {
    if (!isValid) return
    setBusy(true)
    try {
      const data = rows.map(row => {
        const obj = {}
        CRM_FIELDS.forEach(f => {
          const colIdx = mapping[f.id]
          if (colIdx !== undefined) obj[f.id] = String(row[colIdx] || '').trim()
        })
        return obj
      }).filter(item => item.name && item.phone)

      if (data.length === 0) {
        alert('No valid rows found to import (Name and Phone are required).')
        setBusy(false)
        return
      }

      await onImport(data)
      onClose()
    } catch (err) {
      console.error('Import failed:', err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Leads from Excel" size="xl">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">

          {/* Left: Field Mapping */}
          <div className="flex-1 space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Column Mapping</h3>
              <p className="text-xs text-gray-500">Match your Excel columns to the contact fields below.</p>
            </div>

            <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
              {CRM_FIELDS.map(field => {
                const hasError = !!fieldErrors[field.id]
                return (
                  <div key={field.id}
                    className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${hasError ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="ml-1 text-red-500">*</span>}
                      </label>
                      {mapping[field.id] !== undefined && !hasError && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600">
                          <Check size={12} /> Mapped
                        </span>
                      )}
                      {hasError && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-500">
                          <AlertTriangle size={12} /> Invalid
                        </span>
                      )}
                    </div>

                    <select
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        hasError
                          ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200'
                          : 'border-gray-200 bg-gray-50 focus:border-primary-500 focus:ring-primary-500/10'
                      }`}
                      value={mapping[field.id] ?? ''}
                      onChange={e => handleMap(field.id, e.target.value)}
                    >
                      <option value="">-- Select column --</option>
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx}>{h}</option>
                      ))}
                    </select>

                    {hasError ? (
                      <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-red-500">
                        <AlertCircle size={11} /> {fieldErrors[field.id]}
                      </p>
                    ) : (
                      <div className="mt-2 text-[11px] text-gray-400 italic">
                        Sample: {rows[0]?.[mapping[field.id]] !== undefined ? String(rows[0][mapping[field.id]]) : '—'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Data Preview — all rows */}
          <div className="flex-[1.5] space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Data Preview</h3>
              <p className="text-xs text-gray-500">
                {rows.length} {rows.length === 1 ? 'row' : 'rows'} found in your Excel file
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="max-h-[400px] overflow-auto">
                <table className="min-w-full divide-y divide-gray-100 text-left text-[11px]">
                  <thead className="sticky top-0 bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">#</th>
                      {headers.map((h, i) => {
                        const mappedField = CRM_FIELDS.find(f => mapping[f.id] === i)
                        const hasErr = mappedField && fieldErrors[mappedField.id]
                        return (
                          <th key={i} className="px-3 py-2 font-medium">
                            <div className="flex flex-col">
                              <span className="text-gray-400">{h}</span>
                              <span className={
                                hasErr
                                  ? 'font-bold text-red-500'
                                  : mappedField
                                    ? 'font-bold text-primary-600'
                                    : 'font-normal italic text-gray-300'
                              }>
                                {mappedField ? mappedField.label : 'Not mapped'}
                              </span>
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-gray-400">{rIdx + 1}</td>
                        {headers.map((_, cIdx) => (
                          <td key={cIdx} className="max-w-[150px] truncate px-3 py-2 text-gray-600">
                            {String(row[cIdx] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {!isValid && Object.keys(fieldErrors).length === 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <AlertCircle size={14} />
                <span>Please map the required fields (Name, Phone) to continue.</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
        <span className="text-xs text-gray-500">{rows.length} leads found in Excel file</span>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleFinalImport} disabled={!isValid || busy}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:shadow-none">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Import {rows.length > 0 ? `${rows.length} rows` : ''}
          </button>
        </div>
      </div>
    </Modal>
  )
}
