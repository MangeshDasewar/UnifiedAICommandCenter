import { type NextRequest, NextResponse } from "next/server"

interface SendNotificationRequest {
  channel: "whatsapp" | "email" | "sms"
  recipient: string
  message: string
  language?: string
  isVoice?: boolean
}

// Mock notification sending service
export async function POST(request: NextRequest) {
  try {
    const body: SendNotificationRequest = await request.json()

    console.log("[v0] Sending notification:", body)

    const { channel, recipient, message, language, isVoice } = body

    // Mock sending logic
    const notification = {
      id: Math.random().toString(36).substr(2, 9),
      channel,
      recipient,
      message,
      language: language || "English",
      isVoice: isVoice || false,
      status: "sent",
      timestamp: new Date(),
      deliveredAt: null,
    }

    console.log("[v0] Notification logged:", notification)

    // Mock delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      status: "sent",
    })
  } catch (error) {
    console.error("[v0] Send error:", error)
    return NextResponse.json({ error: "Send failed" }, { status: 500 })
  }
}
