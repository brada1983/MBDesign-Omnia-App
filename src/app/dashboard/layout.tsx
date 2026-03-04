import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                <div style={{ padding: '2rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    )
}
