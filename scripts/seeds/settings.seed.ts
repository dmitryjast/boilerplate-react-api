import { SettingsService } from "../../src/modules/settings/settings.service";

export async function seedSettings(app: any) {
    
    const settingsService = app.get(SettingsService)

    await settingsService.create({
        containerWidth: 1400,
        appName: 'My App',
        maintenanceMode: false
    })

}