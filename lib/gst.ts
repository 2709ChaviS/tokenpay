export const GST_RATE = 18

// Unregistered freelancers must NOT charge GST. Only charge if a GSTIN is on file.
export function gstRateFor(gstNumber?: string | null) {
  return gstNumber && gstNumber.trim().length >= 15 ? GST_RATE : 0
}

export function money(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function splitAmount(base: number, rate: number) {
  const gst = money((base * rate) / 100)
  return { gst, final: money(base + gst) }
}
