import { Module } from '@nestjs/common'; // Decorator that marked class as nest module
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

@Module({
  // Other modules that need for this module
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    PasswordResetsModule
  ],
  // Controllers that process requests
  controllers: [AppController],
  // Services with business logic
  providers: [AppService],
})
export class AppModule {}
