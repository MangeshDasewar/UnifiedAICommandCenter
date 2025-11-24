import { type NextRequest, NextResponse } from "next/server"
import { getDb, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDb()
    const templates = db.prepare("SELECT * FROM templates ORDER BY created_at DESC").all()
    return NextResponse.json(Array.isArray(templates) ? templates : [])
  } catch (error) {
    console.error("[v0] Error fetching templates:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDb()
    const data = await request.json()

    const required = ["name", "type", "language", "content", "channel"]
    const missing = required.filter((field) => !data[field])
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 })
    }

    const stmt = db.prepare(
      "INSERT INTO templates (name, type, language, content, subject, variables, channel) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )

    const result = stmt.run(
      data.name,
      data.type,
      data.language,
      data.content,
      data.subject || null,
      JSON.stringify(data.variables || []),
      data.channel,
    )

    const newTemplate = {
      id: result.lastInsertRowid,
      name: data.name,
      type: data.type,
      language: data.language,
      content: data.content,
      channel: data.channel,
      subject: data.subject || null,
      variables: data.variables || [],
      created_at: new Date().toISOString(),
    }

    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error) {
    console.error("[v0] Template error:", error)
    return NextResponse.json({ error: `Failed to create template: ${String(error)}` }, { status: 500 })
  }
}
