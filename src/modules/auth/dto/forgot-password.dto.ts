import { IsEmail } from 'class-validator'
import { Trim } from './trim.transform'

export class ForgotPasswordDto {
    @Trim()
    @IsEmail()
    email!: string
}
