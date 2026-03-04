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
            where: { id: session.user.id },
            include: {
                notificationPrefs: {
                    include: {
                        targetUser: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
        })

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        return NextResponse.json({
            email: user.email,
            notificationPrefs: user.notificationPrefs
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
        const { email, password, notificationPrefs } = body // notificationPrefs is an array of { targetUserId, notifyOnCreate, notifyOnUpdate, notifyOnClose }

        const updateData: any = {}

        if (email) {
            updateData.email = email
        }

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10)
        }

        // Uredi password i email
        if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: updateData
            })
        }

        // Uredi notificationPrefs ukoliko su primljeni
        if (Array.isArray(notificationPrefs)) {
            // First, delete potentially removed preferences or reset them
            await prisma.notificationPreference.deleteMany({
                where: { subscriberId: session.user.id }
            });

            // Re-insert the new preferences
            if (notificationPrefs.length > 0) {
                const newPrefs = notificationPrefs.map((pref: any) => ({
                    subscriberId: session.user.id,
                    targetUserId: pref.targetUserId,
                    notifyOnCreate: pref.notifyOnCreate,
                    notifyOnUpdate: pref.notifyOnUpdate,
                    notifyOnClose: pref.notifyOnClose
                }));

                await prisma.notificationPreference.createMany({
                    data: newPrefs
                });
            }
        }


        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to update settings:", error)
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
}
