import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { Throttle, minutes } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact.dto';

@Controller('contact')
export class ContactController {

    constructor(private contactService: ContactService) {}

    @Post()
    @Throttle({ default: { limit: 5, ttl: minutes(10) } })
    @HttpCode(200)
    async send(@Body() dto: ContactDto) {
        return this.contactService.send(dto)
    }

}
