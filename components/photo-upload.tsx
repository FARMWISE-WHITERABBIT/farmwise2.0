"use client"

import type React from "react"

import { useState } from "react"
import { Camera, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CameraCapture } from "./camera-capture"

interface PhotoUploadProps {
  label: string
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
}

export function PhotoUpload({ label, value, onChange, onRemove }: PhotoUploadProps) {
  const [showCamera, setShowCamera] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleCapture = async (imageData: string) => {
    setUploading(true)
    try {
      // Convert base64 to blob
      const response = await fetch(imageData)
      const blob = await response.blob()

      // Upload to Vercel Blob
      const formData = new FormData()
      formData.append("file", blob, `photo-${Date.now()}.jpg`)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Upload failed")
      }

      const { url } = await uploadResponse.json()
      onChange(url)
    } catch (error) {
      console.error("[v0] Photo upload error:", error)
      alert("Failed to upload photo. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Upload failed")
      }

      const { url } = await uploadResponse.json()
      onChange(url)
    } catch (error) {
      console.error("[v0] Photo upload error:", error)
      alert("Failed to upload photo. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>

        {value ? (
          <Card className="relative overflow-hidden">
            <img src={value || "/placeholder.svg"} alt="Uploaded" className="h-48 w-full object-cover" />
            {onRemove && (
              <Button variant="destructive" size="icon" className="absolute right-2 top-2" onClick={onRemove}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </Card>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => setShowCamera(true)}
              disabled={uploading}
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>

            <label className="flex-1">
              <Button type="button" variant="outline" className="w-full bg-transparent" disabled={uploading} asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={uploading} />
            </label>
          </div>
        )}

        {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
      </div>

      {showCamera && <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />}
    </>
  )
}
