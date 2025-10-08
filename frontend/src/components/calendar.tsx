'use client'
import React, { useState } from 'react'
import { Calendar, dateFnsLocalizer, Event, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Configurar el localizador con date-fns
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales: { es }
})

// Definir el tipo de evento
interface CalendarEvent extends Event {
    id: string
    title: string
    start: Date
    end: Date
    resource?: {
        temperature?: number
        weatherCode?: number
        icon?: string
    }
}

const MyCalendar: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([
    //     {
    //         id: '1',
    //         title: 'Mi evento',
    //         start: new Date(),
    //         end: new Date(Date.now() + 3600000), // 1 hora después
    //     },
    //     {
    //         id: '2',
    //         title: 'Reunión',
    //         start: new Date(Date.now() + 86400000), // Mañana
    //         end: new Date(Date.now() + 86400000 + 3600000), // Mañana + 1 hora
    //     }
    ])

    const handleSelectSlot = ({ start, end }: { start: Date; end: Date }): void => {
        const title = window.prompt('Nuevo evento:')
        if (title) {
            const newEvent: CalendarEvent = {
                id: Date.now().toString(),
                title,
                start,
                end,
            }
            setEvents([...events, newEvent])
        }
    }

    const handleSelectEvent = (event: CalendarEvent): void => {
        // Evento seleccionado
        alert(`Evento: ${event.title}`)
    }

    return (
        <div style={{ height: 600 }}>
            <Calendar<CalendarEvent>
                localizer={localizer}
                // events={events}
                startAccessor="start"
                endAccessor="end"
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                selectable
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                defaultView={Views.MONTH}
                step={60}
                showMultiDayTimes
                eventPropGetter={() => ({
                    style: {
                        backgroundColor: '#3174ad',
                        borderRadius: '5px',
                        opacity: 0.8,
                        color: 'white',
                        border: '0px',
                        display: 'block'
                    }
                })}
            />
        </div>
    )
}

export default MyCalendar