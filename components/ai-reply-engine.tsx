"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, MessageSquare, AlertCircle, Send } from "lucide-react"

export function AIReplyEngine() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConv, setSelectedConv] = useState<any>(null)
  const [autoResponses, setAutoResponses] = useState(true)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch("/api/conversations")
        const data = await response.json()
        if (data.length > 0) {
          setConversations(data)
          setSelectedConv(data[0])
        }
      } catch (error) {
        console.error("[v0] Error fetching conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      completion: "bg-emerald-500/10 text-emerald-600",
      confusion: "bg-red-500/10 text-red-600",
      insurance_query: "bg-yellow-500/10 text-yellow-600",
      upi_question: "bg-purple-500/10 text-purple-600",
      smart_backup_request: "bg-blue-500/10 text-blue-600",
      opt_out: "bg-orange-500/10 text-orange-600",
      other: "bg-gray-500/10 text-gray-600",
    }
    return colors[intent] || colors.other
  }

  const getSentimentColor = (sentiment: string) => {
    const colors: Record<string, string> = {
      positive: "bg-emerald-500/10 text-emerald-600",
      negative: "bg-red-500/10 text-red-600",
      confused: "bg-yellow-500/10 text-yellow-600",
      neutral: "bg-cyan-500/10 text-cyan-600",
    }
    return colors[sentiment] || colors.neutral
  }

  const handleSendResponse = async () => {
    if (!selectedConv) return
    setSending(true)
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedConv.user_id,
          template_id: 1,
          channel: selectedConv.channel,
          content: selectedConv.auto_response,
          status: "sent",
        }),
      })

      if (response.ok) {
        alert("Response sent successfully!")
      }
    } catch (error) {
      console.error("[v0] Error sending response:", error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="pt-6">Loading conversations...</CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>AI Reply Intelligence</CardTitle>
              <CardDescription>Automatic intent detection and response generation</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Auto-respond:</label>
            <input
              type="checkbox"
              checked={autoResponses}
              onChange={(e) => setAutoResponses(e.target.checked)}
              className="rounded"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Incoming Replies */}
          <div className="lg:col-span-1 space-y-2 max-h-96 overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedConv?.id === conv.id
                      ? "bg-primary/10 border-primary/50"
                      : "border-border hover:border-accent/50 hover:bg-card/80"
                  }`}
                >
                  <div className="text-sm font-medium text-foreground">User {conv.user_id}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1 mt-1">{conv.content}</div>
                  <div className="flex gap-1 mt-2">
                    <Badge className={getIntentColor(conv.intent)}>{conv.intent}</Badge>
                    <Badge
                      className={`${conv.channel === "whatsapp" ? "bg-green-500/10 text-green-600" : conv.channel === "email" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"}`}
                    >
                      {conv.channel}
                    </Badge>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">No conversations</div>
            )}
          </div>

          {/* Analysis and Response */}
          {selectedConv && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-lg border border-border bg-card/50">
                <div className="text-sm font-medium text-foreground mb-2">Original Message</div>
                <div className="p-3 rounded bg-card border border-border text-foreground text-sm">
                  {selectedConv.content}
                </div>
                <div className="flex gap-2 mt-3 text-xs flex-wrap">
                  <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-600">
                    {selectedConv.detected_language}
                  </span>
                  <span className={`px-2 py-1 rounded ${getSentimentColor(selectedConv.sentiment)}`}>
                    {selectedConv.sentiment}
                  </span>
                  <span
                    className={`px-2 py-1 rounded ${selectedConv.channel === "whatsapp" ? "bg-green-500/10 text-green-600" : selectedConv.channel === "email" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"}`}
                  >
                    {selectedConv.channel.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border border-border bg-card/50">
                  <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Detected Intent
                  </div>
                  <div className={`p-2 rounded text-sm font-medium ${getIntentColor(selectedConv.intent)}`}>
                    {selectedConv.intent}
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border bg-card/50">
                  <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-accent" />
                    Channel
                  </div>
                  <div className="text-sm font-medium text-foreground capitalize">{selectedConv.channel}</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-primary/5">
                <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Suggested Auto-Response
                </div>
                <div className="p-3 rounded bg-card border border-border text-foreground text-sm mb-3">
                  {selectedConv.auto_response || "Thank you for your message. We will respond shortly."}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendResponse}
                    disabled={sending}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? "Sending..." : "Send Response"}
                  </Button>
                  <Button variant="outline" className="flex-1 border-border bg-transparent">
                    Edit & Send
                  </Button>
                </div>
              </div>

              {selectedConv.sentiment === "confused" && (
                <div className="p-3 rounded-lg border border-border bg-yellow-500/5 text-yellow-700 text-sm flex gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Escalation Alert:</strong> User appears confused. Consider human review.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
