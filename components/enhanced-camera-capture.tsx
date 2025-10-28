"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Video, RotateCw, X, Check, Grid3x3, Zap, ZapOff } from "lucide-react"
import { put } from "@vercel/blob"

interface EnhancedCameraCaptureProps {
  onCapture: (url: string, type: "photo" | "video") => void
  mode?: "photo" | "video" | "both"
  maxVideoDuration?: number
}

export function EnhancedCameraCapture({ onCapture, mode = "both", maxVideoDuration = 60 }: EnhancedCameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [captureMode, setCaptureMode] = useState<"photo" | "video">("photo")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo")
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [gridEnabled, setGridEnabled] = useState(false)
  const [uploading, setUploading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => stopCamera()
  }, [isOpen, facingMode])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: captureMode === "video",
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
      setCapturedMedia(dataUrl)
      setMediaType("photo")
    }
  }

  const startVideoRecording = async () => {
    if (!streamRef.current) return

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm",
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        const url = URL.createObjectURL(blob)
        setCapturedMedia(url)
        setMediaType("video")
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxVideoDuration) {
            stopVideoRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error("Error starting video recording:", error)
    }
  }

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const handleCapture = () => {
    if (captureMode === "photo") {
      capturePhoto()
    } else {
      if (isRecording) {
        stopVideoRecording()
      } else {
        startVideoRecording()
      }
    }
  }

  const handleSave = async () => {
    if (!capturedMedia) return

    setUploading(true)
    try {
      let blob: Blob

      if (mediaType === "photo") {
        const response = await fetch(capturedMedia)
        blob = await response.blob()
      } else {
        const response = await fetch(capturedMedia)
        blob = await response.blob()
      }

      const file = new File([blob], `${mediaType}-${Date.now()}.${mediaType === "photo" ? "jpg" : "webm"}`, {
        type: mediaType === "photo" ? "image/jpeg" : "video/webm",
      })

      const uploadedBlob = await put(file.name, file, { access: "public" })
      onCapture(uploadedBlob.url, mediaType)
      setIsOpen(false)
      setCapturedMedia(null)
    } catch (error) {
      console.error("Error uploading media:", error)
    } finally {
      setUploading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline" className="w-full bg-transparent">
        <Camera className="w-4 h-4 mr-2" />
        Open Camera
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {!capturedMedia ? (
        <>
          {/* Camera View */}
          <div className="relative w-full h-full">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Grid Overlay */}
            {gridEnabled && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/30" />
                  ))}
                </div>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="font-mono font-bold">{formatTime(recordingTime)}</span>
              </div>
            )}

            {/* Top Controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false)
                  setCapturedMedia(null)
                }}
                className="bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-6 h-6" />
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setGridEnabled(!gridEnabled)}
                  className={`bg-black/50 text-white hover:bg-black/70 ${gridEnabled ? "bg-white/20" : ""}`}
                >
                  <Grid3x3 className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFlashEnabled(!flashEnabled)}
                  className={`bg-black/50 text-white hover:bg-black/70 ${flashEnabled ? "bg-white/20" : ""}`}
                >
                  {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFacingMode(facingMode === "user" ? "environment" : "user")}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <RotateCw className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8">
              {mode === "both" && (
                <div className="flex gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => setCaptureMode("photo")}
                    className={`text-white ${captureMode === "photo" ? "bg-white/20" : ""}`}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Photo
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setCaptureMode("video")}
                    className={`text-white ${captureMode === "video" ? "bg-white/20" : ""}`}
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Video
                  </Button>
                </div>
              )}

              <Button
                size="lg"
                onClick={handleCapture}
                className={`w-20 h-20 rounded-full ${
                  isRecording ? "bg-red-600 hover:bg-red-700" : "bg-white hover:bg-gray-200"
                }`}
              >
                {captureMode === "photo" ? (
                  <Camera className="w-8 h-8 text-black" />
                ) : isRecording ? (
                  <div className="w-6 h-6 bg-white rounded-sm" />
                ) : (
                  <div className="w-6 h-6 bg-red-600 rounded-full" />
                )}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Preview */}
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {mediaType === "photo" ? (
              <img
                src={capturedMedia || "/placeholder.svg"}
                alt="Captured"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video src={capturedMedia} controls className="max-w-full max-h-full" />
            )}

            {/* Preview Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setCapturedMedia(null)}
                className="bg-black/50 text-white hover:bg-black/70"
              >
                <X className="w-6 h-6 mr-2" />
                Retake
              </Button>

              <Button
                size="lg"
                onClick={handleSave}
                disabled={uploading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-6 h-6 mr-2" />
                {uploading ? "Uploading..." : "Use This"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
