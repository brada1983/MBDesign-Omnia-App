import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SettingsClient } from '@/components/SettingsClient'

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)

    return (
        <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Postavke Profila
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Ovdje možete upravljati svojim podacima za prijavu i e-mail notifikacijama.
            </p>

            <SettingsClient userEmail={session?.user?.email || ''} userRole={session?.user?.role || 'USER'} />
        </div>
    )
}
