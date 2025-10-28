"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, X, Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onClose: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setError(null)
      }
    } catch (err) {
      console.error("[v0] Camera access error:", err)
      setError("Unable to access camera. Please check permissions.")
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext("2d")
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = canvas.toDataURL("image/jpeg", 0.8)
        setCapturedImage(imageData)
        stopCamera()
      }
    }
  }, [stopCamera])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    startCamera()
  }, [startCamera])

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage)
      stopCamera()
      onClose()
    }
  }, [capturedImage, onCapture, stopCamera, onClose])

  const switchCamera = useCallback(() => {
    stopCamera()
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }, [stopCamera])

  // Start camera on mount
  useState(() => {
    startCamera()
    return () => stopCamera()
  })

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <div className="relative h-full w-full">
        {/* Camera view or captured image */}
        {!capturedImage ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <img src={capturedImage || "/placeholder.svg"} alt="Captured" className="h-full w-full object-contain" />
        )}

        {/* Error message */}
        {error && (
          <Card className="absolute left-1/2 top-4 -translate-x-1/2 bg-red-500 px-4 py-2 text-white">{error}</Card>
        )}

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-between">
            {/* Close button */}
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </Button>

            {/* Capture/Confirm button */}
            {!capturedImage ? (
              <Button size="icon" onClick={capturePhoto} className="h-16 w-16 rounded-full bg-white hover:bg-gray-200">
                <Camera className="h-8 w-8 text-gray-900" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={confirmPhoto}
                className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
              >
                <Check className="h-8 w-8 text-white" />
              </Button>
            )}

            {/* Switch camera / Retake button */}
            {!capturedImage ? (
              <Button variant="ghost" size="icon" onClick={switchCamera} className="text-white hover:bg-white/20">
                <RotateCcw className="h-6 w-6" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={retakePhoto} className="text-white hover:bg-white/20">
                <RotateCcw className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
