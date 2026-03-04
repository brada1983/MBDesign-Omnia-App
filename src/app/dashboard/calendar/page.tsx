import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CalendarClient } from '@/components/CalendarClient'

export default async function CalendarPage() {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    // Fetch tasks that have a deadline
    const tasks = await prisma.task.findMany({
        where: {
            deadline: { not: null },
            ...(isAdmin ? {} : { deletedAt: null })
        }
    })

    const events = tasks.map(t => ({
        id: t.id,
        title: t.title,
        start: t.deadline,
        end: t.deadline,
        allDay: true,
        deleted: !!t.deletedAt,
        category: t.category
    }))

    const serializedEvents = JSON.parse(JSON.stringify(events))

    return (
        <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                Kalendar Zadataka
            </h1>
            <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', backgroundColor: 'var(--surface-color)' }}>
                <CalendarClient events={serializedEvents} />
            </div>
        </div>
    )
}
