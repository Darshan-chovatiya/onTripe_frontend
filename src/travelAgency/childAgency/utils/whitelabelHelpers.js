/** @param {Array<{ originalPackage?: any, parentWhitelabel?: any }>} whitelabels */
export function mapWhitelabelBySourceId(whitelabels) {
  const m = new Map()
  for (const wl of whitelabels) {
    const pkgId = wl.originalPackage?._id || wl.originalPackage
    const parentWlId = wl.parentWhitelabel?._id || wl.parentWhitelabel
    
    if (pkgId) m.set(String(pkgId), wl)
    if (parentWlId) m.set(String(parentWlId), wl)
  }
  return m
}
