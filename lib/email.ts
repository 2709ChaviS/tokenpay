import { Resend } from 'resend'

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
const FROM = process.env.EMAIL_FROM || 'TokenPay <onboarding@resend.dev>'

export function esc(s: unknown) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

export async function sendEmail(to: string | undefined | null, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY || !to) return { ok: false, reason: 'email not configured' }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({ from: FROM, to, subject, html })
    return error ? { ok: false, reason: error.message } : { ok: true }
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'send failed' }
  }
}

export function shell(inner: string) {
  return `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">${inner}</div>`
}

export function button(href: string, label: string) {
  return `<a href="${esc(href)}" style="display:block;background:#000;color:#fff;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px">${esc(label)}</a>`
}
