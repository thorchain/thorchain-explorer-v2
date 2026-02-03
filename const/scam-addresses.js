/**
 * Known scam addresses (e.g. reported phishing).
 * Used to show warnings on address page and mark transactions as scam.
 */
export const SCAM_ADDRESSES = [
  'thor1w96sfmn0n00f94c82un8t95y44yzyf502pejyz',
  'thor1rp6nedzez62nj3zan5h9q4zs2nlqy9s94vuccq'
]

export function isScamAddress(address) {
  if (!address || typeof address !== 'string') return false
  return SCAM_ADDRESSES.includes(address.toLowerCase())
}
