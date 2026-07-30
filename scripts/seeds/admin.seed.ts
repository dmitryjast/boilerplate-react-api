import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { UsersService } from '../../src/modules/users/users.service';
import { UserRole } from '../../src/modules/users/user.entity';
import * as readline from 'readline';
import * as crypto from 'crypto';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text: string) => new Promise<string>((resolve) => rl.question(text, resolve))
const yesNo = async (text: string): Promise<boolean> => {
    const answer = await question(`${text} (y/n): `)
    return answer.toLowerCase() === 'y'
}
const generatePassword = () => crypto.randomBytes(14).toString('hex')

export async function seedAdmin(app: any) {

    const usersService = app.get(UsersService)

    const existingAdmin = await usersService.findByRole(UserRole.ADMIN)

    if(existingAdmin) {
        console.log('⚠️ Admin already exists, skipping...')
        return
    }

    console.log('\n👤 Create Admin Account\n')

    const name = await question('Admin name: ')
    const email = await question('Admin email: ')

    let password: string
    const useGenerated = await yesNo('Do you want to generate a strong password?')

    if (useGenerated) {
        password = generatePassword()
        console.log(`\n🔐 Generated password: ${password}\n`)
    } else {
        password = await question('Enter admin password: ')
    }

    rl.close()

    if (!name || !email || !password) {
        console.error('❌ All fields are required')
        process.exit(1)
    }

    await usersService.create({
        name,
        email,
        password,
        userRole: UserRole.ADMIN,
    })

    console.log('\n✅ Admin account created!\n')
}
