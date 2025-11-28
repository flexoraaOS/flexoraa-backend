const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');

class EmailService {
    constructor() {
        if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD
                }
            });
        } else {
            logger.warn('Email credentials missing. Email features will be disabled.');
        }
    }

    /**
     * Send an email
     */
    async sendEmail(to, subject, html) {
        if (!this.transporter) {
            logger.warn('Email service not configured. Skipping email to ' + to);
            return false;
        }

        try {
            const info = await this.transporter.sendMail({
                from: process.env.GMAIL_USER,
                to,
                subject,
                html
            });
            logger.info({ messageId: info.messageId }, 'Email sent');
            return true;
        } catch (error) {
            logger.error({ err: error }, 'Failed to send email');
            throw error;
        }
    }

    /**
     * Send invitation email
     */
    async sendInvitation(email, inviteLink) {
        const subject = 'Invitation to join Flexoraa Intelligence OS';
        const html = `
            <h1>Welcome to Flexoraa</h1>
            <p>You have been invited to join the team.</p>
            <p>Click the link below to accept:</p>
            <a href="${inviteLink}">${inviteLink}</a>
        `;
        return this.sendEmail(email, subject, html);
    }
}

module.exports = new EmailService();
