import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerification } from './email-verification.entity';
import { EmailVerificationService } from './email-verification.service';

@Module({
    imports: [TypeOrmModule.forFeature([EmailVerification])],
    providers: [EmailVerificationService],
    exports: [EmailVerificationService],
})
export class EmailVerificationModule {}

