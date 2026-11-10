import { IsEmail, IsString, Length } from 'class-validator'
import { Trim } from '../../../common/transforms/trim.transform'

// Limits match the contact form schema on the frontend
export class ContactDto {
    @Trim()
    @IsString()
    @Length(2, 100)
    name!: string

    @Trim()
    @IsEmail()
    email!: string

    @Trim()
    @IsString()
    @Length(3, 150)
    subject!: string

    @Trim()
    @IsString()
    @Length(10, 2000)
    message!: string
}
