import { BaseDTO } from '../../base/Base.dto';
import { CustomColorPaletteResource } from './custom-color-palette.resource';

export class CustomColorPaletteDTO extends BaseDTO {
    public id: string;
    public platform_configuration_id: string;
    public base_color_100: string = '#DCFFF1';
    public base_color_200: string = '#AEFFDC';
    public base_color_300: string = '#7BFFC3';
    public base_color_400: string = '#68D8A8';
    public base_color_500: string = '#ec1c24';
    public base_color_600: string = '#00A566';
    public base_color_700: string = '#00865C';
    public base_color_800: string = '#00573C';
    public base_color_900: string = '#002B1B';
    public header_nav_color: string = '#18424B';
    public gray_300: string = '#EEEEf0';
    public gray_400: string = '#E0E0E0';
    public gray_500: string = '#9E9E9E';
    public gray_600: string = '#757575';
    public gray_700: string = '#212129';

    public static createFromResource(colorPalette: CustomColorPaletteResource): CustomColorPaletteDTO {
        const dto = new CustomColorPaletteDTO();

        dto.platform_configuration_id = colorPalette.getAttribute('platform_configuration_id');
        dto.base_color_100 = colorPalette.getAttribute('base_color_100') ?? '#DCFFF1';
        dto.base_color_200 = colorPalette.getAttribute('base_color_200') ?? '#AEFFDC';
        dto.base_color_300 = colorPalette.getAttribute('base_color_300') ?? '#7BFFC3';
        dto.base_color_400 = colorPalette.getAttribute('base_color_400') ?? '#68D8A8';
        dto.base_color_500 = colorPalette.getAttribute('base_color_500') ?? '#ec1c24';
        dto.base_color_600 = colorPalette.getAttribute('base_color_600') ?? '#00A566';
        dto.base_color_700 = colorPalette.getAttribute('base_color_700') ?? '#00865C';
        dto.base_color_800 = colorPalette.getAttribute('base_color_800') ?? '#00573C';
        dto.base_color_900 = colorPalette.getAttribute('base_color_900') ?? '#002B1B';
        dto.header_nav_color = colorPalette.getAttribute('header_nav_color' ?? '#18424B');
        dto.gray_300 = colorPalette.getAttribute('gray_300') ?? '#EEEEf0';
        dto.gray_400 = colorPalette.getAttribute('gray_400') ?? '#E0E0E0';
        dto.gray_500 = colorPalette.getAttribute('gray_500') ?? '#9E9E9E';
        dto.gray_600 = colorPalette.getAttribute('gray_600') ?? '#757575';
        dto.gray_700 = colorPalette.getAttribute('gray_700') ?? '#212129';

        return dto;
    }
}
