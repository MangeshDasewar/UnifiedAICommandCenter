import { NextRequest, NextResponse } from "next/server"
import { getDb, initializeDatabase } from "@/lib/db"
import {
  detectLanguage,
  classifyIntent,
  analyzeSentiment,
  generateAutoResponse,
} from "@/lib/ai-utils"

export const runtime = "nodejs"

// ------------------ POST: Incoming WhatsApp Messages ------------------
export async function POST(req: NextRequest) {
  try {
    initializeDatabase()
    const db = getDb()

    const body = await req.json()
    console.log("[Webhook] WhatsApp payload:", JSON.stringify(body, null, 2))

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const messageObj = changes?.value?.messages?.[0]

    if (!messageObj) {
      console.log("[Webhook] No message in payload")
      return NextResponse.json({ success: true })
    }

    const from = messageObj.from                     // WhatsApp phone
    const text = messageObj.text?.body || ""         // incoming text
    const isAudio = messageObj.type === "audio"
    const audioUrl = isAudio ? messageObj.audio?.id : null

    // 1️⃣ AI Analysis
    const detectedLanguage = detectLanguage(text)
    const intent = classifyIntent(text, detectedLanguage)
    const sentiment = analyzeSentiment(text)
    const autoReply = generateAutoResponse(intent, detectedLanguage, "User")

    // 2️⃣ Insert incoming message into conversations table
    const stmt = db.prepare(
      `INSERT INTO conversations (
          user_id, message_type, channel, content,
          detected_language, intent, sentiment,
          is_audio, audio_url, status, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )

    stmt.run(
      from,               // user_id
      "inbound",          // message_type
      "whatsapp",         // channel
      text,               // content
      detectedLanguage,
      intent,
      sentiment,
      isAudio ? 1 : 0,
      audioUrl,
      "received"
    )

    console.log("[Webhook] Conversation saved ✔")

    // 3️⃣ Auto Reply to User (Optional)
    if (autoReply) {
      await sendWhatsAppReply(from, autoReply)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[Webhook] Error:", err)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}

// ------------------ Send automatic WhatsApp reply ------------------
async function sendWhatsAppReply(to: string, message: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneID = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneID) {
    console.warn("[Webhook] WhatsApp credentials missing → Auto-reply skipped")
    return
  }

  const url = `https://graph.facebook.com/v20.0/${phoneID}/messages`

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message },
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    console.error("[Webhook] Auto-reply failed:", await res.text())
  } else {
    console.log("[Webhook] Auto-reply sent ✔")
  }
}

// ------------------ GET: WhatsApp Webhook Verification ------------------
export async function GET(req: NextRequest) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "verify_token"

  const hubToken = req.nextUrl.searchParams.get("hub.verify_token")
  const challenge = req.nextUrl.searchParams.get("hub.challenge")

  if (hubToken === verifyToken) {
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Invalid token" }, { status: 403 })
}
