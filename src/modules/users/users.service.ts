import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm'; // Class for methods for interrraction with DB find, save, delete
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

// Data Transfer Object

interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    userRole?: UserRole;
}

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    async create(dto: CreateUserDto): Promise<User> {
        const hashedPassword = await bcrypt.hash(dto.password, 10)
        const user = this.usersRepository.create({
            ...dto,
            password: hashedPassword,
        })
        return await this.usersRepository.save(user)
    }

    async findAll(): Promise<User []> {
        return await this.usersRepository.find()
    }

    async findOne(id: number): Promise<User | null> {
        return await this.usersRepository.findOne({where: { id }})
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.usersRepository.findOne({ where: {email} })
    }

    async findByRole(role: UserRole): Promise<User | null> {
        return await this.usersRepository.findOne({ where: {userRole: role} })
    }

    async updatePassword(userId: number, newPassword: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await this.usersRepository.update(userId, { password: hashedPassword })
    }

    async verify(userId: number): Promise<void> {
        await this.usersRepository.update(userId, { verifiedAt: new Date() })
    }

}