"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Trash2, Volume2 } from "lucide-react"

export function TemplateManager() {
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [newTemplate, setNewTemplate] = useState({ name: "", type: "", language: "", content: "", channel: "" })
  const [showForm, setShowForm] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/templates")
        const data = await response.json()
        setTemplates(data)
        if (data.length > 0) setSelectedTemplate(data[0])
      } catch (error) {
        console.error("[v0] Error fetching templates:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const handleAddTemplate = async () => {
    if (
      !newTemplate.name ||
      !newTemplate.content ||
      !newTemplate.type ||
      !newTemplate.language ||
      !newTemplate.channel
    ) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates([...templates, data])
        setNewTemplate({ name: "", type: "", language: "", content: "", channel: "" })
        setShowForm(false)
        alert("✓ Template created successfully!")
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || "Failed to create template"}`)
      }
    } catch (error) {
      console.error("[v0] Error adding template:", error)
      alert("Error creating template")
    }
  }

  const handleDelete = (id: number) => {
    setTemplates(templates.filter((t) => t.id !== id))
  }

  const handlePlayTemplate = (template: any) => {
    if (playingId === template.id) {
      setPlayingId(null)
      window.speechSynthesis.cancel()
      return
    }

    setPlayingId(template.id)
    const utterance = new SpeechSynthesisUtterance(template.content)
    const languageMap: Record<string, string> = {
      en: "en-US",
      hindi: "hi-IN",
      kannada: "kn-IN",
      nepali: "ne-NP",
    }
    utterance.lang = languageMap[template.language] || "en-US"
    utterance.onend = () => setPlayingId(null)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Template List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">Message Templates</h2>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {showForm && (
          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-4">
              <Input
                placeholder="Template name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
              <select
                value={newTemplate.type}
                onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                className="w-full rounded-md bg-input border border-border px-3 py-2 text-foreground"
              >
                <option value="">Select type</option>
                <option value="welcome">Welcome</option>
                <option value="salary_reminder">Salary Reminder</option>
                <option value="document_reminder">Document Reminder</option>
              </select>
              <select
                value={newTemplate.language}
                onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                className="w-full rounded-md bg-input border border-border px-3 py-2 text-foreground"
              >
                <option value="">Select language</option>
                <option value="en">English</option>
                <option value="hindi">Hindi</option>
                <option value="kannada">Kannada</option>
                <option value="nepali">Nepali</option>
              </select>
              <select
                value={newTemplate.channel}
                onChange={(e) => setNewTemplate({ ...newTemplate, channel: e.target.value })}
                className="w-full rounded-md bg-input border border-border px-3 py-2 text-foreground"
              >
                <option value="">Select channel</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="voice">Voice/SMS</option>
              </select>
              <textarea
                placeholder="Template content"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                rows={4}
                className="w-full rounded-md bg-input border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAddTemplate}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Create Template
                </Button>
                <Button
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="flex-1 border-border bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3">
          {loading ? (
            <div className="text-center text-muted-foreground py-4">Loading templates...</div>
          ) : templates.length > 0 ? (
            templates.map((template) => (
              <Card
                key={template.id}
                className={`border-border bg-card cursor-pointer transition-colors hover:border-accent/50 ${
                  selectedTemplate?.id === template.id ? "border-primary/50 bg-primary/5" : ""
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{template.name}</h3>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                          {template.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{template.content}</p>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <span className="px-2 py-1 rounded text-xs bg-accent/10 text-accent-foreground">
                          {template.language}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-600 capitalize">
                          {template.channel}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlayTemplate(template)
                        }}
                        className="p-2 rounded-lg hover:bg-card/80 border border-border"
                      >
                        <Volume2
                          className={`h-4 w-4 ${playingId === template.id ? "text-primary" : "text-muted-foreground"}`}
                        />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-card/80 border border-border">
                        <Edit2 className="h-4 w-4 text-primary" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(template.id)
                        }}
                        className="p-2 rounded-lg hover:bg-card/80 border border-border"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-4">No templates found</div>
          )}
        </div>
      </div>

      {/* Template Preview */}
      {selectedTemplate && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Template Details</CardTitle>
            <CardDescription>View template information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <div className="mt-1 p-2 rounded bg-card/50 text-foreground text-sm">{selectedTemplate.name}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <div className="mt-1 p-2 rounded bg-card/50 text-foreground text-sm">{selectedTemplate.type}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Language</label>
              <div className="mt-1 p-2 rounded bg-card/50 text-foreground text-sm">{selectedTemplate.language}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Channel</label>
              <div className="mt-1 p-2 rounded bg-card/50 border border-border text-foreground text-sm capitalize">
                {selectedTemplate.channel}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Content</label>
              <div className="mt-1 p-3 rounded bg-card/50 border border-border text-foreground text-sm max-h-48 overflow-y-auto">
                {selectedTemplate.content}
              </div>
            </div>
            <Button
              onClick={() => handlePlayTemplate(selectedTemplate)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              {playingId === selectedTemplate.id ? "Stop Preview" : "Preview Audio"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
