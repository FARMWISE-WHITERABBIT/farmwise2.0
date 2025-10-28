/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (Nigerian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+234|0)[789]\d{9}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

/**
 * Validate GPS coordinates
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "")
}
