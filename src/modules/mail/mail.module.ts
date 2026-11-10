import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST'),
          port: configService.get<number>('SMTP_PORT'),
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASSWORD'),
          },
          // Fail fast when SMTP is unreachable instead of hanging for minutes.
          // connectionTimeout applies to each IP of SMTP_HOST in turn (Mailtrap has 6), so keep it short
          connectionTimeout: 3_000,
          greetingTimeout: 10_000,
          socketTimeout: 30_000,
        },
        defaults: {
          from: configService.get('SMTP_FROM'),
        },
        template: {
          dir: join(process.cwd(), 'src/modules/mail/templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}