import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmailNotification } from "@/lib/nodemailer"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await req.json()
        const task = await prisma.task.update({
            where: { id },
            data: {
                ...body,
                deadline: body.deadline ? new Date(body.deadline) : undefined,
            }
        })

        // Fetch users who want to be notified
        const notifyField = body.status === 'ZATVOREN' ? 'notifyOnTaskClose' : 'notifyOnTaskUpdate'
        const notifyUsers = await prisma.user.findMany({
            where: {
                [notifyField]: true,
                id: { not: session.user.id }
            }
        })

        for (const user of notifyUsers) {
            await sendEmailNotification(
                user.email,
                `Zadatak ${body.status === 'ZATVOREN' ? 'zatvoren' : 'ažuriran'}: ${task.title}`,
                `<p>Korisnik <strong>${session.user.name || session.user.email}</strong> je ${body.status === 'ZATVOREN' ? 'zatvorio' : 'ažurirao'} zadatak: ${task.title}.</p>`
            )
        }

        return NextResponse.json(task)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const task = await prisma.task.findUnique({ where: { id } })
        if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 })

        const deletedTask = await prisma.task.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                removedBy: session.user.name || session.user.email,
            }
        })

        // Notify users
        const notifyUsers = await prisma.user.findMany({
            where: {
                notifyOnTaskUpdate: true,
                id: { not: session.user.id }
            }
        })

        for (const user of notifyUsers) {
            await sendEmailNotification(
                user.email,
                `Zadatak uklonjen: ${task.title}`,
                `<p>Korisnik <strong>${session.user.name || session.user.email}</strong> je označio zadatak "${task.title}" kao uklonjen.</p>`
            )
        }

        return NextResponse.json({ success: true, task: deletedTask })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
    }
}
