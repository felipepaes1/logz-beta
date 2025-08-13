import { BaseDTO } from "../../base/Base.dto";
import { PcpResource } from "./pcp.resource";

export class PcpDto extends BaseDTO {
    public description: string;
    public code: string;
    public active: boolean;

    public pcpResource: PcpResource;

    public createFromColoquentResource(resource: PcpResource): PcpDto {

        if (!resource || typeof resource.getApiId !== "function") {
            return this
        }
        
        this.pcpResource = resource;

        this.id = resource?.getApiId();
        this.description = resource?.getAttribute('description');
        this.code = resource?.getAttribute('code');
        this.active = !!resource?.getAttribute('active');

        return this;
    }

    public bindToSave(): PcpDto {
        return this;
    }
}
