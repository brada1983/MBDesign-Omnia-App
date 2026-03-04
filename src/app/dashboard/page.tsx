import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    const baseWhere = isAdmin ? { deletedAt: null } : { deletedAt: null }

    // Fetch status counts
    const [openCount, inProgressCount, closedCount, recentTasks] = await Promise.all([
        prisma.task.count({ where: { ...baseWhere, status: 'OTVOREN' } }),
        prisma.task.count({ where: { ...baseWhere, status: 'U TIJEKU' } }),
        prisma.task.count({ where: { ...baseWhere, status: 'ZATVOREN' } }),
        prisma.task.findMany({
            where: baseWhere,
            orderBy: { createdAt: 'desc' },
            take: 5,
        }),
    ])

    const totalTasks = openCount + inProgressCount + closedCount

    // Completion time metrics: calculate from tasks that are ZATVOREN
    // We use the gap between createdAt and updatedAt as a proxy for completion time
    const closedTasks = await prisma.task.findMany({
        where: { ...baseWhere, status: 'ZATVOREN' },
        select: { createdAt: true, updatedAt: true, title: true }
    })

    const completionDays = closedTasks.map(t => {
        const diff = t.updatedAt.getTime() - t.createdAt.getTime()
        return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24))) // min 1 day
    })

    const avgDays = completionDays.length > 0
        ? Math.round(completionDays.reduce((a, b) => a + b, 0) / completionDays.length)
        : null
    const minDays = completionDays.length > 0 ? Math.min(...completionDays) : null
    const maxDays = completionDays.length > 0 ? Math.max(...completionDays) : null

    // Chart bar widths (percentage of total)
    const chartTotal = Math.max(totalTasks, 1)
    const openPct = Math.round((openCount / chartTotal) * 100)
    const inProgressPct = Math.round((inProgressCount / chartTotal) * 100)
    const closedPct = Math.round((closedCount / chartTotal) * 100)

    const statusColor = (status: string) => {
        if (status === 'ZATVOREN') return '#10b981'
        if (status === 'U TIJEKU') return 'var(--secondary-color)'
        return 'var(--text-secondary)'
    }

    return (
        <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Nadzorna ploča
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Dobrodošli natrag, {session?.user?.name || 'Korisniče'}.
            </p>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', borderTop: '4px solid var(--text-secondary)' }}>
                    <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Otvoreni
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{openCount}</p>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', borderTop: '4px solid var(--secondary-color)' }}>
                    <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        U Tijeku
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--secondary-color)' }}>{inProgressCount}</p>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', borderTop: '4px solid #10b981' }}>
                    <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Završeni
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10b981' }}>{closedCount}</p>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', borderTop: '4px solid var(--primary-color)' }}>
                    <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Ukupno
                    </h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>{totalTasks}</p>
                </div>
            </div>

            {/* Chart + Metrics row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>

                {/* Horizontal Bar Chart */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '1rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.75rem', color: 'var(--text-primary)' }}>
                        Pregled statusa zadataka
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Otvoreni */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Otvoreni</span>
                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{openCount}</span>
                            </div>
                            <div style={{ height: '12px', borderRadius: '9999px', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${openPct}%`, borderRadius: '9999px', background: 'linear-gradient(90deg, #94a3b8, #64748b)', transition: 'width 0.6s ease' }} />
                            </div>
                        </div>

                        {/* U Tijeku */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>U Tijeku</span>
                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--secondary-color)' }}>{inProgressCount}</span>
                            </div>
                            <div style={{ height: '12px', borderRadius: '9999px', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${inProgressPct}%`, borderRadius: '9999px', background: 'linear-gradient(90deg, var(--secondary-color), #6366f1)', transition: 'width 0.6s ease' }} />
                            </div>
                        </div>

                        {/* Završeni */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Završeni</span>
                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10b981' }}>{closedCount}</span>
                            </div>
                            <div style={{ height: '12px', borderRadius: '9999px', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${closedPct}%`, borderRadius: '9999px', background: 'linear-gradient(90deg, #10b981, #059669)', transition: 'width 0.6s ease' }} />
                            </div>
                        </div>

                        {/* Stacked total bar */}
                        {totalTasks > 0 && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ukupni omjer</div>
                                <div style={{ height: '20px', borderRadius: '9999px', backgroundColor: 'var(--bg-color)', overflow: 'hidden', display: 'flex' }}>
                                    <div style={{ width: `${openPct}%`, background: 'linear-gradient(90deg, #94a3b8, #64748b)' }} />
                                    <div style={{ width: `${inProgressPct}%`, background: 'linear-gradient(90deg, var(--secondary-color), #6366f1)' }} />
                                    <div style={{ width: `${closedPct}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#64748b' }} /> Otvoreni
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--secondary-color)' }} /> U Tijeku
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} /> Završeni
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Completion Time Metrics */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '1rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.75rem', color: 'var(--text-primary)' }}>
                        Metrika vremena rješavanja
                    </h2>

                    {completionDays.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                            Nema završenih zadataka za analizu.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.75rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Prosječno</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--secondary-color)' }}>{avgDays}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>dana</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.75rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Najkraće</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{minDays}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>dana</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.75rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Najduže</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger-color)' }}>{maxDays}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>dana</div>
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Raspon završenih zadataka ({closedCount})
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                                    {closedTasks.map((t, i) => {
                                        const days = Math.max(1, Math.round((t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
                                        const maxD = maxDays || 1
                                        const pct = Math.round((days / maxD) * 100)
                                        return (
                                            <div key={i} style={{ fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                                    <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{t.title}</span>
                                                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{days}d</span>
                                                </div>
                                                <div style={{ height: '6px', borderRadius: '9999px', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: '9999px', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Tasks */}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Nedavni zadaci
            </h2>

            <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                {recentTasks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {recentTasks.map((task: any, i: number) => (
                            <Link
                                href={`/dashboard/tasks/${task.id}`}
                                key={task.id}
                                style={{
                                    padding: '1rem 1.5rem',
                                    borderBottom: i < recentTasks.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    textDecoration: 'none',
                                    transition: 'background-color 0.15s'
                                }}
                            >
                                <div>
                                    <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {task.title}
                                        <span style={{
                                            padding: '0.1rem 0.5rem',
                                            backgroundColor: task.status === 'ZATVOREN' ? 'rgba(16, 185, 129, 0.1)' : task.status === 'U TIJEKU' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-color)',
                                            color: statusColor(task.status),
                                            borderRadius: '0.5rem',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            border: `1px solid ${statusColor(task.status)}40`
                                        }}>
                                            {task.status}
                                        </span>
                                    </h4>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {task.category}
                                    </p>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {new Date(task.createdAt).toLocaleDateString('hr-HR')}
                                </div>
                            </Link>
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
