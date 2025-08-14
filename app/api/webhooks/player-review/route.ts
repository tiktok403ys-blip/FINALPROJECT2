import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const secret = process.env.WEBHOOK_SECRET || ""
    const provided = req.headers.get("x-webhook-secret") || new URL(req.url).searchParams.get("secret") || ""
    if (!secret || provided !== secret) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const payload = await req.json()
    const slackUrl = process.env.SLACK_WEBHOOK_URL

    if (slackUrl) {
      const text = `New player review pending approval:\n- title: ${payload.title}\n- rating: ${payload.rating}\n- reviewer: ${payload.reviewer_name || "Anonymous"}\n- casino_id: ${payload.casino_id}\nOpen admin: https://${process.env.NEXT_PUBLIC_SITE_DOMAIN || "localhost:3000"}/admin/player-reviews`
      await fetch(slackUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return new NextResponse("Bad Request", { status: 400 })
  }
}


