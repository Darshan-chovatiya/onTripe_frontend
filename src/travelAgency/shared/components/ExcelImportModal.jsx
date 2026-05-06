import { useState, useEffect, useMemo } from 'react'
import ExcelJS from 'exceljs'
import { X, Check, AlertCircle, Loader2 } from 'lucide-react'
import Modal from '@/shared/components/Modal.jsx'

const CRM_FIELDS = [
  { id: 'name', label: 'Name', required: true },
  { id: 'phone', label: 'Phone', required: true },
  { id: 'email', label: 'Email', required: false },
  { id: 'notes', label: 'Notes', required: false },
  { id: 'address', label: 'Address', required: false },
]

export default function ExcelImportModal({ isOpen, onClose, onImport, file }) {
  const [loading, setLoading] = useState(false)
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])
  const [mapping, setMapping] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isOpen && file) {
      loadFileData()
    }
  }, [isOpen, file])

  const loadFileData = async () => {
    setLoading(true)
    try {
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(file)
      const ws = wb.getWorksheet(1)
      
      const fileHeaders = []
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

      // Auto-mapping logic
      const autoMapping = {}
      const hNames = ws.getRow(1).values.slice(1).map(v => String(v || '').toLowerCase().trim())
      
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

  const handleMap = (fieldId, headerIdx) => {
    setMapping(prev => ({ ...prev, [fieldId]: headerIdx === '' ? undefined : Number(headerIdx) }))
  }

  const isValid = useMemo(() => {
    return CRM_FIELDS.filter(f => f.required).every(f => mapping[f.id] !== undefined)
  }, [mapping])

  const handleFinalImport = async () => {
    if (!isValid) return
    setBusy(true)
    try {
      const data = rows.map(row => {
        const obj = {}
        CRM_FIELDS.forEach(f => {
          const colIdx = mapping[f.id]
          if (colIdx !== undefined) {
            obj[f.id] = String(row[colIdx] || '').trim()
          }
        })
        return obj
      }).filter(item => {
        // Basic validation: must have name and phone
        return item.name && item.phone
      })

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
          {/* Left Side: Mapping */}
          <div className="flex-1 space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Column Mapping</h3>
              <p className="text-xs text-gray-500">Match your Excel columns to the contact fields below.</p>
            </div>

            <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {CRM_FIELDS.map(field => (
                <div key={field.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="ml-1 text-red-500">*</span>}
                    </label>
                    {mapping[field.id] !== undefined && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600">
                        <Check size={12} /> Mapped
                      </span>
                    )}
                  </div>
                  
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/10"
                    value={mapping[field.id] ?? ''}
                    onChange={(e) => handleMap(field.id, e.target.value)}
                  >
                    <option value="">-- Select Field to Map --</option>
                    {headers.map((h, idx) => (
                      <option key={idx} value={idx}>{h}</option>
                    ))}
                  </select>

                  <div className="mt-2 text-[11px] text-gray-400 italic">
                    Sample: {rows[0]?.[mapping[field.id]] || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Data Preview */}
          <div className="flex-[1.5] space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Data Preview</h3>
              <p className="text-xs text-gray-500">All {rows.length} rows from your Excel file</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="max-h-[400px] overflow-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-100 text-left text-[11px]">
                  <thead className="sticky top-0 bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">#</th>
                      {headers.map((h, i) => {
                        const mappedField = CRM_FIELDS.find(f => mapping[f.id] === i)
                        return (
                          <th key={i} className="px-3 py-2 font-medium">
                            <div className="flex flex-col">
                              <span className="text-gray-400">{h}</span>
                              <span className={mappedField ? "text-primary-600 font-bold" : "text-gray-300 font-normal italic"}>
                                {mappedField ? mappedField.label : 'Not Mapped'}
                              </span>
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.slice(0, 15).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-gray-400">{rIdx + 1}</td>
                        {headers.map((_, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-gray-600 truncate max-w-[150px]">
                            {String(row[cIdx] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 15 && (
                <div className="border-t border-gray-50 bg-gray-50/30 px-3 py-2 text-center text-[10px] text-gray-400">
                  Showing first 15 rows...
                </div>
              )}
            </div>
            
            {!isValid && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <AlertCircle size={14} />
                <span>Please map the required fields (Name, Phone) to continue.</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
        <span className="text-xs text-gray-500">
          {rows.length} leads found in Excel file
        </span>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleFinalImport}
            disabled={!isValid || busy}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-md hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Next: Review Data
          </button>
        </div>
      </div>
    </Modal>
  )
}
