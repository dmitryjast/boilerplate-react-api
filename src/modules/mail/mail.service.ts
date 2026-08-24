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

}