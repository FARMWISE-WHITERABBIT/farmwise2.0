"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Play, Pause, Trash2 } from "lucide-react"
import { put } from "@vercel/blob"

interface VoiceNoteRecorderProps {
  onRecordingComplete: (url: string) => void
}

export function VoiceNoteRecorder({ onRecordingComplete }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)

        // Upload to Vercel Blob
        try {
          const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
            type: "audio/webm",
          })
          const blob = await put(file.name, file, { access: "public" })
          onRecordingComplete(blob.url)
        } catch (error) {
          console.error("Error uploading voice note:", error)
        }

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const togglePlayback = () => {
    if (!audioRef.current && audioURL) {
      audioRef.current = new Audio(audioURL)
      audioRef.current.onended = () => setIsPlaying(false)
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setAudioURL(null)
    setIsPlaying(false)
    setDuration(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {!audioURL ? (
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <Button onClick={startRecording} variant="outline" className="flex-1 bg-transparent">
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <>
              <div className="flex-1 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Recording... {formatTime(duration)}</span>
              </div>
              <Button onClick={stopRecording} variant="destructive" size="icon">
                <Square className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button onClick={togglePlayback} variant="outline" size="icon">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <div className="flex-1">
            <div className="h-8 bg-gray-100 rounded flex items-center px-3">
              <span className="text-sm text-gray-600">{formatTime(duration)}</span>
            </div>
          </div>
          <Button onClick={deleteRecording} variant="ghost" size="icon">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      )}
    </div>
  )
}
