import { NestFactory } from '@nestjs/core'; // Main framework class
import { AppModule } from './app.module'; // Combine all app modules
import { ConfigService } from '@nestjs/config'; // Service for reading *.env
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common'; // Interceptor for process @Exclude() - hide specific, and @Expose() - show specific
import { Reflector } from '@nestjs/core'; // Read metadata of decorators

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  // Enable CORS (Cross-Origin Resource Sharing)
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [configService.get('FRONTEND_URL')] // Allow requests only from this address
      const localhostPattern = /^http:\/\/localhost:\d+$/ // Allowed requests from localhosts by pattern

      if (!origin || allowedOrigins.includes(origin) || localhostPattern.test(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS.'))
      }
    },
    credentials: true,
  })

  app.useGlobalPipes(new ValidationPipe({
    //whitelist: true,
  }))

  app.use(cookieParser()) // Enable cookie parsing for HttpOnly cookies
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector))) // Automatically exclude @Exclude() fields from responses

  await app.listen(port);
}
bootstrap();
