import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReportClient } from '@/components/ReportClient'

export default async function ReportsPage() {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    // Fetch all tasks for the report (excluding deleted ones for Omnia, or including them for Marko but maybe omitting from reports)
    const tasks = await prisma.task.findMany({
        where: { deletedAt: null },
        include: { timeEntries: true },
        orderBy: { createdAt: 'desc' }
    })

    // Group tasks by category and calculate total hours
    const serializedTasks = tasks.map(t => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        deadline: t.deadline?.toISOString() || null,
        totalHours: t.timeEntries.reduce((acc, entry) => acc + (entry.manualHours || 0), 0)
    }))

    return (
        <div>
            <h1 className="no-print" style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                Mjesečni Izvještaji
            </h1>
            <ReportClient allTasks={serializedTasks} />
        </div>
    )
}
