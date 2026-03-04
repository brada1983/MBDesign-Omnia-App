import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    // Fetch some basic stats
    const totalTasks = await prisma.task.count({
        where: isAdmin ? undefined : { deletedAt: null }
    })

    const recentTasks = await prisma.task.findMany({
        where: isAdmin ? undefined : { deletedAt: null },
        orderBy: [
            { status: 'asc' },
            { createdAt: 'desc' }
        ],
        take: 5,
    })

    return (
        <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Nadzorna ploča
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Dobrodošli natrag, {session?.user?.name || 'Korisniče'}.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* Simple Stat Card */}
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Ukupno zadataka
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--secondary-color)' }}>
                        {totalTasks}
                    </p>
                </div>

                {/* We can add more stat cards here for Hours logged, etc. */}
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Nedavni zadaci
            </h2>

            <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                {recentTasks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {recentTasks.map((task: any, i: number) => (
                            <div
                                key={task.id}
                                style={{
                                    padding: '1rem 1.5rem',
                                    borderBottom: i < recentTasks.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {task.title}
                                        <span style={{
                                            padding: '0.125rem 0.5rem',
                                            backgroundColor: task.status === 'ZATVOREN' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-color)',
                                            color: task.status === 'ZATVOREN' ? '#10b981' : 'var(--text-primary)',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            border: `1px solid ${task.status === 'ZATVOREN' ? '#10b981' : 'var(--border-color)'}`
                                        }}>
                                            {task.status}
                                        </span>
                                        {task.deletedAt && (
                                            <span style={{ padding: '0.125rem 0.5rem', fontSize: '0.7rem', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '1rem' }}>Uklonjeno</span>
                                        )}
                                    </h4>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {task.category}
                                    </p>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {new Date(task.createdAt).toLocaleDateString('hr-HR')}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Nema nedavnih zadataka.
                    </div>
                )}
            </div>
        </div>
    )
}
