import { NextResponse } from "next/server"
import { getDb, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDb()

    const getCount = (query: string, params: any = []) => {
      try {
        const result = db.prepare(query).get(...params) as any
        return result?.count || 0
      } catch {
        return 0
      }
    }

    const stats = {
      total_users: getCount("SELECT COUNT(*) as count FROM users"),
      total_notifications: getCount("SELECT COUNT(*) as count FROM notifications"),
      notifications_sent: getCount("SELECT COUNT(*) as count FROM notifications WHERE status IN ('sent', 'delivered')"),
      notifications_failed: getCount("SELECT COUNT(*) as count FROM notifications WHERE status = 'failed'"),
      total_conversations: getCount("SELECT COUNT(*) as count FROM conversations"),
      active_workflows: getCount("SELECT COUNT(*) as count FROM workflow_instances WHERE status = ?", ["in_progress"]),
      escalations: getCount("SELECT COUNT(*) as count FROM conversations WHERE sentiment IN ('confused', 'negative')"),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Analytics error:", error)
    return NextResponse.json(
      {
        total_users: 0,
        total_notifications: 0,
        notifications_sent: 0,
        notifications_failed: 0,
        total_conversations: 0,
        active_workflows: 0,
        escalations: 0,
      },
      { status: 200 },
    )
  }
}
