import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmailNotification } from "@/lib/nodemailer"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const task = await prisma.task.findUnique({
        where: { id },
        include: {
            logs: {
                include: { user: { select: { name: true, email: true } } },
                orderBy: { createdAt: 'asc' }
            },
            timeEntries: {
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: 'asc' }
            },
        }
    })

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 })
    if (task.status !== 'ZATVOREN') {
        return NextResponse.json({ error: "Radni nalog mora biti zatvoren prije slanja." }, { status: 400 })
    }

    const totalHours = task.timeEntries.reduce((acc, e) => acc + (e.manualHours || 0), 0)

    // Build the HTML email
    const logsHtml = task.logs.length > 0
        ? task.logs.map(log => `
            <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; white-space: nowrap;">
                    ${new Date(log.createdAt).toLocaleDateString('hr-HR')}
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">
                    <strong>${log.user.name || log.user.email}</strong>
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">
                    <span style="display: inline-block; padding: 2px 8px; background: #eff6ff; color: #3b82f6; border-radius: 4px; font-size: 12px;">${log.status || '-'}</span>
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px; white-space: pre-wrap;">${log.content}</td>
            </tr>`).join('')
        : `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #94a3b8; font-size: 13px;">Nema evidentiranih radova.</td></tr>`

    const bodyHtml = `
    <!DOCTYPE html>
    <html lang="hr">
    <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 700px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 36px 40px; text-align: center;">
                <p style="margin: 0 0 6px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">MB DESIGN d.o.o.</p>
                <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Radni Nalog</h1>
                <p style="margin: 10px 0 0; color: #64748b; font-size: 13px;">Izvješće o završenom zadatku</p>
            </div>

            <!-- Task Header Info -->
            <div style="padding: 32px 40px 0;">
                <h2 style="margin: 0 0 24px; color: #0f172a; font-size: 20px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px;">
                    ${task.title}
                </h2>

                <div style="display: flex; flex-wrap: wrap; gap: 0; margin-bottom: 24px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600; width: 33%;">Kategorija</td>
                            <td style="padding: 10px 12px; background: #ffffff; border: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${task.category}</td>
                            <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600; width: 33%;">Status</td>
                            <td style="padding: 10px 12px; background: #f0fdf4; border: 1px solid #e2e8f0; font-size: 13px; color: #16a34a; font-weight: 700;">✓ ZATVOREN</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600;">Otvoreno</td>
                            <td style="padding: 10px 12px; background: #ffffff; border: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${new Date(task.createdAt).toLocaleDateString('hr-HR')}</td>
                            <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600;">Zatvoreno</td>
                            <td style="padding: 10px 12px; background: #ffffff; border: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${new Date(task.updatedAt).toLocaleDateString('hr-HR')}</td>
                        </tr>
                        ${task.deadline ? `<tr>
                            <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600;">Rok</td>
                            <td style="padding: 10px 12px; background: #ffffff; border: 1px solid #e2e8f0; font-size: 13px; color: #334155;" colspan="3">${new Date(task.deadline).toLocaleDateString('hr-HR')}</td>
                        </tr>` : ''}
                        ${task.description ? `<tr>
                            <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600; vertical-align: top;">Opis</td>
                            <td style="padding: 10px 12px; background: #ffffff; border: 1px solid #e2e8f0; font-size: 13px; color: #334155; white-space: pre-wrap;" colspan="3">${task.description}</td>
                        </tr>` : ''}
                    </table>
                </div>

                <!-- Hours Summary -->
                <div style="background: linear-gradient(135deg, #1e293b, #334155); border-radius: 10px; padding: 20px 24px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Ukupno utrošeno vremena</p>
                        <p style="margin: 8px 0 0; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: -1px;">${totalHours.toFixed(2)} <span style="font-size: 20px; font-weight: 400; color: #94a3b8;">sati</span></p>
                    </div>
                    ${task.assignedHours ? `<div style="text-align: right;">
                        <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Predviđeno</p>
                        <p style="margin: 8px 0 0; color: #7dd3fc; font-size: 28px; font-weight: 700;">${task.assignedHours} <span style="font-size: 16px; font-weight: 400;">sati</span></p>
                    </div>` : ''}
                </div>

                <!-- Work Log Table -->
                <h3 style="margin: 0 0 14px; color: #0f172a; font-size: 16px; font-weight: 700;">Dnevnik rada (Radni nalazi)</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 13px;">
                    <thead>
                        <tr style="background: #1e293b;">
                            <th style="padding: 10px 12px; text-align: left; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Datum</th>
                            <th style="padding: 10px 12px; text-align: left; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Korisnik</th>
                            <th style="padding: 10px 12px; text-align: left; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
                            <th style="padding: 10px 12px; text-align: left; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Bilješka</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 12px;">Ovo izvješće automatski je generirala MB Design aplikacija za upravljanje zadacima.</p>
                <p style="margin: 6px 0 0; color: #94a3b8; font-size: 11px;">MB Design d.o.o. | ai@mbdesign.hr</p>
            </div>
        </div>
    </body>
    </html>`

    try {
        const recipientEmail = process.env.CLIENT_EMAIL || 'info@omnia.hr'
        await sendEmailNotification(
            recipientEmail,
            `Radni nalog završen: ${task.title}`,
            bodyHtml
        )
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Failed to send report email:", err)
        return NextResponse.json({ error: "Slanje e-maila nije uspjelo." }, { status: 500 })
    }
}
