"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus } from "lucide-react"
import { CROP_CATEGORIES, type CropCategory } from "@/lib/constants/crops"

interface Crop {
  id: string
  category: string
  name: string
  hectares: string
}

interface CropInputWithHectaresProps {
  value: Crop[]
  onChange: (crops: Crop[]) => void
}

export function CropInputWithHectares({ value, onChange }: CropInputWithHectaresProps) {
  const [selectedCategory, setSelectedCategory] = useState<CropCategory | "">("")
  const [selectedCrop, setSelectedCrop] = useState("")
  const [hectares, setHectares] = useState("")

  const addCrop = () => {
    if (!selectedCrop || !hectares) return

    const newCrop: Crop = {
      id: Math.random().toString(36).substr(2, 9),
      category: selectedCategory as string,
      name: selectedCrop,
      hectares,
    }

    onChange([...value, newCrop])
    setSelectedCategory("")
    setSelectedCrop("")
    setHectares("")
  }

  const removeCrop = (id: string) => {
    onChange(value.filter((crop) => crop.id !== id))
  }

  const availableCrops = selectedCategory ? CROP_CATEGORIES[selectedCategory as CropCategory].crops : []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="font-inter">Crop Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(val) => {
              setSelectedCategory(val as CropCategory)
              setSelectedCrop("")
            }}
          >
            <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.23)]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CROP_CATEGORIES).map(([key, category]) => (
                <SelectItem key={key} value={key}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-inter">Crop Name</Label>
          <Select value={selectedCrop} onValueChange={setSelectedCrop} disabled={!selectedCategory}>
            <SelectTrigger className="rounded-[10px] border-[rgba(0,0,0,0.23)]">
              <SelectValue placeholder={selectedCategory ? "Select crop" : "Select category first"} />
            </SelectTrigger>
            <SelectContent>
              {availableCrops.map((crop) => (
                <SelectItem key={crop} value={crop}>
                  {crop}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-inter">Hectares</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={hectares}
              onChange={(e) => setHectares(e.target.value)}
              className="rounded-[10px] border-[rgba(0,0,0,0.23)] font-inter"
            />
            <Button
              type="button"
              onClick={addCrop}
              disabled={!selectedCrop || !hectares}
              className="bg-[#39B54A] hover:bg-[#2D5016] text-white rounded-[10px] shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="font-inter">Added Crops</Label>
          <div className="space-y-2">
            {value.map((crop) => (
              <div
                key={crop.id}
                className="flex items-center justify-between p-3 bg-[#F5F5F5] rounded-[10px] border border-[rgba(0,0,0,0.12)]"
              >
                <div className="flex-1">
                  <p className="font-inter font-medium text-[rgba(0,0,0,0.87)]">{crop.name}</p>
                  <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
                    {CROP_CATEGORIES[crop.category as CropCategory]?.name} • {crop.hectares} hectares
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCrop(crop.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-[8px]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-[rgba(0,0,0,0.12)]">
            <p className="text-sm font-inter text-[rgba(0,0,0,0.65)]">
              Total:{" "}
              <span className="font-semibold text-[#39B54A]">
                {value.reduce((sum, crop) => sum + Number.parseFloat(crop.hectares || "0"), 0).toFixed(2)} hectares
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
