import { UsersClient } from '@/components/UsersClient'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from 'next/navigation'

export default async function UsersPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    return <UsersClient />
}
