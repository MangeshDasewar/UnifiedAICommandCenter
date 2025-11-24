import { NextResponse } from "next/server"
import { getDb, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDb()

    const userCount = ((db.prepare("SELECT COUNT(*) as count FROM users").get() as any) || { count: 0 }).count
    const templateCount = ((db.prepare("SELECT COUNT(*) as count FROM templates").get() as any) || { count: 0 }).count
    const workflowCount = ((db.prepare("SELECT COUNT(*) as count FROM workflows").get() as any) || { count: 0 }).count

    return NextResponse.json(
      {
        message: "Database initialized successfully",
        status: "ready",
        data: {
          users: userCount,
          templates: templateCount,
          workflows: workflowCount,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Init error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
