import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './settings.entity';

interface CreateSettingsDto {
    containerWidth?: number;
    adminEmail?: string;
    appName?: string;
    logo?: string;
    favicon?: string;
    metaDescription?: string;
    metaKeywords?: string;
    phones?: string[];
    address?: string;
    socialNetworks?: object[];
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    maintenanceMode?: boolean;
}

@Injectable()
export class SettingsService {

    constructor(
        @InjectRepository(Settings)
        private settingsRepository: Repository<Settings>
    ) {}

    async findAll(): Promise<Settings[]> {
        return await this.settingsRepository.find()
    }

    async create(dto: CreateSettingsDto): Promise<Settings> {
        const settings = this.settingsRepository.create(dto)
        return await this.settingsRepository.save(settings)
    }

}
