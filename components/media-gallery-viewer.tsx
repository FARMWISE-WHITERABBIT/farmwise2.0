"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, Download, Trash2, ZoomIn, ZoomOut, Play } from "lucide-react"

interface MediaItem {
  url: string
  type: "photo" | "video"
  caption?: string
  timestamp?: string
}

interface MediaGalleryViewerProps {
  media: MediaItem[]
  initialIndex?: number
  onClose: () => void
  onDelete?: (index: number) => void
}

export function MediaGalleryViewer({ media, initialIndex = 0, onClose, onDelete }: MediaGalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)

  const currentMedia = media[currentIndex]

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))
    setZoom(1)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))
    setZoom(1)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(currentMedia.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `media-${Date.now()}.${currentMedia.type === "photo" ? "jpg" : "mp4"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading media:", error)
    }
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="font-semibold">
                  {currentIndex + 1} / {media.length}
                </p>
                {currentMedia.timestamp && (
                  <p className="text-sm text-gray-300">{new Date(currentMedia.timestamp).toLocaleString()}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentMedia.type === "photo" && (
                  <>
                    <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white">
                      <ZoomOut className="w-5 h-5" />
                    </Button>
                    <span className="text-white text-sm">{Math.round(zoom * 100)}%</span>
                    <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white">
                      <ZoomIn className="w-5 h-5" />
                    </Button>
                  </>
                )}

                <Button variant="ghost" size="icon" onClick={handleDownload} className="text-white">
                  <Download className="w-5 h-5" />
                </Button>

                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onDelete(currentIndex)
                      if (currentIndex >= media.length - 1) {
                        setCurrentIndex(Math.max(0, currentIndex - 1))
                      }
                    }}
                    className="text-white"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}

                <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Media Content */}
          <div className="flex-1 flex items-center justify-center p-4">
            {currentMedia.type === "photo" ? (
              <img
                src={currentMedia.url || "/placeholder.svg"}
                alt="Media"
                className="max-w-full max-h-full object-contain transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
            ) : (
              <div className="relative max-w-full max-h-full">
                <video src={currentMedia.url} controls className="max-w-full max-h-full" />
              </div>
            )}
          </div>

          {/* Navigation */}
          {media.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          {/* Caption */}
          {currentMedia.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white text-center">{currentMedia.caption}</p>
            </div>
          )}

          {/* Thumbnail Strip */}
          {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg max-w-full overflow-x-auto">
              {media.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index)
                    setZoom(1)
                  }}
                  className={`relative w-16 h-16 flex-shrink-0 rounded overflow-hidden ${
                    index === currentIndex ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {item.type === "photo" ? (
                    <img src={item.url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
