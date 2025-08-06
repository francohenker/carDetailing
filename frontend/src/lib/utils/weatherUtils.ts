export function getWeatherDescription(code: number): string {
    const weatherCodes: { [key: number]: string } = {
        0: "Cielo despejado",
        1: "Principalmente despejado",
        2: "Parcialmente nublado",
        3: "Nublado",
        45: "Niebla",
        48: "Niebla con escarcha",
        51: "Llovizna ligera",
        53: "Llovizna moderada",
        55: "Llovizna intensa",
        61: "Lluvia ligera",
        63: "Lluvia moderada",
        65: "Lluvia intensa",
        71: "Nieve ligera",
        73: "Nieve moderada",
        75: "Nieve intensa",
        80: "Chubascos ligeros",
        81: "Chubascos moderados",
        82: "Chubascos intensos",
        95: "Tormenta",
        96: "Tormenta con granizo ligero",
        99: "Tormenta con granizo intenso"
    }
    return weatherCodes[code] || "Condición desconocida"
}

export function getWeatherIconn(code: number): string {
    const iconMap: { [key: number]: string } = {
        0: "☀️",
        1: "🌤️",
        2: "⛅",
        3: "☁️",
        45: "🌫️",
        48: "🌫️",
        51: "🌦️",
        53: "🌦️",
        55: "🌧️",
        61: "🌧️",
        63: "🌧️",
        65: "🌧️",
        71: "❄️",
        73: "❄️",
        75: "❄️",
        80: "🌦️",
        81: "🌦️",
        82: "⛈️",
        95: "⛈️",
        96: "⛈️",
        99: "⛈️"
    }
    return iconMap[code] || "🌡️"
}
