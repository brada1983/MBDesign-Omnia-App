import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        return NextResponse.json({
            email: user.email,
            notifyOnTaskCreate: user.notifyOnTaskCreate,
            notifyOnTaskUpdate: user.notifyOnTaskUpdate,
            notifyOnTaskClose: user.notifyOnTaskClose,
        })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await req.json()
        const { email, password, notifyOnTaskCreate, notifyOnTaskUpdate, notifyOnTaskClose } = body

        const updateData: any = {
            notifyOnTaskCreate: Boolean(notifyOnTaskCreate),
            notifyOnTaskUpdate: Boolean(notifyOnTaskUpdate),
            notifyOnTaskClose: Boolean(notifyOnTaskClose),
        }

        if (email) {
            updateData.email = email
        }

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10)
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
}
