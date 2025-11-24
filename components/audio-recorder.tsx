"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square } from "lucide-react"

interface AudioRecorderProps {
  language: string
  onTranscription: (text: string) => void
}

export function AudioRecorder({ language, onTranscription }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcription, setTranscription] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        processAudio()
      }

      mediaRecorder.start()
      setIsRecording(true)
      console.log("[v0] Recording started...")
    } catch (error) {
      console.error("[v0] Microphone access error:", error)
      alert("Unable to access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
    }
  }

  const processAudio = async () => {
    setIsProcessing(true)
    try {
      // Initialize speech recognition
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      if (!SpeechRecognition) {
        alert("Speech recognition not supported in your browser")
        setIsProcessing(false)
        return
      }

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      const languageMap: Record<string, string> = {
        en: "en-US",
        hindi: "hi-IN",
        kannada: "kn-IN",
        nepali: "ne-NP",
      }

      recognition.language = languageMap[language] || "en-US"
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        console.log("[v0] Speech recognition started")
      }

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("")
        console.log("[v0] Transcript:", transcript)
        setTranscription(transcript)
        onTranscription(transcript)
        setIsProcessing(false)
      }

      recognition.onerror = (event: any) => {
        console.error("[v0] Speech recognition error:", event.error)
        alert(`Speech recognition error: ${event.error}`)
        setIsProcessing(false)
      }

      recognition.onend = () => {
        console.log("[v0] Speech recognition ended")
        setIsProcessing(false)
      }

      // Start recognition
      recognition.start()
    } catch (error) {
      console.error("[v0] Audio processing error:", error)
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-3 p-3 rounded-lg border border-border bg-card/50">
      <div className="text-sm font-medium text-foreground">Record Audio Message (Speech to Text)</div>
      <div className="flex gap-2">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={isProcessing}
            variant="outline"
            className="flex-1 border-border bg-transparent"
          >
            <Mic className="h-4 w-4 mr-2" />
            Start Recording
          </Button>
        ) : (
          <Button onClick={stopRecording} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        )}
      </div>
      {isProcessing && <div className="text-xs text-muted-foreground animate-pulse">Processing audio...</div>}
      {transcription && (
        <div className="p-2 rounded bg-card border border-border text-foreground text-sm">
          <div className="text-xs text-muted-foreground mb-1">Transcribed text:</div>
          <div>{transcription}</div>
        </div>
      )}
    </div>
  )
}
