import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordReset } from './password-reset.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class PasswordResetsService {

    constructor(
        @InjectRepository(PasswordReset)
        private passwordResetsRepository: Repository<PasswordReset>
    ) {}

    async create(userId: number): Promise<string> {
        // Generate random token
        const token = crypto.randomBytes(32).toString('hex')

        // Hash token before saving
        const hashedToken = await bcrypt.hash(token, 10)

        // Delete old tokens for this user
        await this.passwordResetsRepository.delete({ userId })

        // Save new token
        await this.passwordResetsRepository.save({
            userId,
            token: hashedToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        })

        // Return original token (will be sent in email)
        return token
    }

    async findByUserId(userId: number): Promise<PasswordReset | null> {
        return await this.passwordResetsRepository.findOne({ where: { userId } })
    }

    async deleteByUserId(userId: number): Promise<void> {
        await this.passwordResetsRepository.delete({ userId })
    }

}