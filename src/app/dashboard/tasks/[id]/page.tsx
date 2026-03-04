import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { TaskDetailsClient } from '@/components/TaskDetailsClient'
import Link from 'next/link'

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    const task = await prisma.task.findUnique({
        where: { id },
        include: {
            logs: {
                include: { user: true },
                orderBy: { createdAt: 'desc' }
            },
            timeEntries: {
                include: { user: true },
                orderBy: { createdAt: 'desc' }
            },
            attachments: true
        }
    })

    if (!task) return notFound()
    if (task.deletedAt && !isAdmin) return notFound()

    // Serialize dates for Client Component
    const serializeDates = (obj: any) => JSON.parse(JSON.stringify(obj))

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/dashboard/tasks" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                    ← Natrag na zadatke
                </Link>
            </div>

            <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', marginBottom: '2rem', position: 'relative' }}>
                {task.deletedAt && (
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'var(--danger-color)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        UKLONJENO (OD {task.removedBy})
                    </div>
                )}
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {task.title}
                </h1>
                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <span>Status: <strong style={{ color: task.status === 'ZATVOREN' ? '#10b981' : 'var(--text-primary)' }}>{task.status}</strong></span>
                    <span>Kategorija: <strong style={{ color: 'var(--text-primary)' }}>{task.category}</strong></span>
                    <span>Rok: <strong style={{ color: 'var(--text-primary)' }}>{task.deadline ? new Date(task.deadline).toLocaleDateString('hr-HR') : 'Nije postavljen'}</strong></span>
                    <span>Predviđeno vrijeme: <strong style={{ color: 'var(--text-primary)' }}>{task.assignedHours ? `${task.assignedHours} sati` : 'Nije postavljeno'}</strong></span>
                    <span>Kreirano: <strong style={{ color: 'var(--text-primary)' }}>{new Date(task.createdAt).toLocaleDateString('hr-HR')}</strong></span>
                </div>

                {task.description && (
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '1rem', color: 'var(--text-primary)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Opis Zadataka:</h3>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{task.description}</p>
                    </div>
                )}
            </div>

            <TaskDetailsClient task={serializeDates(task)} currentUserRole={session?.user?.role as string} />
        </div>
    )
}
