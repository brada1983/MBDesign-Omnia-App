import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmailNotification } from "@/lib/nodemailer"

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isAdmin = session.user.role === 'ADMIN'

    try {
        const tasks = await prisma.task.findMany({
            where: isAdmin ? {} : { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                logs: true,
                timeEntries: true,
            }
        })
        return NextResponse.json(tasks)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await req.json()
        const { title, description, category, deadline, assignedHours } = body

        if (!title || !category) {
            return NextResponse.json({ error: "Title and category are required" }, { status: 400 })
        }

        const newTask = await prisma.task.create({
            data: {
                title,
                description,
                category,
                deadline: deadline ? new Date(deadline) : null,
                assignedHours: assignedHours ? parseFloat(assignedHours) : null,
            }
        })

        // Fetch users who want to be notified when THIS specific user creates a task
        const notifyUsers = await prisma.user.findMany({
            where: {
                id: { not: session.user.id }, // Don't notify the person who created it
                notificationPrefs: {
                    some: {
                        targetUserId: session.user.id,
                        notifyOnCreate: true
                    }
                }
            }
        })

        for (const user of notifyUsers) {
            await sendEmailNotification(
                user.email,
                `Novi zadatak kreiran: ${title}`,
                `<p>Korisnik <strong>${session.user.name || session.user.email}</strong> je dodao novi zadatak.</p>
           <p><strong>Naslov:</strong> ${title}</p>
           <p><strong>Kategorija:</strong> ${category}</p>
           <p><strong>Opis:</strong> ${description || 'Nema opisa'}</p>`
            )
        }

        return NextResponse.json(newTask, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
    }
}
