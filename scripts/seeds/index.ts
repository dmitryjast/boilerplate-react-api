import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { seedAdmin } from './admin.seed';
import { seedSettings } from './settings.seed';

async function runSeeds() {
    console.log('\nRunning seeds...\n')

    const app = await NestFactory.createApplicationContext(AppModule)

    // Seeds
    await seedAdmin(app)
    await seedSettings(app)
    //await seedProductCategories(app)

    console.log('\n✅ All seeds completed!\n')
    await app.close()

}

runSeeds()