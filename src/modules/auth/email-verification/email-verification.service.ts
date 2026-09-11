import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailVerification } from './email-verification.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class EmailVerificationService {

    constructor(
        @InjectRepository(EmailVerification)
        private emailVerificationRepository: Repository<EmailVerification>
    ) {}

    async createToken(userId: number): Promise<string> {
        // Generate random token
        const token = crypto.randomBytes(32).toString('hex')

        // Hash token before saving
        const hashedToken = await bcrypt.hash(token, 10)

        // Delete old tokens for this user
        await this.emailVerificationRepository.delete({ userId })

        // Save new token
        await this.emailVerificationRepository.save({
            userId,
            token: hashedToken,
            tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        })

        // Return original token (will be sent in email)
        return token
    }

    async createCode(userId: number): Promise<string> {
        // Generate random token
        const code = crypto.randomBytes(3).toString('hex').toUpperCase()

        // Hash token before saving
        const hashedCode = await bcrypt.hash(code, 10)

        // Delete old tokens for this user
        await this.emailVerificationRepository.delete({ userId })

        // Save new token
        await this.emailVerificationRepository.save({
            userId,
            code: hashedCode,
            codeExpiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        })

        // Return original token (will be sent in email)
        return code
    }

    async findByUserId(userId: number): Promise<EmailVerification | null> {
        return await this.emailVerificationRepository.findOne({ where: { userId } })
    }

    async deleteByUserId(userId: number): Promise<void> {
        await this.emailVerificationRepository.delete({ userId })
    }

}
