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
        const { manualHours, startTime, endTime } = await req.json()

        if (manualHours === undefined && (!startTime || !endTime)) {
            return NextResponse.json({ error: "Unesite sate ili početno/završno vrijeme" }, { status: 400 })
        }

        const task = await prisma.task.findUnique({ where: { id } })
        if (!task) return NextResponse.json({ error: "Zadatak nije pronađen" }, { status: 404 })

        let hoursLogged = manualHours || 0
        if (!manualHours && startTime && endTime) {
            const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime()
            hoursLogged = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2))
        }

        const timeEntry = await prisma.timeEntry.create({
            data: {
                taskId: task.id,
                userId: session.user.id,
                manualHours: hoursLogged,
                startTime: startTime ? new Date(startTime) : null,
                endTime: endTime ? new Date(endTime) : null,
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
                `Upisano vrijeme: ${task.title}`,
                `<p>Korisnik <strong>${session.user.name || session.user.email}</strong> je zabilježio vrijeme na zadatku "${task.title}".</p>
           <p><strong>Utrošeno vrijeme:</strong> ${hoursLogged} sati</p>`
            )
        }

        return NextResponse.json(timeEntry, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Greška pri dodavanju vremena" }, { status: 500 })
    }
}
