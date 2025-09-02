export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const DEFAULT_FROM = process.env.REPORTS_FROM_EMAIL || "no-reply@your-domain.com"

  if (!RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY env variable")
  }

  const payload = {
    from: from || DEFAULT_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Failed to send email via Resend: ${res.status} ${text}`)
  }

  return res.json().catch(() => ({}))
}
