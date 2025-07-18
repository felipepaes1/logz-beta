import { HttpClientResponse } from "coloquent";
import { BaseResource } from "../../base/BaseResource";
import { processSingularResponse } from "../../helpers/coloquent-response-helper";
import { CustomColorPaletteResource } from "../custom-color-palette/custom-color-palette.resource";
import { PlatformConfigurationDTO } from "./platform-configuration.dto";

export class
PlatformConfigurationResource extends BaseResource {
    public static tableName: string = 'platform_configurations';
    public static jsonApiType: string = 'tenancies/:tenancy_id/system/platform-configurations';

    public static async createOrUpdate(platformConfigurationDTO: PlatformConfigurationDTO): Promise<HttpClientResponse> {
        return this.action('create-or-update', { data: platformConfigurationDTO });
    }

    public static async load(): Promise<PlatformConfigurationResource> {
        return this.action('load')
            .then((response: HttpClientResponse) => this.processResponse(response));
    }

    public static async loadByDomainOrSubdomain(
        domain?: string,
        subdomain?: string
    ): Promise<PlatformConfigurationResource> {
        return this.action('load-by-domain-or-subdomain', { domain, subdomain }, null, 'system/platform-configurations')
            .then((response: HttpClientResponse) => this.processResponse(response));
    }

    public static async destroy(): Promise<HttpClientResponse> {
        return this.action('destroy');
    }

    private static processResponse(response: HttpClientResponse): PlatformConfigurationResource {
        return <PlatformConfigurationResource>processSingularResponse(
            {
                data: [response.getData().data],
                included: response.getData().included,
                coloquentResource: PlatformConfigurationResource,
                jsonApiType: 'platform_configurations',
                response: response
            }
        );
    }

    public colorPalette() {
        return this.hasOne(CustomColorPaletteResource, 'colorPalette');
    }
}
