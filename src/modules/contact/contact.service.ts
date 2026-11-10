import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { ContactMessage } from './contact-message.entity';
import { ContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {

    // Team address for contact form messages. The app does not start without it
    private readonly contactEmail: string

    constructor(
        @InjectRepository(ContactMessage)
        private contactMessagesRepository: Repository<ContactMessage>,
        private mailService: MailService,
        configService: ConfigService
    ) {
        this.contactEmail = configService.getOrThrow<string>('CONTACT_EMAIL')
    }

    async send(dto: ContactDto) {
        // Save first, so the message is not lost if SMTP fails
        const contactMessage = await this.contactMessagesRepository.save(
            this.contactMessagesRepository.create(dto)
        )

        // Send email without waiting (fire and forget)
        this.sendEmail(contactMessage).catch(err =>
            console.error(`Failed to send contact message #${contactMessage.id}:`, err)
        )

        return { message: 'Message sent.' }
    }

    private async sendEmail({ id, name, email, subject, message }: ContactMessage) {
        await this.mailService.sendContactMessage(this.contactEmail, name, email, subject, message)
        await this.contactMessagesRepository.update(id, { sentAt: new Date() })
    }

}
