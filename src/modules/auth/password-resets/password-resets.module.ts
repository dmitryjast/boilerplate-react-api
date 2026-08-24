import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordReset } from './password-reset.entity';
import { PasswordResetsService } from './password-resets.service';

@Module({
  imports: [TypeOrmModule.forFeature([PasswordReset])],
  providers: [PasswordResetsService],
  exports: [PasswordResetsService],
})
export class PasswordResetsModule {}