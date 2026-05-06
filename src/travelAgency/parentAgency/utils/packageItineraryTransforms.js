/**
 * Maps UI itinerary (days with legacy `events[]`) to backend Package.itinerary shape (`experiences[]`).
 * @see OnTrip-Backend/src/models/Package.js
 */

/** @typedef {{ title?: string, type?: string, description?: string, location?: string, startTime?: string, endTime?: string, duration?: string, image?: string, vendor?: string | null }} FormEvent */

const EVENT_TYPE_TO_CATEGORY = {
  Activity: 'adventure',
  'Hotel CheckIn': 'accommodation',
  'Hotel CheckOut': 'accommodation',
  Transfer: 'transport',
  Other: 'other',
}

const CATEGORY_TO_EVENT_TYPE = {
  adventure: 'Activity',
  sightseeing: 'Activity',
  cultural: 'Activity',
  food: 'Other', // meal is removed from UI types
  leisure: 'Activity',
  transport: 'Transfer',
  accommodation: 'Hotel CheckIn',
  shopping: 'Activity',
  other: 'Other',
}

function parseDurationMinutes(duration) {
  if (duration == null || duration === '') return undefined
  const s = String(duration).trim().toLowerCase()
  const num = parseFloat(s.replace(/[^\d.]/g, ''))
  if (Number.isNaN(num)) return undefined
  if (s.includes('hour') || s.includes('hr')) return Math.round(num * 60)
  if (s.includes('min')) return Math.round(num)
  return Math.round(num)
}

/**
 * @param {Array<{ day?: number, date?: string, dateSuffix?: string, title?: string, description?: string, notes?: string, events?: FormEvent[], experiences?: unknown[] }>} days
 */
export function formItineraryToApi(days) {
  if (!Array.isArray(days)) return []
  return days.map((day, idx) => {
    const dayNum = Number(day.day) || idx + 1
    const rawEvents = Array.isArray(day.events) ? day.events : []
    const experiences = rawEvents
      .filter((ev) => ev && (ev.title || '').trim())
      .map((ev) => {
        const name = (ev.title || 'Activity').trim()
        const category = EVENT_TYPE_TO_CATEGORY[ev.type] || 'other'
        const exp = {
          name,
          category,
          description: ev.description || '',
          location: ev.location || '',
          mapsLink: '',
          startTime: ev.startTime || '',
          endTime: ev.endTime || '',
          durationMinutes: parseDurationMinutes(ev.duration),
          isOptional: false,
          isHighlight: false,
          images: ev.image ? [ev.image] : [],
          videoUrl: '',
          vendor: ev.vendor && String(ev.vendor).trim() ? ev.vendor : null,
          vendorNotes: '',
          whatToBring: [],
          difficulty: 'easy',
          includedInPrice: ev.extraChargeable !== undefined ? !ev.extraChargeable : ev.includedInPrice !== false,
          extraCost: Number(ev.extraCost) || 0,
        }
        return exp
      })

    let dateVal = day.date
    if (!dateVal && day.dateSuffix) {
      try {
        const tryDate = new Date(day.dateSuffix)
        if (!Number.isNaN(tryDate.getTime())) dateVal = tryDate.toISOString()
      } catch {
        /* ignore */
      }
    }

    return {
      day: dayNum,
      date: dateVal || undefined,
      title: day.title || '',
      description: day.description || '',
      experiences,
      meals: {
        breakfast: false,
        lunch: false,
        dinner: false,
      },
      notes: day.notes || '',
    }
  })
}

/**
 * API day -> form day with `events` for PackageFormModal
 * @param {unknown} day
 */
function apiDayToForm(day, index) {
  if (!day || typeof day !== 'object') return { day: index + 1, title: '', description: '', dateSuffix: '', events: [] }
  const d = /** @type {Record<string, unknown>} */ (day)
  const dayNum = typeof d.day === 'number' ? d.day : index + 1
  let dateSuffix = ''
  if (d.date) {
    try {
      const dt = new Date(/** @type {string} */ (d.date))
      if (!Number.isNaN(dt.getTime())) {
        dateSuffix = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      }
    } catch {
      /* ignore */
    }
  }

  const list = Array.isArray(d.experiences) ? d.experiences : Array.isArray(d.events) ? d.events : []

  const events = list.map((raw) => {
    const ex = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
    const name = ex.name != null ? String(ex.name) : ex.title != null ? String(ex.title) : ''
    const cat = ex.category != null ? String(ex.category) : 'other'
    const type = CATEGORY_TO_EVENT_TYPE[cat] || 'other'
    const imgs = Array.isArray(ex.images) ? ex.images : []
    const firstImg = imgs.length ? String(imgs[0]) : ex.image != null ? String(ex.image) : ''
    const vendorId =
      ex.vendor && typeof ex.vendor === 'object' && ex.vendor !== null && '_id' in ex.vendor
        ? String(/** @type {{ _id: unknown }} */ (ex.vendor)._id)
        : ex.vendor != null
          ? String(ex.vendor)
          : ''

    let durationStr = ''
    if (ex.durationMinutes != null && typeof ex.durationMinutes === 'number') {
      const m = ex.durationMinutes
      durationStr = m >= 60 ? `${Math.round(m / 60)} Hours` : `${m} min`
    }

    return {
      title: name,
      type,
      description: ex.description != null ? String(ex.description) : '',
      location: ex.location != null ? String(ex.location) : '',
      startTime: ex.startTime != null ? String(ex.startTime) : '',
      endTime: ex.endTime != null ? String(ex.endTime) : '',
      duration: durationStr,
      image: firstImg,
      vendor: vendorId || null,
      includedInPrice: ex.includedInPrice !== false,
      extraChargeable: ex.includedInPrice === false,
      extraCost: ex.extraCost || '',
    }
  })

  return {
    day: dayNum,
    dateSuffix,
    title: d.title != null ? String(d.title) : '',
    description: d.description != null ? String(d.description) : '',
    notes: d.notes != null ? String(d.notes) : '',
    events,
  }
}

/**
 * @param {unknown[]} itinerary
 */
export function apiItineraryToForm(itinerary) {
  if (!Array.isArray(itinerary) || itinerary.length === 0) {
    return [{ day: 1, dateSuffix: '', title: '', description: '', events: [] }]
  }
  return itinerary.map((day, i) => apiDayToForm(day, i))
}

/**
 * Normalize a day for PackageDetail view: unified `displayEvents[]`
 * @param {unknown} day
 */
export function getDisplayEventsForDay(day) {
  if (!day || typeof day !== 'object') return []
  const d = /** @type {Record<string, unknown>} */ (day)
  if (Array.isArray(d.events) && d.events.length) {
    return d.events.map((ev) => {
      const e = ev && typeof ev === 'object' ? /** @type {Record<string, unknown>} */ (ev) : {}
      return {
        title: e.title != null ? String(e.title) : '',
        type: e.type != null ? String(e.type) : 'other',
        description: e.description != null ? String(e.description) : '',
        startTime: e.startTime != null ? String(e.startTime) : '',
        endTime: e.endTime != null ? String(e.endTime) : '',
        duration: e.duration != null ? String(e.duration) : '',
        location: e.location != null ? String(e.location) : '',
        image: e.image != null ? String(e.image) : '',
        vendor: e.vendor,
      }
    })
  }
  if (!Array.isArray(d.experiences) || !d.experiences.length) return []
  return d.experiences.map((raw) => {
    const ex = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
    const cat = ex.category != null ? String(ex.category) : 'other'
    const type = CATEGORY_TO_EVENT_TYPE[cat] || 'other'
    const imgs = Array.isArray(ex.images) ? ex.images : []
    const img = imgs.length ? String(imgs[0]) : ''
    let duration = ''
    if (ex.durationMinutes != null && typeof ex.durationMinutes === 'number') {
      const m = ex.durationMinutes
      duration = m >= 60 ? `${Math.round(m / 60)} Hours` : `${m} min`
    }
    return {
      title: ex.name != null ? String(ex.name) : '',
      type,
      description: ex.description != null ? String(ex.description) : '',
      startTime: ex.startTime != null ? String(ex.startTime) : '',
      endTime: ex.endTime != null ? String(ex.endTime) : '',
      duration,
      location: ex.location != null ? String(ex.location) : '',
      image: img,
      vendor: ex.vendor,
    }
  })
}

/**
 * Rich experience rows for package detail (legacy `events` or API `experiences`).
 * @param {unknown} day
 */
export function getDetailExperiencesForDay(day) {
  if (!day || typeof day !== 'object') return []
  const d = /** @type {Record<string, unknown>} */ (day)

  if (Array.isArray(d.events) && d.events.length) {
    return d.events.map((raw) => {
      const e = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
      const typeStr = e.type != null ? String(e.type) : 'other'
      const imgs = e.image ? [String(e.image)] : []
      return {
        title: e.title != null ? String(e.title) : '',
        type: typeStr,
        category: typeStr,
        description: e.description != null ? String(e.description) : '',
        location: e.location != null ? String(e.location) : '',
        mapsLink: null,
        startTime: e.startTime != null ? String(e.startTime) : '',
        endTime: e.endTime != null ? String(e.endTime) : '',
        durationStr: e.duration != null ? String(e.duration) : '',
        images: imgs,
        videoUrl: null,
        whatToBring: [],
        difficulty: null,
        minAge: undefined,
        maxAge: undefined,
        isOptional: false,
        isHighlight: false,
        includedInPrice: true,
        extraChargeable: false,
        extraCost: undefined,
        vendorNotes: '',
        vendor: e.vendor,
      }
    })
  }

  if (!Array.isArray(d.experiences) || !d.experiences.length) return []

  return d.experiences.map((raw) => {
    const ex = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
    const cat = ex.category != null ? String(ex.category) : 'other'
    const type = CATEGORY_TO_EVENT_TYPE[cat] || 'other'
    const imgs = Array.isArray(ex.images) ? ex.images.map((x) => String(x)) : []
    let durationStr = ''
    if (ex.durationMinutes != null && typeof ex.durationMinutes === 'number') {
      const m = ex.durationMinutes
      durationStr = m >= 60 ? `${Math.round(m / 60)} Hours` : `${m} min`
    }
    const extra =
      typeof ex.extraCost === 'number' && !Number.isNaN(ex.extraCost) ? ex.extraCost : undefined
    return {
      title: ex.name != null ? String(ex.name) : '',
      type,
      category: cat,
      description: ex.description != null ? String(ex.description) : '',
      location: ex.location != null ? String(ex.location) : '',
      mapsLink: ex.mapsLink != null && String(ex.mapsLink).trim() ? String(ex.mapsLink) : null,
      startTime: ex.startTime != null ? String(ex.startTime) : '',
      endTime: ex.endTime != null ? String(ex.endTime) : '',
      durationStr,
      images: imgs,
      videoUrl: ex.videoUrl != null && String(ex.videoUrl).trim() ? String(ex.videoUrl) : null,
      whatToBring: Array.isArray(ex.whatToBring) ? ex.whatToBring.map(String) : [],
      difficulty: ex.difficulty != null ? String(ex.difficulty) : null,
      minAge: typeof ex.minAge === 'number' ? ex.minAge : undefined,
      maxAge: typeof ex.maxAge === 'number' ? ex.maxAge : undefined,
      isOptional: Boolean(ex.isOptional),
      isHighlight: Boolean(ex.isHighlight),
      includedInPrice: ex.includedInPrice !== false,
      extraChargeable: ex.includedInPrice === false,
      extraCost: extra,
      vendorNotes: ex.vendorNotes != null ? String(ex.vendorNotes) : '',
      vendor: ex.vendor,
    }
  })
}
