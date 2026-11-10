import { SettingsService } from "../../src/modules/settings/settings.service";

export async function seedSettings(app: any) {

    const settingsService = app.get(SettingsService)

    const existingSettings = await settingsService.findAll()

    if(existingSettings.length) {
        console.log('⚠️ Settings already exist, skipping...')
        return
    }

    await settingsService.create({
        containerWidth: 1400,
        appName: 'My App',
        maintenanceMode: false
    })

    console.log('✅ Settings created!')

}
