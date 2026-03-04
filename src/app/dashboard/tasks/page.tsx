import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TaskClient } from '@/components/TaskClient'

export default async function TasksPage() {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    const tasks = await prisma.task.findMany({
        where: isAdmin ? undefined : { deletedAt: null },
        orderBy: [
            { status: 'asc' },
            { createdAt: 'desc' }
        ]
    })

    // We serialize dates for the client component
    const serializedTasks = tasks.map((t: any) => ({
        ...t,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        deletedAt: t.deletedAt,
        deadline: t.deadline
    }))

    return <TaskClient initialTasks={serializedTasks as any} isAdmin={isAdmin} />
}
