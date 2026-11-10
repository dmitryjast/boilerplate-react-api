import { Module } from '@nestjs/common'; // Decorator that marked class as nest module
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, minutes } from '@nestjs/throttler'; // Rate limiting
import { AppController } from './app.controller'; // Responsible for requests
import { AppService } from './app.service'; // Responsible for logic

// Type ORM (object relational-mapping)
import { ConfigModule, ConfigService } from '@nestjs/config'; // Access and reading *.env
import { TypeOrmModule } from '@nestjs/typeorm'; // Module for connecting type ORM
import { UsersModule } from './modules/users/users.module'; // Connecting users module
import { SettingsModule } from './modules/settings/settings.module';
import { AuthModule } from './modules/auth/auth.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { MailModule } from './modules/mail/mail.module';
import { PasswordResetsModule } from './modules/auth/password-resets/password-resets.module';
import { ContactModule } from './modules/contact/contact.module';

@Module({
  // Other modules that need for this module
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Default rate limit for every route, per IP. Stricter limits are set on routes with @Throttle()
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: minutes(1), limit: 100 }],
      errorMessage: 'Too many requests. Please try again later.',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        database: configService.get('DB_NAME'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'prod',
      }),
      inject: [ConfigService]
    }),
    UsersModule,
    SettingsModule,
    AuthModule,
    SessionsModule,
    MailModule,
    PasswordResetsModule,
    ContactModule
  ],
  // Controllers that process requests
  controllers: [AppController],
  // Services with business logic
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // Apply rate limiting to all routes
  ],
})
export class AppModule {}
