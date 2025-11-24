"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Mail, Mic, Send, Volume2 } from "lucide-react"
import { AIReplyEngine } from "./ai-reply-engine"
import { AudioRecorder } from "./audio-recorder"

export function NotificationEngine() {
  const [channel, setChannel] = useState("whatsapp")
  const [recipient, setRecipient] = useState("")
  const [message, setMessage] = useState("")
  const [language, setLanguage] = useState("en")
  const [sending, setSending] = useState(false)
  const [playingAudio, setPlayingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleTextToSpeech = async () => {
    if (!message) return
    setPlayingAudio(true)
    try {
      const utterance = new SpeechSynthesisUtterance(message)
      const languageMap: Record<string, string> = {
        en: "en-US",
        hindi: "hi-IN",
        kannada: "kn-IN",
        nepali: "ne-NP",
      }
      utterance.lang = languageMap[language] || "en-US"
      utterance.rate = 0.9

      utterance.onend = () => setPlayingAudio(false)
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("[v0] TTS Error:", error)
      setPlayingAudio(false)
    }
  }

  const handleSend = async () => {
    if (!recipient || !message) {
      alert("Please fill in recipient and message fields")
      return
    }

    if (channel === "email" && !recipient.includes("@")) {
      alert("Please enter a valid email address")
      return
    }

    setSending(true)
    try {
      console.log("[v0] Sending message via", channel)
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 1,
          template_id: 1,
          channel,
          recipient,
          email: channel === "email" ? recipient : null,
          subject: channel === "email" ? "GharPey Notification" : null,
          content: message,
          language: channel === "voice" ? language : null,
          status: "sent",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Message sent successfully:", data)
        alert(`✓ Message sent successfully via ${channel.toUpperCase()}!\nRecipient: ${recipient}`)
        setMessage("")
        setRecipient("")
      } else {
        const error = await response.json()
        console.error("[v0] Send error:", error)
        alert(`Failed to send message: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("[v0] Error sending notification:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Failed to send message"}`)
    } finally {
      setSending(false)
    }
  }

  const handleAudioTranscription = (transcript: string) => {
    setMessage(transcript)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Send Notification */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
            <CardDescription>Send messages via WhatsApp, Email, or SMS/Voice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={channel} onValueChange={setChannel}>
              <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
                <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  SMS/Voice
                </TabsTrigger>
              </TabsList>

              <TabsContent value="whatsapp" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Recipient Phone</label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Message</label>
                  <textarea
                    placeholder="Enter your WhatsApp message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-md bg-input border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTextToSpeech}
                    disabled={!message || playingAudio}
                    className="border-border bg-transparent"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    {playingAudio ? "Playing..." : "Preview Audio"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Email Address</label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Subject (Optional)</label>
                  <Input
                    placeholder="Email subject..."
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Email Body</label>
                  <textarea
                    placeholder="Enter email content..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-md bg-input border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </TabsContent>

              <TabsContent value="voice" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Phone Number</label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-md bg-input border border-border px-3 py-2 text-foreground"
                  >
                    <option value="en">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="kannada">Kannada</option>
                    <option value="nepali">Nepali</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Message Text</label>
                  <textarea
                    placeholder="Enter text to convert to voice..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-md bg-input border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTextToSpeech}
                    disabled={!message || playingAudio}
                    className="border-border bg-transparent"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    {playingAudio ? "Playing..." : "Preview Voice"}
                  </Button>
                </div>

                <AudioRecorder language={language} onTranscription={handleAudioTranscription} />
              </TabsContent>
            </Tabs>

            <div className="flex gap-3">
              <Button
                onClick={handleSend}
                disabled={sending || !recipient || !message}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Templates */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Quick Templates</CardTitle>
            <CardDescription>Pre-built message templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              {
                name: "Welcome",
                text: "Welcome to GharPey! We are excited to have you. Please complete your profile.",
              },
              { name: "Salary Reminder", text: "Your salary will be credited on the 5th of this month." },
              { name: "Document Request", text: "Please upload your documents to complete verification." },
              { name: "Follow-up", text: "Hi! How are things going? Let us know if you need any help." },
            ].map((template) => (
              <button
                key={template.name}
                onClick={() => setMessage(template.text)}
                className="w-full text-left p-3 rounded-lg bg-card border border-border hover:border-accent/50 hover:bg-card/80 transition-colors"
              >
                <div className="font-medium text-sm text-foreground">{template.name}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.text}</div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Reply Engine */}
      <AIReplyEngine />
    </div>
  )
}
