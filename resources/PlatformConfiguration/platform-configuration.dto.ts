import { BaseDTO } from '../../base/Base.dto';
import { CustomColorPaletteDTO } from '../custom-color-palette/custom-color-palette.dto';
import { CustomColorPaletteResource } from '../custom-color-palette/custom-color-palette.resource';
import { PlatformConfigurationResource } from './platform-configuration.resource';

export class PlatformConfigurationDTO extends BaseDTO {
    public id: string;
    public subdomain: string;
    public domain: string;
    public color_palette: CustomColorPaletteDTO = new CustomColorPaletteDTO();

    public static createFromResource(platformConfiguration: PlatformConfigurationResource): PlatformConfigurationDTO {
        const dto = new PlatformConfigurationDTO();

        dto.id = platformConfiguration.getApiId();
        dto.domain = platformConfiguration.getAttribute('domain');
        dto.subdomain = platformConfiguration.getAttribute('subdomain');

        dto.color_palette = CustomColorPaletteDTO.createFromResource(
            platformConfiguration.getRelation('colorPalette') ?? new CustomColorPaletteResource()
        );

        return dto;
    }
}
