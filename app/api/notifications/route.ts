export const runtime = "nodejs" // required for sqlite + nodemailer
import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { getDb, initializeDatabase } from "@/lib/db"

// ------------------ WhatsApp Sender ------------------
async function sendWhatsAppMessage(to: string, message: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    console.warn("[WhatsApp] Missing env → MOCK MODE")
    return { ok: true, mock: true }
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error("[WhatsApp] Failed:", error)
    throw new Error(error)
  }

  return await res.json()
}

// ------------------ Email Sender ------------------
function getEmailTransporter() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn("[Email] Missing env → MOCK MODE")
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

async function sendEmail(to: string, subject: string, content: string) {
  const transporter = getEmailTransporter()
  const from = process.env.EMAIL_FROM || "GharPey <no-reply@gharpey.com>"

  if (!transporter) {
    console.log("[Email MOCK] Sent:", { to, subject, content })
    return { mock: true }
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: content,
    html: `<p>${content}</p>`,
  })

  console.log("[Email] Sent:", info.messageId)
  return info
}

// ------------------ GET: Fetch notifications ------------------
export async function GET() {
  try {
    initializeDatabase()
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT n.*, u.name as user_name, t.name as template_name
         FROM notifications n
         LEFT JOIN users u ON n.user_id = u.id
         LEFT JOIN templates t ON n.template_id = t.id
         ORDER BY n.created_at DESC
         LIMIT 100`,
      )
      .all()

    return NextResponse.json(rows)
  } catch (error) {
    console.error("[Notifications] GET error:", error)
    return NextResponse.json([], { status: 500 })
  }
}

// ------------------ POST: Create + Send Notification ------------------
export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDb()
    const body = await request.json()

    const {
      user_id = 1,
      template_id = 1,
      channel,
      recipient,
      subject,
      content,
      language,
      workflow_instance_id,
    } = body

    if (!channel || !content) {
      return NextResponse.json(
        { error: "channel & content are required" },
        { status: 400 }
      )
    }

    const rec = recipient || body.email || body.phone || "unknown"

    // Insert into DB as pending
    const insert = db.prepare(
      `INSERT INTO notifications 
       (user_id, template_id, channel, subject, content, status, workflow_instance_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )

    const result = insert.run(
      user_id,
      template_id,
      channel,
      subject,
      content,
      "pending",
      workflow_instance_id || null
    )

    const id = Number(result.lastInsertRowid)
    let finalStatus = "sent"
    let errorMessage: string | null = null

    // ---- SEND MESSAGE ----
    try {
      if (channel === "whatsapp") {
        await sendWhatsAppMessage(rec, content)
      } else if (channel === "email") {
        await sendEmail(rec, subject || "GharPey Notification", content)
      } else if (channel === "voice") {
        console.log("[Voice] TODO: TTS integration later")
      }
    } catch (err: any) {
      finalStatus = "failed"
      errorMessage = err?.message || "Unknown send error"
    }

    // ---- UPDATE STATUS ----
    db.prepare(
      `UPDATE notifications
       SET status = ?, error_message = ?, sent_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(finalStatus, errorMessage, id)

    // ---- 🔥 INSERT INTO CONVERSATIONS (important!) ----
    const convStmt = db.prepare(
      `INSERT INTO conversations (
        user_id, workflow_instance_id, message_type, channel, content,
        detected_language, intent, sentiment, is_audio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )

    convStmt.run(
      user_id,
      workflow_instance_id || null,
      "outbound",
      channel,
      content,
      language || "en",
      null,
      null,
      channel === "voice" ? 1 : 0
    )

    return NextResponse.json(
      { id, status: finalStatus, recipient: rec, error: errorMessage },
      { status: 201 }
    )
  } catch (error) {
    console.error("[Notifications] POST fatal:", error)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }
}
