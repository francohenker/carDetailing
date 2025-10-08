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

interface DateWeatherData {
    date: string
    temperature: number
    condition: number
    humidity: number
    windSpeed: number
    description: string
    icon: string
    precipitation?: number
}

interface WeatherState {
    weather: WeatherData | null
    loading: boolean
    error: string | null
    lastUpdated: number | null
    // Nuevo apartado para el clima por fecha
    dateWeather: DateWeatherData | null
    dateWeatherLoading: boolean
    dateWeatherError: string | null
    selectedDate: string | null
    setWeather: (data: WeatherData) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearWeather: () => void
    isDataExpired: () => boolean
    // Nuevas funciones para clima por fecha
    setDateWeather: (data: DateWeatherData) => void
    setDateWeatherLoading: (loading: boolean) => void
    setDateWeatherError: (error: string | null) => void
    clearDateWeather: () => void
    setSelectedDate: (date: string) => void
}

export const useWeatherStore = create<WeatherState>()(
    persist(
        (set, get) => ({
            weather: null,
            loading: false,
            error: null,
            lastUpdated: null,
            // Nuevo estado para clima por fecha
            dateWeather: null,
            dateWeatherLoading: false,
            dateWeatherError: null,
            selectedDate: null,

            setWeather: (data) => set({ weather: data, lastUpdated: Date.now() }),
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),
            clearWeather: () => set({ weather: null, lastUpdated: null }),

            isDataExpired: () => {
                const lastUpdated = get().lastUpdated
                if (!lastUpdated) return true
                return Date.now() - lastUpdated > 1000 * 60 * 60 // 1 hora
            },

            // Nuevas funciones para clima por fecha
            setDateWeather: (data) => set({ dateWeather: data }),
            setDateWeatherLoading: (loading) => set({ dateWeatherLoading: loading }),
            setDateWeatherError: (error) => set({ dateWeatherError: error }),
            clearDateWeather: () => set({ dateWeather: null, selectedDate: null }),
            setSelectedDate: (date) => set({ selectedDate: date }),
        }),
        {
            name: "weather-storage",
        }
    )
)
