import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Trim } from '../../../common/transforms/trim.transform';

export class RegisterDto {
    @Trim()
    @IsString()
    @IsNotEmpty()
    name!: string

    @Trim()
    @IsEmail()
    email!: string

    @IsString()
    @MinLength(8)
    password!: string
}
