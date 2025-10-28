/**
 * Calculate the area of a polygon defined by GPS coordinates using the Shoelace formula
 * @param points Array of {lat, lng} coordinates
 * @returns Area in hectares
 */
export function calculatePolygonArea(points: Array<{ lat: number; lng: number }>): number {
  if (points.length < 3) return 0

  let area = 0
  const earthRadius = 6371000 // Earth's radius in meters

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    const lat1 = (points[i].lat * Math.PI) / 180
    const lat2 = (points[j].lat * Math.PI) / 180
    const lng1 = (points[i].lng * Math.PI) / 180
    const lng2 = (points[j].lng * Math.PI) / 180

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }

  area = (Math.abs(area) * earthRadius * earthRadius) / 2
  return area / 10000 // Convert square meters to hectares
}

/**
 * Format GPS coordinates for display
 */
export function formatCoordinates(lat: number, lng: number, precision = 6): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`
}

/**
 * Calculate distance between two GPS points in meters
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
