export const CROP_CATEGORIES = {
  cereals: {
    name: "Cereals",
    crops: ["Maize (Corn)", "Rice", "Sorghum", "Millet", "Wheat", "Barley", "Oats"],
  },
  tubers: {
    name: "Tubers & Root Crops",
    crops: ["Cassava", "Yam", "Sweet Potato", "Irish Potato", "Cocoyam", "Ginger", "Carrot"],
  },
  legumes: {
    name: "Legumes",
    crops: ["Cowpea (Beans)", "Groundnut (Peanut)", "Soybean", "Bambara Nut", "Pigeon Pea", "Lentils", "Chickpea"],
  },
  vegetables: {
    name: "Vegetables",
    crops: [
      "Tomato",
      "Pepper (Bell)",
      "Hot Pepper",
      "Onion",
      "Okra",
      "Cabbage",
      "Lettuce",
      "Spinach",
      "Cucumber",
      "Eggplant",
      "Pumpkin",
    ],
  },
  fruits: {
    name: "Fruits",
    crops: [
      "Banana",
      "Plantain",
      "Pineapple",
      "Mango",
      "Orange",
      "Pawpaw (Papaya)",
      "Watermelon",
      "Guava",
      "Cashew",
      "Coconut",
    ],
  },
  cash_crops: {
    name: "Cash Crops",
    crops: ["Cocoa", "Coffee", "Cotton", "Oil Palm", "Rubber", "Sugarcane", "Tobacco", "Tea"],
  },
} as const

export type CropCategory = keyof typeof CROP_CATEGORIES

export function getAllCrops(): string[] {
  return Object.values(CROP_CATEGORIES).flatMap((category) => category.crops)
}

export function getCropsByCategory(category: CropCategory): string[] {
  return CROP_CATEGORIES[category].crops
}
