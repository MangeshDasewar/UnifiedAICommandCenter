import { type NextRequest, NextResponse } from "next/server"

// Mock Automatic Speech Recognition service
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const language = formData.get("language") as string

    console.log("[v0] Transcribing audio:", { fileName: audioFile.name, language })

    // Mock transcription
    const transcribedText = "This is a mock transcription of the audio message."

    return NextResponse.json({
      success: true,
      text: transcribedText,
      language: language || "en",
      confidence: 0.88,
    })
  } catch (error) {
    console.error("[v0] ASR error:", error)
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 })
  }
}
