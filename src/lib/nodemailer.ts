import nodemailer from "nodemailer"

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("Upozorenje: SMTP varijable nisu konfigurirane u .env datoteci!")
}

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export const sendEmailNotification = async (to: string, subject: string, htmlContent: string) => {
    try {
        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM || 'ai@mbdesign.hr'}" <${process.env.EMAIL_FROM || 'ai@mbdesign.hr'}>`,
            replyTo: process.env.EMAIL_REPLY_TO || 'marko@mbdesign.hr',
            to,
            subject,
            html: htmlContent,
        })
        console.log("Poruka uspješno poslana: %s", info.messageId)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error("Greška pri slanju emaila:", error)
        return { success: false, error }
    }
}
