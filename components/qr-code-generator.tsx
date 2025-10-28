"use client"

import { useEffect, useRef } from "react"
import QRCodeStyling from "qr-code-styling"

interface QRCodeGeneratorProps {
  value: string
  size?: number
}

export function QRCodeGenerator({ value, size = 200 }: QRCodeGeneratorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const qrCode = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!qrCode.current) {
      qrCode.current = new QRCodeStyling({
        width: size,
        height: size,
        data: value,
        dotsOptions: {
          color: "#39B54A",
          type: "rounded",
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        cornersSquareOptions: {
          color: "#2D5016",
          type: "extra-rounded",
        },
        cornersDotOptions: {
          color: "#2D5016",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 4,
        },
      })
    }

    if (ref.current) {
      ref.current.innerHTML = ""
      qrCode.current.append(ref.current)
    }
  }, [value, size])

  useEffect(() => {
    if (qrCode.current) {
      qrCode.current.update({ data: value })
    }
  }, [value])

  return <div ref={ref} className="flex justify-center" />
}
