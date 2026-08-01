import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity';

interface CreateSessionDto {
    userId: number,
    refreshToken: string,
    device?: string,
    expiresAt: Date,
}

@Injectable()
export class SessionsService {

    constructor(
        @InjectRepository(Session)
        private sessionsRepository: Repository<Session>
    ) {}

    async findAll(): Promise<Session[]> {
        return await this.sessionsRepository.find()
    }

    async create(dto: CreateSessionDto): Promise<Session> {
        const session = this.sessionsRepository.create(dto)
        return await this.sessionsRepository.save(session)
    }

}
