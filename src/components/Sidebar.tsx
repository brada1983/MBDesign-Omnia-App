'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()

    const navItems = [
        { label: 'Nadzorna ploča', href: '/dashboard', icon: '📊' },
        { label: 'Zadaci', href: '/dashboard/tasks', icon: '✅' },
        { label: 'Kalendar', href: '/dashboard/calendar', icon: '📅' },
        { label: 'Izvještaji', href: '/dashboard/reports', icon: '📄' },
        { label: 'Postavke', href: '/dashboard/settings', icon: '⚙️' },
    ]

    if (session?.user?.role === 'ADMIN') {
        navItems.push({ label: 'Korisnici', href: '/dashboard/users', icon: '👥' })
    }

    return (
        <aside className="sidebar">
            <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <img src="/mb-logo.png" alt="MB Design" style={{ height: '40px', objectFit: 'contain' }} />
                <img src="/omnia-logo.png" alt="Omnia" style={{ height: '30px', objectFit: 'contain' }} />
            </div>

            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.75rem', fontSize: '0.875rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Prijavljeni ste kao:</p>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                    {session?.user?.name || session?.user?.email}
                </p>
                <span style={{
                    display: 'inline-block',
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: session?.user?.role === 'ADMIN' ? 'var(--secondary-color)' : 'var(--accent-color)',
                    color: 'white',
                    fontSize: '0.75rem',
                    borderRadius: '1rem',
                    fontWeight: 600
                }}>
                    {session?.user?.role === 'ADMIN' ? 'ADMINISTRATOR' : 'KORISNIK'}
                </span>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.5rem',
                                color: isActive ? 'var(--secondary-color)' : 'var(--text-secondary)',
                                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                fontWeight: isActive ? 600 : 500,
                                transition: 'all 0.2s',
                                textDecoration: 'none'
                            }}
                        >
                            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    color: 'var(--danger-color)',
                    fontWeight: 600,
                    marginTop: 'auto',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <span style={{ fontSize: '1.25rem' }}>🚪</span>
                Odjava
            </button>
        </aside>
    )
}
