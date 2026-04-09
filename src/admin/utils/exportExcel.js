import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const NAVY   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
const LBLFIL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
const STRIPE = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
const WHITE  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
const HFONT  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' }
const LFONT  = { bold: true, color: { argb: 'FF334155' }, size: 10, name: 'Calibri' }
const VFONT  = { color: { argb: 'FF1E293B' }, size: 10, name: 'Calibri' }
const CENTER = { horizontal: 'center', vertical: 'middle' }
const MIDDLE = { vertical: 'middle' }
const TBDR   = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } }
const MBDR   = { bottom: { style: 'medium', color: { argb: 'FF3B82F6' } } }

/** Style a header row (row 1) of a worksheet */
export function styleHeaderRow(ws, height = 24) {
  const row = ws.getRow(1)
  row.height = height
  row.eachCell((cell) => {
    cell.fill = NAVY; cell.font = HFONT; cell.alignment = CENTER; cell.border = MBDR
  })
}

/** Style a data row with alternating stripe */
export function styleDataRow(row, idx) {
  row.height = 18
  row.eachCell((cell) => {
    cell.fill = idx % 2 === 0 ? STRIPE : WHITE
    cell.font = VFONT; cell.alignment = MIDDLE; cell.border = TBDR
  })
}

/** Add a labelled info sheet (key-value pairs) with a title row */
export function addInfoSheet(wb, sheetName, title, infoRows) {
  const ws = wb.addWorksheet(sheetName)
  ws.columns = [{ key: 'label', width: 26 }, { key: 'value', width: 48 }]
  ws.mergeCells('A1:B1')
  const t = ws.getCell('A1')
  t.value = title; t.font = HFONT; t.fill = NAVY; t.alignment = CENTER
  ws.getRow(1).height = 28
  infoRows.forEach(([label, value]) => {
    const r = ws.addRow({ label, value })
    r.height = 20
    const lc = r.getCell('label'); const vc = r.getCell('value')
    lc.font = LFONT; lc.fill = LBLFIL; lc.alignment = MIDDLE; lc.border = TBDR
    vc.font = VFONT; vc.alignment = MIDDLE; vc.border = TBDR
  })
  return ws
}

/**
 * Generic flat-rows export — single sheet.
 * @param {object[]} rows
 * @param {string} filename
 * @param {string} sheetName
 */
export async function exportToExcel(rows, filename = 'export', sheetName = 'Sheet1') {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'OnTrip Admin'; wb.created = new Date()
  const ws = wb.addWorksheet(sheetName)
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
  ws.columns = headers.map((h) => ({
    header: h, key: h, width: Math.min(Math.max(h.length + 4, 14), 40),
  }))
  styleHeaderRow(ws)
  rows.forEach((row, idx) => {
    styleDataRow(ws.addRow(headers.map((h) => row[h] ?? '')), idx)
  })
  const buf = await wb.xlsx.writeBuffer()
  saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${filename}.xlsx`)
}

/** Build and download a bookings Excel with a Trip Info sheet + Bookings sheet */
export async function exportBookingsExcel(pkgData, allBookings, filename) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'OnTrip Admin'; wb.created = new Date()

  // Sheet 1 — Trip Info
  addInfoSheet(wb, 'Trip Info', `Trip — ${pkgData?.title || ''}`, [
    ['Package Title',    pkgData?.title || '—'],
    ['Destination',      pkgData?.destination || '—'],
    ['Total Days',       pkgData?.totalDays ?? '—'],
    ['Base Price (INR)', `₹${Number(pkgData?.basePrice || 0).toLocaleString('en-IN')}`],
    ['Currency',         pkgData?.currency || 'INR'],
    ['Max Capacity',     pkgData?.maxCapacity ?? '—'],
    ['Status',           pkgData?.isActive ? 'Active' : 'Inactive'],
    ['Description',      pkgData?.description || '—'],
    ['Agency Name',      pkgData?.createdBy?.name || '—'],
    ['Agency Code',      pkgData?.createdBy?.agentCode || '—'],
    ['Agency Email',     pkgData?.createdBy?.email || '—'],
    ['Total Bookings',   allBookings.length],
  ])

  // Sheet 2 — Bookings + Travelers
  const maxTravelers = allBookings.reduce(
    (m, b) => Math.max(m, Array.isArray(b.travelers) ? b.travelers.length : 0), 0
  )
  const bHeaders = [
    'Booking #', 'Booking ID',
    'Booked By', 'Booked By Email', 'Agent Code',
    'Customer Name', 'Customer Email', 'Customer Phone',
    'Booked On', 'Travel Date',
    'Traveler Count', 'Total Amount (INR)', 'Payment Status', 'Booking Status',
  ]
  for (let i = 1; i <= maxTravelers; i++) bHeaders.push(`Traveler ${i} Name`, `Traveler ${i} Age`)

  const bookWs = wb.addWorksheet('Bookings')
  bookWs.views = [{ state: 'frozen', ySplit: 1 }]
  bookWs.columns = bHeaders.map((h) => ({ header: h, key: h, width: Math.min(Math.max(h.length + 4, 14), 38) }))
  styleHeaderRow(bookWs)

  allBookings.forEach((b, idx) => {
    const travelers = Array.isArray(b.travelers) ? b.travelers : []
    const row = {
      'Booking #':          idx + 1,
      'Booking ID':         b.bookingId || '—',
      'Booked By':          b.bookedBy?.name || '—',
      'Booked By Email':    b.bookedBy?.email || '—',
      'Agent Code':         b.bookedBy?.agentCode || '—',
      'Customer Name':      b.customer?.name || '—',
      'Customer Email':     b.customer?.email || '—',
      'Customer Phone':     b.customer?.phone || '—',
      'Booked On':          b.createdAt ? new Date(b.createdAt).toLocaleString() : '—',
      'Travel Date':        b.travelDate ? new Date(b.travelDate).toLocaleDateString() : '—',
      'Traveler Count':     b.travelerCount ?? travelers.length,
      'Total Amount (INR)': Number(b.totalAmount || 0),
      'Payment Status':     b.paymentStatus || '—',
      'Booking Status':     b.bookingStatus || '—',
    }
    for (let i = 1; i <= maxTravelers; i++) {
      const t = travelers[i - 1]
      row[`Traveler ${i} Name`] = t?.name || ''
      row[`Traveler ${i} Age`]  = t?.age ?? ''
    }
    styleDataRow(bookWs.addRow(row), idx)
  })

  const buf = await wb.xlsx.writeBuffer()
  const safeName = (filename || 'bookings').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${safeName}.xlsx`)
}
