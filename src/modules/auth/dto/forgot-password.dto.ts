import { IsEmail } from 'class-validator'
import { Trim } from '../../../common/transforms/trim.transform'

export class ForgotPasswordDto {
    @Trim()
    @IsEmail()
    email!: string
}
