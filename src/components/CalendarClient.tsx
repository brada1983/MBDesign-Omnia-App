'use client'

import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/hr'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useRouter } from 'next/navigation'

// Set moment to Croatian
moment.locale('hr')
const localizer = momentLocalizer(moment)

export function CalendarClient({ events }: { events: any[] }) {
    const router = useRouter()

    // Custom event styles
    const eventPropGetter = (event: any) => {
        let backgroundColor = 'var(--secondary-color)'

        if (event.deleted) {
            backgroundColor = 'var(--danger-color)'
        } else if (event.category === 'Marketing materijali') {
            backgroundColor = '#8b5cf6'
        } else if (event.category === 'Servis računala') {
            backgroundColor = '#10b981'
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '0.5rem',
                opacity: event.deleted ? 0.7 : 1,
                color: 'white',
                border: 'none',
                display: 'block'
            }
        }
    }

    return (
        <div style={{ height: '70vh', minHeight: '500px' }}>
            <style>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-toolbar button {
          color: var(--text-primary);
        }
        .rbc-toolbar button.rbc-active {
          background-color: var(--secondary-color);
          color: white;
        }
        .rbc-event {
          padding: 2px 5px;
        }
        .rbc-today {
          background-color: rgba(59, 130, 246, 0.05);
        }
      `}</style>
            <Calendar
                localizer={localizer}
                events={events.map(e => ({ ...e, start: new Date(e.start), end: new Date(e.end) }))}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={(event) => router.push(`/dashboard/tasks/${event.id}`)}
                eventPropGetter={eventPropGetter}
                messages={{
                    next: "Sljedeći",
                    previous: "Prethodni",
                    today: "Danas",
                    month: "Mjesec",
                    week: "Tjedan",
                    day: "Dan"
                }}
            />
        </div>
    )
}
