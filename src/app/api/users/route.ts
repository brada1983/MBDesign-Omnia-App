import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { sendEmailNotification } from "@/lib/nodemailer"

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(users)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { name, email, password, role, sendEmail } = body

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'USER'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            }
        })

        // Slanje korisniku mail s pristupnim podacima ako je zatraženo
        if (sendEmail) {
            await sendEmailNotification(
                email,
                `Dobrodošli - Vaši pristupni podaci`,
                `<p>Poštovani ${name || ''},</p>
                 <p>Vaš korisnički račun je kreiran. Ovdje su vaši podaci za prijavu:</p>
                 <ul>
                    <li><strong>E-mail:</strong> ${email}</li>
                    <li><strong>Lozinka:</strong> ${password}</li>
                 </ul>
                 <p>Molimo prijavite se na sustav klikom na: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}">Prijavi se</a></p>`
            )
        }

        return NextResponse.json(newUser, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }
}
