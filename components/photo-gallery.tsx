"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, Download, ChevronLeft, ChevronRight } from "lucide-react"

interface PhotoGalleryProps {
  photos: string[]
  title?: string
}

export function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (!photos || photos.length === 0) {
    return null
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  const downloadPhoto = (url: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = `photo-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-[15px] overflow-hidden bg-gray-100 cursor-pointer group"
            onClick={() => openLightbox(index)}
          >
            <img
              src={photo || "/placeholder.svg"}
              alt={`${title || "Photo"} ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-[95vh] flex items-center justify-center">
            {/* Close Button */}
            <Button
              onClick={closeLightbox}
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Download Button */}
            {selectedIndex !== null && (
              <Button
                onClick={() => downloadPhoto(photos[selectedIndex])}
                size="icon"
                variant="ghost"
                className="absolute top-4 right-16 z-50 text-white hover:bg-white/20 rounded-full"
              >
                <Download className="h-6 w-6" />
              </Button>
            )}

            {/* Previous Button */}
            {selectedIndex !== null && selectedIndex > 0 && (
              <Button
                onClick={goToPrevious}
                size="icon"
                variant="ghost"
                className="absolute left-4 z-50 text-white hover:bg-white/20 rounded-full"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Next Button */}
            {selectedIndex !== null && selectedIndex < photos.length - 1 && (
              <Button
                onClick={goToNext}
                size="icon"
                variant="ghost"
                className="absolute right-4 z-50 text-white hover:bg-white/20 rounded-full"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Image */}
            {selectedIndex !== null && (
              <div className="relative w-full h-full flex items-center justify-center p-8">
                <img
                  src={photos[selectedIndex] || "/placeholder.svg"}
                  alt={`${title || "Photo"} ${selectedIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-inter">
                  {selectedIndex + 1} / {photos.length}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
