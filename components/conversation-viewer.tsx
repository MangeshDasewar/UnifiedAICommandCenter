"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, User, Volume2 } from "lucide-react"

export function ConversationViewer() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConv, setSelectedConv] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch("/api/conversations")
        const data = await response.json()
        const conversationsArray = Array.isArray(data) ? data : []
        console.log("[v0] Conversations fetched:", conversationsArray)
        setConversations(conversationsArray)
        if (conversationsArray.length > 0) setSelectedConv(conversationsArray[0])
      } catch (error) {
        console.error("[v0] Error fetching conversations:", error)
        setConversations([])
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  const filteredConversations = Array.isArray(conversations)
    ? conversations.filter(
        (conv) => conv && conv.content && conv.content.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : []

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-emerald-500/10 text-emerald-600"
      case "negative":
        return "bg-red-500/10 text-red-600"
      case "confused":
        return "bg-yellow-500/10 text-yellow-600"
      default:
        return "bg-cyan-500/10 text-cyan-600"
    }
  }

  const handlePlayAudio = (conversation: any) => {
    if (playingId === conversation.id) {
      setPlayingId(null)
      if (audioRef.current) audioRef.current.pause()
      return
    }

    setPlayingId(conversation.id)
    if (conversation.audio_url) {
      if (audioRef.current) {
        audioRef.current.src = conversation.audio_url
        audioRef.current.play()
      }
    } else {
      // Generate TTS for the message
      const utterance = new SpeechSynthesisUtterance(conversation.content)
      const languageMap: Record<string, string> = {
        en: "en-US",
        hindi: "hi-IN",
        kannada: "kn-IN",
        nepali: "ne-NP",
      }
      utterance.lang = languageMap[conversation.detected_language] || "en-US"
      utterance.onend = () => setPlayingId(null)
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Conversation List */}
      <Card className="border-border bg-card lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Conversations</CardTitle>
          <CardDescription>All messages and interactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground py-4">Loading...</div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedConv?.id === conv.id
                      ? "bg-primary/10 border-primary/50"
                      : "border-border hover:border-accent/50 hover:bg-card/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-foreground">User {conv.user_id}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{conv.content}</div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{conv.channel}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">No conversations found</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversation Detail */}
      {selectedConv ? (
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">User {selectedConv.user_id}</div>
                  <div className="text-sm text-muted-foreground">{selectedConv.detected_language}</div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-600">
                  {selectedConv.channel}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(selectedConv.sentiment)}`}>
                  {selectedConv.sentiment}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="thread" className="w-full">
              <TabsList className="bg-card border border-border">
                <TabsTrigger value="thread">Message</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="thread" className="space-y-4 mt-4">
                <div className="space-y-3 bg-card/50 rounded-lg p-4">
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-lg p-3 max-w-xs">
                      <p className="text-sm text-foreground">{selectedConv.content}</p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {new Date(selectedConv.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handlePlayAudio(selectedConv)}
                  variant="outline"
                  className="w-full border-border"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  {playingId === selectedConv.id ? "Stop Playing" : "Play Audio"}
                </Button>
                <audio ref={audioRef} />
              </TabsContent>

              <TabsContent value="analysis" className="space-y-3 mt-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Detected Intent</label>
                    <div className="mt-1 p-2 rounded bg-card/50 border border-border text-foreground">
                      {selectedConv.intent}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sentiment</label>
                    <div
                      className={`mt-1 p-2 rounded border border-border text-sm font-medium ${getSentimentColor(selectedConv.sentiment)}`}
                    >
                      {(selectedConv.sentiment || "neutral").toUpperCase()}

                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Language Detected</label>
                    <div className="mt-1 p-2 rounded bg-card/50 border border-border text-foreground text-sm">
                      {selectedConv.detected_language}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card lg:col-span-2">
          <CardContent className="pt-6 text-center text-muted-foreground">
            Select a conversation to view details
          </CardContent>
        </Card>
      )}
    </div>
  )
}
