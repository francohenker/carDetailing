"use client"

import { use, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchWeatherApi } from "openmeteo"
import { useWeatherStore } from "../lib/stores/weatherStore"
import { getWeatherDescription, getWeatherIconn } from "@/lib/utils/weatherUtils"

// Tipos para los datos del clima
interface WeatherData {
    location: string
    temperature: number
    condition: number
    humidity: number
    windSpeed: number
    description: string
    icon: string
}

export function WeatherWidget() {
    const weather = useWeatherStore((state) => state.weather)
    const loading = useWeatherStore((state) => state.loading)
    const error = useWeatherStore((state) => state.error)
    const setWeather = useWeatherStore((state) => state.setWeather)
    const setLoading = useWeatherStore((state) => state.setLoading)
    const setError = useWeatherStore((state) => state.setError)

    const lastUpdated = useWeatherStore((state) => state.lastUpdated)

    const clearWeather = useWeatherStore((state) => state.clearWeather)

    const fetchWeather = async () => {
        useWeatherStore.setState({ loading: true })
        try {
            const params = {
                latitude: [-27.0005],
                longitude: [-54.4816],
                hourly: ["temperature_2m", "apparent_temperature", "precipitation_probability", "precipitation"],
                current: ["temperature_2m", "precipitation", "weather_code", "cloud_cover", "apparent_temperature", "wind_speed_10m", "relative_humidity_2m"],
                timezone: "America/Sao_Paulo",
                start_date: "2025-06-25",
                end_date: "2025-06-26",
            }

            const url = "https://api.open-meteo.com/v1/forecast"
            const responses = await fetchWeatherApi(url, params)
            const response = responses[0]
            const utcOffsetSeconds = response.utcOffsetSeconds()
            const current = response.current()!

            const weatherData = {
                location: "San Vicente, Misiones",
                temperature: current.variables(0)!.value(),
                precipitation: current.variables(1)!.value(),
                condition: current.variables(2)!.value(),
                cloudCover: current.variables(3)!.value(),
                apparentTemperature: current.variables(4)!.value(),
                windSpeed: current.variables(5)!.value(),
                humidity: current.variables(6)!.value(),
            }

            setWeather({
                location: weatherData.location,
                temperature: weatherData.temperature,
                condition: weatherData.condition,
                windSpeed: weatherData.windSpeed,
                humidity: weatherData.humidity,
                description: getWeatherDescription(weatherData.condition),
                icon: getWeatherIconn(weatherData.condition),
            })

            useWeatherStore.setState({ lastUpdated: Date.now() })
            useWeatherStore.setState({ error: null })
        } catch (err) {
            useWeatherStore.setState({ error: "Error al obtener el clima" })
        } finally {
            useWeatherStore.setState({ loading: false })
        }
    }


    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        const unsub = useWeatherStore.persist.onFinishHydration(() => {
            console.log("Hydration finished")
            setIsHydrated(true)
        })
        if (useWeatherStore.persist.hasHydrated()) setIsHydrated(true)
        if (!useWeatherStore.getState().weather || useWeatherStore.getState().isDataExpired()) {


            fetchWeather()
        }
        console.log(weather)
        console.log(isHydrated)
        return () => unsub();
    }, [])

    if (!isHydrated) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Condiciones climáticas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Condiciones climáticas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <Skeleton className="h-3 w-16 mx-auto mb-1" />
                            <Skeleton className="h-4 w-12 mx-auto" />
                        </div>
                        <div className="text-center">
                            <Skeleton className="h-3 w-16 mx-auto mb-1" />
                            <Skeleton className="h-4 w-12 mx-auto" />
                        </div>
                        <div className="text-center">
                            <Skeleton className="h-3 w-16 mx-auto mb-1" />
                            <Skeleton className="h-4 w-12 mx-auto" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Condiciones climáticas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <button
                            onClick={() => {
                                setError(null)
                                clearWeather()
                                window.location.reload()
                            }}
                            className="text-sm text-blue-600 hover:underline mt-2"
                        >
                            Intentar nuevamente
                        </button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!weather) {
                return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Condiciones climáticas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-left">Condiciones climáticas</CardTitle>
                    {lastUpdated && (
                        <span className="text-xs text-muted-foreground">
                            {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-shrink-0 text-6xl">{getWeatherIconn(weather.condition)}</div>
                    <div className="flex-1">
                        <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-bold">{weather.temperature.toFixed(1)}°</span>
                            <span className="text-sm text-muted-foreground">C</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{weather.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{weather.location}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-muted-foreground">Humedad</p>
                        <p className="text-sm font-medium">{weather.humidity.toFixed(0)}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Viento</p>
                        <p className="text-sm font-medium">{weather.windSpeed.toFixed(1)} km/h</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Sensación</p>
                        <p className="text-sm font-medium">
                            {weather.temperature > 23 ? "Cálido" : weather.temperature > 15 ? "Templado" : "Fresco"}
                        </p>
                    </div>
                </div>

                {/* Recomendación para el lavado */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Recomendación para lavado:</p>
                    <p className="text-sm">
                        {weather.condition >= 51 && weather.condition <= 99
                            ? "⚠️ No recomendado - Condiciones de lluvia"
                            : weather.condition >= 0 && weather.condition <= 3
                                ? "✅ Excelente - Condiciones ideales para el secado"
                                : "👍 Bueno - Condiciones aceptables para servicios"}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}