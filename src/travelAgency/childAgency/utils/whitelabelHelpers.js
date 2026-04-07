/** @param {{ originalPackage?: unknown }} wl */
export function getWhitelabelOriginalPackageId(wl) {
  const op = wl?.originalPackage
  if (op == null) return null
  if (typeof op === 'object' && op !== null && '_id' in op) return String(op._id)
  return String(op)
}

/** @param {Array<{ originalPackage?: unknown }>} whitelabels */
export function mapWhitelabelByOriginalPackageId(whitelabels) {
  const m = new Map()
  for (const wl of whitelabels) {
    const pid = getWhitelabelOriginalPackageId(wl)
    if (pid) m.set(pid, wl)
  }
  return m
}
