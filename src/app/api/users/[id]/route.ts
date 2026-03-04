import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { sendEmailNotification } from "@/lib/nodemailer"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { name, email, password, role, sendEmail } = body

        const updateData: any = {}

        if (name !== undefined) updateData.name = name
        if (email !== undefined) updateData.email = email
        if (role !== undefined) updateData.role = role

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10)
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            }
        })

        if (sendEmail) {
            const passwordText = (password && password.trim() !== '') ? password : 'Nije promijenjena (koristite staru)'
            await sendEmailNotification(
                updateData.email || email,
                `Vaš račun je ažuriran - Novi podaci`,
                `<p>Poštovani ${updateData.name || name || ''},</p>
                 <p>Vaši pristupni podaci za aplikaciju su ažurirani od strane administratora.</p>
                 <ul>
                    <li><strong>E-mail:</strong> ${updateData.email || email}</li>
                    <li><strong>Lozinka:</strong> ${passwordText}</li>
                 </ul>
                 <p>Prijavite se na: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}">Prijavi se</a></p>`
            )
        }

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("Failed to update user:", error)
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.id === id) {
        return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 })
    }

    try {
        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }
}
