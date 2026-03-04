import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { sendEmailNotification } from "@/lib/nodemailer"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: "Datoteka nije pronađena" }, { status: 400 })
        }

        const task = await prisma.task.findUnique({ where: { id } })
        if (!task) return NextResponse.json({ error: "Zadatak nije pronađen" }, { status: 404 })

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uniqueSuffix = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`
        const uploadDir = path.join(process.cwd(), 'public/uploads')
        const filePath = path.join(uploadDir, uniqueSuffix)

        await writeFile(filePath, buffer)

        const attachment = await prisma.attachment.create({
            data: {
                taskId: task.id,
                userId: session.user.id,
                fileName: file.name,
                fileUrl: `/uploads/${uniqueSuffix}`
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
                `Nova datoteka preuzeta: ${task.title}`,
                `<p>Korisnik <strong>${session.user.name || session.user.email}</strong> je učitao datoteku: <strong>${file.name}</strong>.</p>`
            )
        }

        return NextResponse.json(attachment, { status: 201 })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "Greška pri prijenosu datoteke" }, { status: 500 })
    }
}
