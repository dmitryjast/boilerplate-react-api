import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactMessage } from './contact-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContactMessage]), MailModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
