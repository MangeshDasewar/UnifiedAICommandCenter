"use client"

import { useEffect } from "react"
import { useState } from "react"
import { Dashboard } from "@/components/dashboard"
import { NotificationEngine } from "@/components/notification-engine"
import { ConversationViewer } from "@/components/conversation-viewer"
import { TemplateManager } from "@/components/template-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, MessageSquare, Mail, Settings } from "lucide-react"

export default function Page() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("[v0] Initializing application...")
        const response = await fetch("/api/init")
        const data = await response.json()
        console.log("[v0] Initialization complete:", data)
        setInitialized(true)
      } catch (error) {
        console.error("[v0] Initialization error:", error)
        setInitialized(true)
      }
    }

    initializeApp()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <MessageSquare className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-balance">Unified AI Command Centre</h1>
            </div>
            <div className="text-sm text-muted-foreground">GharPey Communication Hub</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!initialized ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Initializing application...</div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="send" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </TabsTrigger>
              <TabsTrigger value="conversations" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6 space-y-6">
              <Dashboard />
            </TabsContent>

            <TabsContent value="send" className="mt-6 space-y-6">
              <NotificationEngine />
            </TabsContent>

            <TabsContent value="conversations" className="mt-6 space-y-6">
              <ConversationViewer />
            </TabsContent>

            <TabsContent value="templates" className="mt-6 space-y-6">
              <TemplateManager />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
