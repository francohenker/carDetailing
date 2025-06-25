"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchWeatherApi } from "openmeteo"

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


function getWeatherDescription(code : number) {
    const weatherCodes = {
        0: "Cielo despejado",
        1: "Principalmente despejado",
        2: "Parcialmente nublado",
        3: "Nublado",
        45: "Niebla",
        48: "Niebla con escarcha",
        51: "Llovizna ligera",
        53: "Llovizna moderada",
        55: "Llovizna intensa",
        56: "Llovizna helada ligera",
        57: "Llovizna helada intensa",
        61: "Lluvia ligera",
        63: "Lluvia moderada",
        65: "Lluvia intensa",
        66: "Lluvia helada ligera",
        67: "Lluvia helada intensa",
        71: "Nieve ligera",
        73: "Nieve moderada",
        75: "Nieve intensa",
        77: "Granizo",
        80: "Chubascos ligeros",
        81: "Chubascos moderados",
        82: "Chubascos intensos",
        85: "Chubascos de nieve ligeros",
        86: "Chubascos de nieve intensos",
        95: "Tormenta",
        96: "Tormenta con granizo ligero",
        99: "Tormenta con granizo intenso"
    };
    
    return weatherCodes[code] || "Condición desconocida";
}

function getWeatherIconn(code : number) {
    const iconMap = {
        0: "☀️", // Despejado
        1: "🌤️", // Principalmente despejado
        2: "⛅", // Parcialmente nublado
        3: "☁️", // Nublado
        45: "🌫️", // Niebla
        48: "🌫️", // Niebla con escarcha
        51: "🌦️", // Llovizna ligera
        53: "🌦️", // Llovizna moderada
        55: "🌧️", // Llovizna intensa
        61: "🌧️", // Lluvia ligera
        63: "🌧️", // Lluvia moderada
        65: "🌧️", // Lluvia intensa
        71: "❄️", // Nieve ligera
        73: "❄️", // Nieve moderada
        75: "❄️", // Nieve intensa
        80: "🌦️", // Chubascos ligeros
        81: "🌦️", // Chubascos moderados
        82: "⛈️", // Chubascos intensos
        85: "🌨️", // Chubascos de nieve ligeros
        86: "🌨️", // Chubascos de nieve intensos
        95: "⛈️", // Tormenta
        96: "⛈️", // Tormenta con granizo ligero
        99: "⛈️"  // Tormenta con granizo intenso
    };
    
    return iconMap[code] || "🌡️";
}




export function WeatherWidget() {
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Función para obtener el icono según la condición climática
    const getWeatherIcon = (condition: number) => {
        // const conditionLower = condition.toLowerCase()
        if (condition === 0 ) {
            return <img src="sun.svg"></img>
        } else if (condition < 66 && condition > 48) {
            return <img src="rain_animate.svg"></img>
        } else if (condition < 99 && condition > 75) {
            return <img src="rain_animate.svg"></img>
        } else if (condition < 0 && condition > 3) {
            return <img src="sun_cloudy.svg"></img>
        } else if (condition === 3) {
            return <img src="cloud.svg"></img> // nublado
        } else {
            return getWeatherIconn(0) 
        }
    }

    // Función para obtener el color del badge según la condición
    const getConditionColor = (condition: number) => {
        if (condition === 0) {
            return "default"
        } else if (condition < 99 && condition > 48) {
            return "destructive"
        } else if (condition === 3) {
            return "secondary"
        } else {
            return "outline"
        }
    }

    // Simulación de llamada a API del clima
    useEffect(() => {
        const fetchWeather = async () => {
            const params = {
                // San vicente, Misiones
                "latitude": [-27.0005],
                "longitude": [-54.4816],
                "hourly": ["temperature_2m", "apparent_temperature", "precipitation_probability", "precipitation"],
                "current": ["temperature_2m", "precipitation", "weather_code", "cloud_cover", "apparent_temperature", "wind_speed_10m", "relative_humidity_2m"],
                "timezone": "America/Sao_Paulo",
                "start_date": "2025-06-25",
                "end_date": "2025-06-26"
            };

            const url = "https://api.open-meteo.com/v1/forecast";
            const responses = await fetchWeatherApi(url, params);

            // Process first location. Add a for-loop for multiple locations or weather models
            const response = responses[0];

            // Attributes for timezone and location
            const utcOffsetSeconds = response.utcOffsetSeconds();
            const timezone = response.timezone();
            const timezoneAbbreviation = response.timezoneAbbreviation();
            const latitude = response.latitude();
            const longitude = response.longitude();

            const current = response.current()!;
            const hourly = response.hourly()!;

            // Note: The order of weather variables in the URL query and the indices below need to match!
            const weatherData = {
                current: {
                    time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
                    temperature2m: current.variables(0)!.value(),
                    precipitation: current.variables(1)!.value(),
                    weatherCode: current.variables(2)!.value(),
                    cloudCover: current.variables(3)!.value(),
                    apparentTemperature: current.variables(4)!.value(),
                    windSpeed10m: current.variables(5)!.value(),
                    relativeHumidity2m: current.variables(6)!.value(),
                },
                hourly: {
                    time: [...Array((Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval())].map(
                        (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
                    ),
                    temperature2m: hourly.variables(0)!.valuesArray()!,
                    apparentTemperature: hourly.variables(1)!.valuesArray()!,
                    precipitationProbability: hourly.variables(2)!.valuesArray()!,
                    precipitation: hourly.variables(3)!.valuesArray()!,
                },
            };

            setWeather({
                location: "San Vicente, Misiones",
                temperature: weatherData.current.temperature2m, // Usamos el primer valor
                condition: 3,
                // condition: weatherData.current.weatherCode, // Aquí deberías mapear la condición real desde la API
                windSpeed: weatherData.current.windSpeed10m,
                humidity: weatherData.current.relativeHumidity2m, // Simulación    
                description: getWeatherDescription(2), // Simulación
                icon: getWeatherIconn(1), // Simulación
            })
            setLoading(false)
            console.log(weatherData.current.weatherCode);
        }

        fetchWeather()

        // Actualizar cada 10 minutos
        const interval = setInterval(fetchWeather, 10 * 60 * 1000)

        return () => clearInterval(interval)
    }, [])

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
                        <button onClick={() => window.location.reload()} className="text-sm text-blue-600 hover:underline mt-2">
                            Intentar nuevamente
                        </button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!weather) return null

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-center">
                    <CardTitle className="text-base text-center">Condiciones climáticas</CardTitle>
                    {/* <Badge variant={getConditionColor(weather.condition)} className="text-xs">
                        {weather.condition}
                    </Badge> */}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-shrink-0">{getWeatherIcon(weather.condition)}</div>
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
                        <p className="text-sm font-medium">{weather.humidity}%</p>
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
                        {weather.condition < 100 && weather.condition > 49
                            ? "⚠️ No recomendado - Condiciones de lluvia"
                            : weather.condition >= 0 && weather.condition < 3
                                ? "✅ Excelente - Condiciones ideales para el secado"
                                : "👍 Bueno - Condiciones aceptables para servicios"}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
