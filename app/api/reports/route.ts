import { NextResponse } from "next/server"
import { sanitizeHtml } from "@/lib/utils"
import { sendEmail } from "@/lib/email"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    const form = {
      title: String(body.title ?? "").trim(),
      description: String(body.description ?? "").trim(),
      reporter_id: (body.reporter_id ?? "") ? String(body.reporter_id).trim() : null,
      reported_content_type: String(body.reported_content_type ?? "casino").trim(),
      reported_content_id: (body.reported_content_id ?? "") ? String(body.reported_content_id).trim() : null,
      reason: String(body.reason ?? "").trim(),
      category: body.category ? String(body.category).trim() : null,
      priority: (body.priority ?? "medium") as "low" | "medium" | "high" | "urgent",
      amount_disputed:
        body.amount_disputed !== undefined && body.amount_disputed !== null && String(body.amount_disputed) !== ""
          ? Number(body.amount_disputed)
          : null,
      contact_method: (body.contact_method ?? "email") as "email" | "phone" | "both",
      casino_name: body.casino_name ? String(body.casino_name).trim() : null,
    }

    // Basic validations
    if (!form.title || !form.description || !form.reason) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }
    if (form.title.length > 200) {
      return NextResponse.json({ success: false, error: "Title too long (max 200 chars)" }, { status: 400 })
    }
    if (form.description.length > 5000) {
      return NextResponse.json({ success: false, error: "Description too long (max 5000 chars)" }, { status: 400 })
    }
    if (form.reason && form.reason.length > 2000) {
      return NextResponse.json({ success: false, error: "Reason too long (max 2000 chars)" }, { status: 400 })
    }
    const allowedPriorities = ["low", "medium", "high", "urgent"] as const
    if (!allowedPriorities.includes(form.priority)) {
      return NextResponse.json({ success: false, error: "Invalid priority" }, { status: 400 })
    }
    const allowedContacts = ["email", "phone", "both"] as const
    if (!allowedContacts.includes(form.contact_method)) {
      return NextResponse.json({ success: false, error: "Invalid contact method" }, { status: 400 })
    }
    if (form.amount_disputed !== null && Number.isNaN(form.amount_disputed)) {
      return NextResponse.json({ success: false, error: "Invalid amount_disputed" }, { status: 400 })
    }

    // Prepare sanitized payloads
    const safe = {
      title: sanitizeHtml(form.title),
      description: sanitizeHtml(form.description),
      reporter_id: form.reporter_id ? sanitizeHtml(form.reporter_id) : null,
      reported_content_type: sanitizeHtml(form.reported_content_type),
      reported_content_id: form.reported_content_id ? sanitizeHtml(form.reported_content_id) : null,
      reason: sanitizeHtml(form.reason),
      category: form.category ? sanitizeHtml(form.category) : null,
      priority: form.priority,
      amount_disputed: form.amount_disputed,
      contact_method: form.contact_method,
      casino_name: form.casino_name ? sanitizeHtml(form.casino_name) : null,
    }

    const TEAM_EMAIL = process.env.REPORTS_TEAM_EMAIL || process.env.SUPPORT_EMAIL
    if (!TEAM_EMAIL) {
      return NextResponse.json(
        { success: false, error: "Missing team email configuration (REPORTS_TEAM_EMAIL or SUPPORT_EMAIL)" },
        { status: 500 }
      )
    }

    // Store to DB (public insert allowed by RLS policies)
    const supabase = await createClient()
    let stored = false
    try {
      const insertPayload: any = {
        title: safe.title,
        description: safe.description,
        reporter_id: safe.reporter_id,
        reported_content_type: safe.reported_content_type,
        reported_content_id: safe.reported_content_id,
        reason: safe.reason,
        category: safe.category,
        priority: safe.priority,
        amount_disputed: safe.amount_disputed,
        contact_method: safe.contact_method,
        casino_name: safe.casino_name,
        status: 'pending',
      }
      const { error: insertError } = await supabase.from('reports').insert([insertPayload])
      if (!insertError) {
        stored = true
      } else {
        console.error('Public report DB insert failed:', insertError)
      }
    } catch (e) {
      console.error('Unexpected DB error inserting public report:', e)
    }

    const subject = `[New Public Report] ${safe.title}`
    const html = `
      <h2>New Public Report Submitted</h2>
      <p><strong>Title:</strong> ${safe.title}</p>
      <p><strong>Casino Name:</strong> ${safe.casino_name ?? "-"}</p>
      <p><strong>Category:</strong> ${safe.category ?? "-"}</p>
      <p><strong>Priority:</strong> ${safe.priority}</p>
      <p><strong>Contact Method:</strong> ${safe.contact_method}</p>
      <p><strong>Amount Disputed:</strong> ${safe.amount_disputed ?? "-"}</p>
      <p><strong>Reported Content:</strong> ${safe.reported_content_type}${safe.reported_content_id ? ` / ${safe.reported_content_id}` : ''}</p>
      <p><strong>Reporter ID (as provided):</strong> ${safe.reporter_id ?? '(anonymous)'}</p>
      <p><strong>Reason:</strong><br/>${safe.reason}</p>
      <p><strong>Description:</strong><br/>${safe.description}</p>
      <hr/>
      <p>This message was generated from the public Reports submission form.${stored ? '' : ' DB insert failed; email fallback delivered.'}</p>
    `

    await sendEmail({ to: TEAM_EMAIL, subject, html })

    // Revalidate public views
    try {
      revalidatePath('/reports')
    } catch {}

    return NextResponse.json({ success: true, stored: stored })
  } catch (e: any) {
    console.error("Unhandled error in reports POST (email mode):", e)
    return NextResponse.json({ success: false, error: e?.message ?? "Unknown error" }, { status: 500 })
  }
}
