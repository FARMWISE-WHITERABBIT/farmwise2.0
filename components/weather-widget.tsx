"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle } from "lucide-react"

interface WeatherData {
  temperature: number
  condition: string
  humidity: number
  rainfall: number
  windSpeed: number
  forecast: {
    date: string
    temp: number
    condition: string
    rainfall: number
  }[]
}

interface WeatherWidgetProps {
  latitude: number
  longitude: number
  location: string
}

export default function WeatherWidget({ latitude, longitude, location }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWeather() {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&forecast_days=7`,
        )

        if (!response.ok) throw new Error("Failed to fetch weather")

        const data = await response.json()

        const getWeatherCondition = (code: number): string => {
          if (code === 0) return "Clear"
          if (code <= 3) return "Partly Cloudy"
          if (code <= 48) return "Foggy"
          if (code <= 67) return "Rainy"
          if (code <= 77) return "Snowy"
          if (code <= 82) return "Showers"
          if (code <= 86) return "Snow Showers"
          return "Thunderstorm"
        }

        setWeather({
          temperature: data.current.temperature_2m,
          condition: getWeatherCondition(data.current.weather_code),
          humidity: data.current.relative_humidity_2m,
          rainfall: data.current.precipitation,
          windSpeed: data.current.wind_speed_10m,
          forecast: data.daily.time.slice(0, 7).map((date: string, index: number) => ({
            date,
            temp: (data.daily.temperature_2m_max[index] + data.daily.temperature_2m_min[index]) / 2,
            condition: getWeatherCondition(data.daily.weather_code[index]),
            rainfall: data.daily.precipitation_sum[index],
          })),
        })
      } catch (error) {
        console.error("[v0] Error fetching weather:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [latitude, longitude])

  if (loading) {
    return (
      <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
        <CardContent className="p-6">
          <p className="text-center text-[rgba(0,0,0,0.45)] font-inter">Loading weather...</p>
        </CardContent>
      </Card>
    )
  }

  if (!weather) {
    return null
  }

  const getWeatherIcon = (condition: string) => {
    if (condition.includes("Rain") || condition.includes("Shower")) return <CloudRain className="h-8 w-8" />
    if (condition.includes("Cloud")) return <Cloud className="h-8 w-8" />
    return <Sun className="h-8 w-8" />
  }

  const getAlerts = () => {
    const alerts = []
    if (weather.temperature > 35) alerts.push("High temperature")
    if (weather.temperature < 10) alerts.push("Low temperature")
    if (weather.humidity > 80) alerts.push("High humidity")
    if (weather.windSpeed > 40) alerts.push("Strong winds")
    const upcomingRain = weather.forecast.slice(0, 3).reduce((sum, day) => sum + day.rainfall, 0)
    if (upcomingRain > 50) alerts.push("Heavy rain expected")
    return alerts
  }

  const alerts = getAlerts()

  return (
    <Card className="border-[rgba(0,0,0,0.12)] rounded-[20px] bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-poppins flex items-center gap-2">
          Weather Forecast
          <Badge variant="outline" className="font-inter text-xs">
            {location}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weather */}
        <div className="flex items-center justify-between p-4 bg-[#F5F5F5] rounded-[15px]">
          <div className="flex items-center gap-4">
            <div className="text-[#39B54A]">{getWeatherIcon(weather.condition)}</div>
            <div>
              <p className="text-3xl font-poppins font-semibold text-[#000000]">{weather.temperature.toFixed(1)}°C</p>
              <p className="text-sm text-[rgba(0,0,0,0.65)] font-inter">{weather.condition}</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 text-sm text-[rgba(0,0,0,0.65)]">
              <Droplets className="h-4 w-4" />
              <span>{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[rgba(0,0,0,0.65)]">
              <Wind className="h-4 w-4" />
              <span>{weather.windSpeed.toFixed(0)} km/h</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-[15px]">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-poppins font-semibold text-yellow-900 mb-1">Weather Alerts</p>
                <ul className="text-sm text-yellow-800 font-inter space-y-1">
                  {alerts.map((alert, index) => (
                    <li key={index}>• {alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 3-Day Forecast */}
        <div>
          <p className="text-sm font-poppins font-semibold text-[rgba(0,0,0,0.65)] mb-3">3-Day Forecast</p>
          <div className="grid grid-cols-3 gap-3">
            {weather.forecast.slice(1, 4).map((day, index) => (
              <div key={index} className="p-3 bg-[#F5F5F5] rounded-[12px] text-center">
                <p className="text-xs text-[rgba(0,0,0,0.65)] font-inter mb-2">
                  {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <div className="text-[#39B54A] flex justify-center mb-2">{getWeatherIcon(day.condition)}</div>
                <p className="text-sm font-poppins font-semibold text-[#000000]">{day.temp.toFixed(0)}°C</p>
                {day.rainfall > 0 && (
                  <p className="text-xs text-blue-600 font-inter mt-1">{day.rainfall.toFixed(0)}mm</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
