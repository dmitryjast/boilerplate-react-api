import { NestFactory } from '@nestjs/core'; // Main framework class
import { AppModule } from './app.module'; // Combine all app modules
import { ConfigService } from '@nestjs/config'; // Service for reading *.env

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);
}
bootstrap();
