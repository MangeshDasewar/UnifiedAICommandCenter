import { type NextRequest, NextResponse } from "next/server"
import { getDb, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDb()
    const workflows = db.prepare("SELECT * FROM workflows ORDER BY created_at DESC").all()
    return NextResponse.json(workflows)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDb()
    const data = await request.json()

    const stmt = db.prepare(
      "INSERT INTO workflows (name, type, description, trigger_type, trigger_value, is_active) VALUES (?, ?, ?, ?, ?, ?)",
    )

    const result = stmt.run(
      data.name,
      data.type,
      data.description || null,
      data.trigger_type,
      data.trigger_value || null,
      data.is_active !== false ? 1 : 0,
    )

    return NextResponse.json({ id: result.lastInsertRowid, ...data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
