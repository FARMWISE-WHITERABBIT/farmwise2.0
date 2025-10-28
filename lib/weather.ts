// Weather service for OpenWeatherMap API integration

interface WeatherData {
  temp: number
  feels_like: number
  humidity: number
  pressure: number
  wind_speed: number
  wind_deg: number
  clouds: number
  description: string
  icon: string
  rain?: number
  alerts?: Array<{
    event: string
    description: string
    start: number
    end: number
  }>
  forecast?: Array<{
    dt: number
    temp: number
    description: string
    icon: string
    pop: number // Probability of precipitation
  }>
}

interface FarmingAdvice {
  title: string
  message: string
  priority: "high" | "medium" | "low"
  category: string
}

/**
 * Fetch weather data from OpenWeatherMap API
 */
export async function getWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      console.error("[v0] OpenWeatherMap API key not configured")
      return null
    }

    // Fetch current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
    )

    if (!currentResponse.ok) {
      console.error("[v0] Failed to fetch current weather:", currentResponse.statusText)
      return null
    }

    const currentData = await currentResponse.json()

    // Fetch forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=8`,
    )

    let forecast = []
    if (forecastResponse.ok) {
      const forecastData = await forecastResponse.json()
      forecast = forecastData.list?.slice(0, 8).map((item: any) => ({
        dt: item.dt,
        temp: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        pop: item.pop || 0,
      }))
    }

    return {
      temp: currentData.main.temp,
      feels_like: currentData.main.feels_like,
      humidity: currentData.main.humidity,
      pressure: currentData.main.pressure,
      wind_speed: currentData.wind.speed,
      wind_deg: currentData.wind.deg,
      clouds: currentData.clouds.all,
      description: currentData.weather[0].description,
      icon: currentData.weather[0].icon,
      rain: currentData.rain?.["1h"] || 0,
      forecast,
    }
  } catch (error) {
    console.error("[v0] Error fetching weather data:", error)
    return null
  }
}

/**
 * Generate farming advice based on weather conditions
 */
export function generateFarmingAdvice(weather: WeatherData, crop?: string): FarmingAdvice[] {
  const advice: FarmingAdvice[] = []

  // Temperature-based advice
  if (weather.temp > 35) {
    advice.push({
      title: "Extreme Heat Alert",
      message: `Temperature is ${weather.temp.toFixed(1)}°C. Increase irrigation frequency and consider shade nets for sensitive crops.`,
      priority: "high",
      category: "temperature",
    })
  } else if (weather.temp < 10) {
    advice.push({
      title: "Cold Weather Alert",
      message: `Temperature is ${weather.temp.toFixed(1)}°C. Protect sensitive crops from frost damage.`,
      priority: "high",
      category: "temperature",
    })
  }

  // Rainfall advice
  if (weather.rain && weather.rain > 10) {
    advice.push({
      title: "Heavy Rainfall Expected",
      message: "Heavy rain detected. Ensure proper drainage to prevent waterlogging.",
      priority: "high",
      category: "rainfall",
    })
  }

  // Check forecast for rain probability
  const highRainProbability = weather.forecast?.some((f) => f.pop > 0.7)
  if (highRainProbability) {
    advice.push({
      title: "Rain Expected",
      message: "High probability of rain in the next 24 hours. Plan field activities accordingly.",
      priority: "medium",
      category: "rainfall",
    })
  }

  // Humidity advice
  if (weather.humidity > 80) {
    advice.push({
      title: "High Humidity Alert",
      message: `Humidity is ${weather.humidity}%. Monitor crops for fungal diseases and increase ventilation.`,
      priority: "medium",
      category: "humidity",
    })
  }

  // Wind speed advice
  if (weather.wind_speed > 10) {
    advice.push({
      title: "Strong Wind Alert",
      message: `Wind speed is ${weather.wind_speed.toFixed(1)} m/s. Secure loose structures and protect young plants.`,
      priority: "medium",
      category: "wind",
    })
  }

  // Crop-specific advice
  if (crop) {
    if (crop.toLowerCase().includes("rice") && weather.rain && weather.rain < 5) {
      advice.push({
        title: "Irrigation Needed",
        message: "Low rainfall detected. Rice crops require consistent water supply.",
        priority: "medium",
        category: "irrigation",
      })
    }
  }

  // Weather alerts
  if (weather.alerts && weather.alerts.length > 0) {
    weather.alerts.forEach((alert) => {
      advice.push({
        title: alert.event,
        message: alert.description,
        priority: "high",
        category: "alert",
      })
    })
  }

  // General advice if conditions are good
  if (advice.length === 0) {
    advice.push({
      title: "Favorable Conditions",
      message: `Weather conditions are favorable for farming activities. Temperature: ${weather.temp.toFixed(1)}°C, Humidity: ${weather.humidity}%`,
      priority: "low",
      category: "general",
    })
  }

  return advice
}

/**
 * Get location coordinates from address (state and LGA)
 */
export async function getLocationFromAddress(
  state: string,
  lga?: string,
): Promise<{ lat: number; lon: number } | null> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      console.error("[v0] OpenWeatherMap API key not configured")
      return null
    }

    const query = lga ? `${lga}, ${state}, Nigeria` : `${state}, Nigeria`
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`,
    )

    if (!response.ok) {
      console.error("[v0] Failed to geocode location:", response.statusText)
      return null
    }

    const data = await response.json()
    if (data.length === 0) {
      console.error("[v0] Location not found:", query)
      return null
    }

    return {
      lat: data[0].lat,
      lon: data[0].lon,
    }
  } catch (error) {
    console.error("[v0] Error geocoding location:", error)
    return null
  }
}

/**
 * Get weather icon URL from icon code
 */
export function getWeatherIcon(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
}
