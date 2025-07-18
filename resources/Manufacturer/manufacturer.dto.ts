import { BaseDTO } from "../../base/Base.dto";
import { ManufacturerResource } from "./manufacturer.resource";

export class ManufacturerDto extends BaseDTO {
    public id?: string;
    public name: string;
    public description: string;
    public code: string;
    public manufacturerResource: ManufacturerResource;

    public createFromColoquentResource(resource: ManufacturerResource): ManufacturerDto {
        this.id = resource.getApiId();
        this.description = resource.getAttribute('description');

        return this;
    }

    public createFromParentColoquentResource(resource: ManufacturerResource): ManufacturerDto {
        this.createFromColoquentResource(resource);

        return this;
    }

    public bindToSave(): ManufacturerDto {
        return this;
    }
}
