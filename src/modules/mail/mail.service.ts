import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {

    constructor(private mailerService: MailerService) {}

    async sendPasswordReset(email: string, name: string, resetUrl: string): Promise<void> {
        await this.mailerService.sendMail({
            to: email,
            subject: 'Password Reset Request',
            template: 'reset-password', // template name without .hbs
            context: { // variables for passing to email template
                name, 
                resetUrl,
            }
        })
    }

    async sendVerificationCode(email: string, name: string, code: string): Promise<void> {
        await this.mailerService.sendMail({
            to: email,
            subject: 'Email Verification Code',
            template: 'verification-code',
            context: {
                name,
                code,
            }
        })
    }

    async sendVerificationLink(email: string, name: string, verifyUrl: string): Promise<void> {
        await this.mailerService.sendMail({
            to: email,
            subject: 'Verify Your Email',
            template: 'verification-link',
            context: {
                name,
                verifyUrl,
            }
        })
    }

}