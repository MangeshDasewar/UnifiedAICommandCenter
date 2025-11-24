import { type NextRequest, NextResponse } from "next/server"
import { getDb, initializeDatabase } from "@/lib/db"
import {
  detectLanguage,
  classifyIntent,
  analyzeSentiment,
  generateAutoResponse,
} from "@/lib/ai-utils"

export const runtime = "nodejs"

// ✅ GET → Return latest conversations for Chat tab
export async function GET() {
  try {
    initializeDatabase()
    const db = getDb()

    const conversations = db
      .prepare(
        `
        SELECT 
          c.*,
          u.name AS user_name
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
        LIMIT 100
        `,
      )
      .all()

    return NextResponse.json(Array.isArray(conversations) ? conversations : [])
  } catch (error) {
    console.error("[Conversations] GET error:", error)
    return NextResponse.json([], { status: 500 })
  }
}

// ✅ POST → (Optional) Create a conversation + run AI on it
export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDb()
    const data = await request.json()

    const {
      user_id = 1,
      workflow_instance_id = null,
      message_type = "inbound",    // "inbound" | "outbound"
      channel = "whatsapp",        // "whatsapp" | "email" | "voice" | "chat"
      content,
      language,
      is_audio = false,
      audio_url = null,
    } = data

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 },
      )
    }

    // 1️⃣ AI analysis
    const detectedLanguage = language || detectLanguage(content)
    const intent = classifyIntent(content, detectedLanguage)
    const sentiment = analyzeSentiment(content)
    const autoResponse = generateAutoResponse(intent, detectedLanguage, "User")

    // 2️⃣ Store conversation in DB
    const stmt = db.prepare(
      `
      INSERT INTO conversations (
        user_id,
        workflow_instance_id,
        message_type,
        channel,
        content,
        language,
        detected_language,
        intent,
        sentiment,
        is_audio,
        audio_url,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
    )

    const result = stmt.run(
      user_id,
      workflow_instance_id,
      message_type,
      channel,
      content,
      language || detectedLanguage,
      detectedLanguage,
      intent,
      sentiment,
      is_audio ? 1 : 0,
      audio_url,
      message_type === "inbound" ? "received" : "sent",
    )

    return NextResponse.json(
      {
        id: result.lastInsertRowid,
        user_id,
        content,
        channel,
        message_type,
        detected_language: detectedLanguage,
        intent,
        sentiment,
        auto_response: autoResponse,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[Conversations] POST error:", error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 },
    )
  }
}
