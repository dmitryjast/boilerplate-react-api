import { IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class ResetPasswordDto {
    @IsInt()
    userId!: number

    @IsString()
    @IsNotEmpty()
    token!: string

    @IsString()
    @MinLength(8)
    newPassword!: string
}
