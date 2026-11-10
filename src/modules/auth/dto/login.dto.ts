import { IsEmail, IsString } from 'class-validator'
import { Trim } from '../../../common/transforms/trim.transform'

export class LoginDto {
    @Trim()
    @IsEmail()
    email!: string

    @IsString()
    password!: string
}
