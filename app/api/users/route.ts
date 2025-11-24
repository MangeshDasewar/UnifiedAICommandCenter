import { type NextRequest, NextResponse } from "next/server"
import { getDb, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDb()
    const users = db.prepare("SELECT * FROM users LIMIT 100").all()
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDb()
    const data = await request.json()

    const stmt = db.prepare("INSERT INTO users (name, email, phone, role, language, status) VALUES (?, ?, ?, ?, ?, ?)")

    const result = stmt.run(
      data.name,
      data.email,
      data.phone || null,
      data.role || "user",
      data.language || "en",
      data.status || "active",
    )

    return NextResponse.json({ id: result.lastInsertRowid, ...data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
