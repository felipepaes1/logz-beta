import { ItemGroupResource } from "./item-group.resource";
import { BaseDTO } from "../../base/Base.dto";

export class ItemGroupDto extends BaseDTO {
    public id?: string;
    public name: string;
    public description: string;
    public code: string;
    public itemGroupResource: ItemGroupResource;

    public createFromColoquentResource(resource: ItemGroupResource): ItemGroupDto {
        this.id = resource?.getApiId();
        this.description = resource?.getAttribute('description');

        return this;
    }

    public createFromParentColoquentResource(resource: ItemGroupResource): ItemGroupDto {
        this.createFromColoquentResource(resource);

        return this;
    }

    public bindToSave(): ItemGroupDto {
        return this;
    }
}
