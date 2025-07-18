import { CustomColorPaletteDTO } from '../custom-color-palette/custom-color-palette.dto';
import { CustomColorPaletteResource } from '../custom-color-palette/custom-color-palette.resource';
import { PlatformConfigurationResource } from './platform-configuration.resource';
export class PlatformConfiguration {
    public static platformConfiguration: PlatformConfigurationResource;

    public static get colorPalette(): CustomColorPaletteResource {
        return this.getRelation('colorPalette');
    }

    public static getAttribute(name: string): any {
        return this.platformConfiguration?.getAttribute(name);
    }

    public static getRelation(name: string): any {
        return this.platformConfiguration?.getRelation(name);
    }

    public static async load(domain?: string, subdomain?: string): Promise<void> {
        await this.setCustomColorPalette();
    }

    public static async setCustomColorPalette(): Promise<void> {
        localStorage.removeItem('@color_pallete');

        if (this.colorPalette) {
            const customColorPaletteDTO = CustomColorPaletteDTO.createFromResource(this.colorPalette);

            localStorage.setItem('@color_pallete', JSON.stringify(customColorPaletteDTO));

            return;
        }

        localStorage.setItem('@color_pallete', JSON.stringify(new CustomColorPaletteDTO()));
    }
}
