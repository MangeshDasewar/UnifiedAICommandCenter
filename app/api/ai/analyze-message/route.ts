import { type NextRequest, NextResponse } from "next/server"
import {
  detectLanguage,
  classifyIntent,
  analyzeSentiment,
  generateAutoResponse,
} from "@/lib/ai-utils"

interface AnalysisResult {
  intent: string
  language: string
  sentiment: string
  confidence: number
  suggestedResponse: string
  entities: string[]
  requiresEscalation: boolean
}

// AI message analysis using shared ai-utils
export async function POST(request: NextRequest) {
  try {
    const { message, language: inputLanguage, userName = "User" } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 },
      )
    }

    // 1) Language detection
    const detectedLanguage = inputLanguage || detectLanguage(message)

    // 2) Intent classification
    const intent = classifyIntent(message, detectedLanguage)

    // 3) Sentiment analysis
    const sentiment = analyzeSentiment(message)

    // 4) Suggested auto-response (multilingual)
    const suggestedResponse = generateAutoResponse(intent, detectedLanguage, userName)

    // 5) Simple confidence heuristic
    let confidence = 0.8
    if (intent === "other") confidence = 0.6
    if (sentiment === "confused" || sentiment === "negative") confidence = 0.7

    const analysis: AnalysisResult = {
      intent,
      language: detectedLanguage,
      sentiment,
      confidence,
      suggestedResponse,
      entities: extractEntities(message),
      requiresEscalation: confidence < 0.7 || sentiment === "negative",
    }

    console.log("[AI] Analysis result:", analysis)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("[AI] analyze-message error:", error)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}

function extractEntities(message: string): string[] {
  const entities: string[] = []
  const patterns = [
    { pattern: /salary|payment|rupees|amount|upi/i, entity: "payment" },
    { pattern: /leave|day off|vacation|holiday/i, entity: "leave" },
    { pattern: /document|certificate|proof|id card|aadhar/i, entity: "document" },
    { pattern: /thanks|thank you|dhanyavad|shukriya/i, entity: "gratitude" },
    { pattern: /insurance/i, entity: "insurance" },
  ]

  for (const { pattern, entity } of patterns) {
    if (pattern.test(message)) {
      entities.push(entity)
    }
  }

  return entities
}
