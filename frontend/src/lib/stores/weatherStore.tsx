import { create } from "zustand"
import { persist } from "zustand/middleware"

interface WeatherData {
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
    loading: boolean
    error: string | null
    lastUpdated: number | null
    setWeather: (data: WeatherData) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearWeather: () => void
    isDataExpired: () => boolean
}

export const useWeatherStore = create<WeatherState>()(
    persist(
        (set, get) => ({
            weather: null,
            loading: false,
            error: null,
            lastUpdated: null,

            setWeather: (data) => set({ weather: data, lastUpdated: Date.now() }),
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),
            clearWeather: () => set({ weather: null, lastUpdated: null }),

            isDataExpired: () => {
                const lastUpdated = get().lastUpdated
                if (!lastUpdated) return true
                return Date.now() - lastUpdated > 1000 * 60 * 60 // 1 hora
            }
        }),
        {
            name: "weather-storage",
        }
    )
)
