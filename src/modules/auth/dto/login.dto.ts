import { IsEmail, IsString } from 'class-validator'
import { Trim } from './trim.transform'

export class LoginDto {
    @Trim()
    @IsEmail()
    email!: string

    @IsString()
    password!: string
}
