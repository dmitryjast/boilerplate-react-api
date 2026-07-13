const fs = require('fs')
const readline = require('readline')
const crypto = require('crypto')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function setup() {
  console.log('\n🚀 Boilerplate API Setup\n')

  const generatedSecret = crypto.randomBytes(64).toString('hex')

  const config = {
    PORT: await question('Server port (default: 3000): ') || '3000',
    DB_HOST: await question('Database host (default: localhost): ') || 'localhost',
    DB_PORT: await question('Database port (default: 5432): ') || '5432',
    DB_NAME: await question('Database name: '),
    DB_USERNAME: await question('Database username (default: postgres): ') || 'postgres',
    DB_PASSWORD: await question('Database password: '),
    JWT_SECRET: await question('JWT secret (press Enter to use generated): ') || generatedSecret,
    JWT_EXPIRES_IN: await question('JWT expires in (default: 7d): ') || '7d',
    FRONTEND_URL: await question('Frontend URL (default: http://localhost:5173): ') || 'http://localhost:5173',
  }

  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n\n')

  fs.writeFileSync('.env', envContent)

  console.log(`\n🔑 Generated JWT secret: ${generatedSecret}\n`)
  console.log('\n✅ .env file created successfully!\n')
  rl.close()
}

setup()