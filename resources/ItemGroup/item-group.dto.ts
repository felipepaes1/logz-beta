import { ItemGroupResource } from "./item-group.resource";
import { BaseDTO } from "../../base/Base.dto";

export class ItemGroupDto extends BaseDTO {
    public id?: number | null;
    public description: string;
    public itemGroupResource: ItemGroupResource;

    public createFromColoquentResource(resource: ItemGroupResource): ItemGroupDto {

        if (!resource || typeof resource.getApiId !== "function") {
            return this
        }

        const rawId = resource?.getApiId?.();
        const parsedId = rawId !== undefined && rawId !== null ? Number(rawId) : null;
        this.id = Number.isFinite(parsedId as number) ? (parsedId as number) : null;
        this.description = resource?.getAttribute('description') ?? this.description;
        this.itemGroupResource = resource;

        return this;
    }

    public createFromParentColoquentResource(resource: ItemGroupResource): ItemGroupDto {
        this.createFromColoquentResource(resource);

        return this;
    }

    public bindToSave(): ItemGroupDto {
        if (this.id !== null && this.id !== undefined && !Number.isFinite(this.id)) {
            this.id = null;
        }
        return this;
    }
}
