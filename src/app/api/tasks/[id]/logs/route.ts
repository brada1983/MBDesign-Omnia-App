import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmailNotification } from "@/lib/nodemailer"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { content, status } = await req.json()
        if (!content) return NextResponse.json({ error: "Sadržaj je obavezan" }, { status: 400 })

        const task = await prisma.task.findUnique({ where: { id } })
        if (!task) return NextResponse.json({ error: "Zadatak nije pronađen" }, { status: 404 })

        const newLog = await prisma.taskLog.create({
            data: {
                content,
                status,
                taskId: task.id,
                userId: session.user.id
            },
            include: { user: true }
        })

        // Notify users
        const notifyUsers = await prisma.user.findMany({
            where: {
                id: { not: session.user.id },
                notificationPrefs: {
                    some: {
                        targetUserId: session.user.id,
                        notifyOnUpdate: true
                    }
                }
            }
        })

        for (const user of notifyUsers) {
            await sendEmailNotification(
                user.email,
                `Novi 'Radni nalazi' unos: ${task.title}`,
                `<p>Korisnik <strong>${session.user.name || session.user.email}</strong> je dodao novi status/nalaz.</p>
           <p><strong>Status:</strong> ${status || 'Nije postavljeno'}</p>
           <p><strong>Sadržaj:</strong></p>
           <blockquote>${content}</blockquote>`
            )
        }

        return NextResponse.json(newLog, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Greška pri dodavanju nalaza" }, { status: 500 })
    }
}
