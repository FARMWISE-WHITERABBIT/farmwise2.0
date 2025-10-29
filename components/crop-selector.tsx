"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { CROP_CATEGORIES, type CropCategory } from "@/lib/constants/crops"

interface CropWithHectares {
  category: string
  crop: string
  hectares: number
}

interface CropSelectorProps {
  value: CropWithHectares[]
  onChange: (crops: CropWithHectares[]) => void
}

export function CropSelector({ value, onChange }: CropSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<CropCategory | "">("")
  const [selectedCrop, setSelectedCrop] = useState("")
  const [hectares, setHectares] = useState("")

  const addCrop = () => {
    if (selectedCategory && selectedCrop && hectares) {
      const newCrop: CropWithHectares = {
        category: CROP_CATEGORIES[selectedCategory as CropCategory].name,
        crop: selectedCrop,
        hectares: Number.parseFloat(hectares),
      }
      onChange([...value, newCrop])
      setSelectedCategory("")
      setSelectedCrop("")
      setHectares("")
    }
  }

  const removeCrop = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const availableCrops = selectedCategory ? CROP_CATEGORIES[selectedCategory as CropCategory].crops : []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="font-inter">Crop Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value as CropCategory)
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
          <Label className="font-inter">Crop</Label>
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
              disabled={!selectedCrop}
            />
            <Button
              type="button"
              onClick={addCrop}
              disabled={!selectedCategory || !selectedCrop || !hectares}
              className="bg-[#39B54A] hover:bg-[#2D5016] rounded-[10px] whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="font-inter">Selected Crops</Label>
          <div className="flex flex-wrap gap-2">
            {value.map((crop, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-[rgba(57,181,74,0.1)] text-[#39B54A] border-[#39B54A] px-3 py-2 rounded-[8px]"
              >
                <span className="font-medium">
                  {crop.crop} - {crop.hectares} ha
                </span>
                <button type="button" onClick={() => removeCrop(index)} className="ml-2 hover:text-[#2D5016]">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">
            Total: {value.reduce((sum, crop) => sum + crop.hectares, 0).toFixed(2)} hectares
          </p>
        </div>
      )}
    </div>
  )
}

export default CropSelector
