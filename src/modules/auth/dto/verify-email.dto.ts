import { IsInt, IsNotEmpty, IsString } from 'class-validator'

export class VerifyEmailDto {
    @IsInt()
    userId!: number

    @IsString()
    @IsNotEmpty()
    tokenOrCode!: string
}
