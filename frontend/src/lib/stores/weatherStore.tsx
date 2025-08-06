import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface WeatherData {
    location: string
    temperature: number
    condition: number
    humidity: number
    windSpeed: number
    description: string
    icon: string
}

interface WeatherState {
    weather: WeatherData | null
    lastUpdated: number | null
    loading: boolean
    error: string | null
    setWeather: (weather: WeatherData) => void
    setLastUpdated: (timestamp: number) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
}

export const useWeatherStore = create<WeatherState>()(
    persist(
        (set) => ({
            weather: null,
            lastUpdated: null,
            loading: true,
            error: null,
            setWeather: (weather) => set({ weather }),
            setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),
        }),
        {
            name: "weather-storage",
            partialize: (state) => ({
                weather: state.weather,
                lastUpdated: state.lastUpdated,
            }),
        }
    )
)
