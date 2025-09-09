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

  async function postEmail(sender: string) {
    const payload = {
      from: sender,
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
    return res
  }

  // First try with configured sender
  let res = await postEmail(from || DEFAULT_FROM)

  // If domain not verified, fallback to Resend sandbox sender for production continuity
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    const isDomainNotVerified = text.includes("domain is not verified") || text.includes("validation_error")
    if (isDomainNotVerified && (from || DEFAULT_FROM) !== "onboarding@resend.dev") {
      res = await postEmail("onboarding@resend.dev")
    } else {
      throw new Error(`Failed to send email via Resend: ${res.status} ${text}`)
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Failed to send email via Resend: ${res.status} ${text}`)
  }

  return res.json().catch(() => ({}))
}
