"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchWeatherApi } from "openmeteo"
import { useWeatherStore } from "../lib/stores/weatherStore"
import { getWeatherDescription, getWeatherIconn } from "@/lib/utils/weatherUtils"

interface DateWeatherWidgetProps {
    date: Date
    className?: string
}

export function DateWeatherWidget({ date, className = "" }: DateWeatherWidgetProps) {
    const dateWeather = useWeatherStore((state) => state.dateWeather)
    const dateWeatherLoading = useWeatherStore((state) => state.dateWeatherLoading)
    const dateWeatherError = useWeatherStore((state) => state.dateWeatherError)
    const selectedDate = useWeatherStore((state) => state.selectedDate)
    const setDateWeather = useWeatherStore((state) => state.setDateWeather)
    const setDateWeatherLoading = useWeatherStore((state) => state.setDateWeatherLoading)
    const setDateWeatherError = useWeatherStore((state) => state.setDateWeatherError)
    const setSelectedDate = useWeatherStore((state) => state.setSelectedDate)

    // Formatear fecha para la API (YYYY-MM-DD)
    const formatDateForAPI = (date: Date): string => {
        return new Intl.DateTimeFormat('en-CA').format(date)
    }

    const dateString = formatDateForAPI(date)

    useEffect(() => {
        const fetchDateWeather = async () => {
            // Si ya tenemos datos para esta fecha, no hacer otra petición
            if (selectedDate === dateString && dateWeather) {
                return
            }

            setDateWeatherLoading(true)
            setSelectedDate(dateString)
            
            try {
                const params = {
                    latitude: [-27.9200], // Apóstoles, Misiones -27.92,-55.74
                    longitude: [-55.7400],
                    daily: ["temperature_2m_max", "temperature_2m_min", "weather_code", "precipitation_probability_max", "wind_speed_10m_max"],
                    timezone: "America/Sao_Paulo",
                    start_date: dateString,
                    end_date: dateString,
                }
                
                const url = "https://api.open-meteo.com/v1/forecast"
                const responses = await fetchWeatherApi(url, params)
                const response = responses[0]
                const daily = response.daily()!

                const weatherData = {
                    date: dateString,
                    temperature: daily.variables(0)!.valuesArray()![0], // max temp
                    condition: daily.variables(2)!.valuesArray()![0], // weather code
                    humidity: daily.variables(3)!.valuesArray()![0], // precipitation probability
                    windSpeed: daily.variables(4)!.valuesArray()![0], // max wind speed
                    description: getWeatherDescription(daily.variables(2)!.valuesArray()![0]),
                    icon: getWeatherIconn(daily.variables(2)!.valuesArray()![0]),
                    precipitation: daily.variables(3)!.valuesArray()![0],
                }

                setDateWeather(weatherData)
                setDateWeatherError(null)
            } catch (error) {
                console.error('Error fetching date weather:', error)
                setDateWeatherError("Unicamente podemos obtener los datos del tiempo de los proximos 15 días")
            } finally {
                setDateWeatherLoading(false)
            }
        }

        fetchDateWeather()
    }, [dateString, selectedDate, dateWeather, setDateWeather, setDateWeatherLoading, setDateWeatherError, setSelectedDate])

    if (dateWeatherLoading) {
        return (
            <Card className={className}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Clima para el día seleccionado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
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

    if (dateWeatherError) {
        return (
            <Card className={className}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Clima para el día seleccionado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">{dateWeatherError}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!dateWeather || selectedDate !== dateString) {
        return (
            <Card className={className}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Clima para el día seleccionado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">Selecciona una fecha para ver el clima</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">
                    Clima para {new Intl.DateTimeFormat('es-ES', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                    }).format(date)}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-shrink-0 text-4xl">{dateWeather.icon}</div>
                    <div className="flex-1">
                        <div className="flex items-baseline space-x-1">
                            <span className="text-xl font-bold">{dateWeather.temperature.toFixed(1)}°</span>
                            <span className="text-sm text-muted-foreground">C</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{dateWeather.description}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-xs text-muted-foreground">Probabilidad lluvia</p>
                        <p className="text-sm font-medium">{dateWeather.precipitation?.toFixed(0) || 0}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Viento máx.</p>
                        <p className="text-sm font-medium">{dateWeather.windSpeed.toFixed(1)} km/h</p>
                    </div>
                </div>

                {/* Recomendación para el día */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Recomendación:</p>
                    <p className="text-sm">
                        {dateWeather.condition >= 51 && dateWeather.condition <= 99
                            ? "⚠️ Puede llover - Considerar reprogramar"
                            : (dateWeather.precipitation && dateWeather.precipitation > 50)
                                ? "🌧️ Alta probabilidad de lluvia"
                                : dateWeather.condition >= 0 && dateWeather.condition <= 3
                                    ? "✅ Excelente día para servicios"
                                    : "👍 Buen día para el lavado"}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}