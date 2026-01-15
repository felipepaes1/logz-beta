import { BaseDTO } from "../../base/Base.dto";
import { ProductionOrderResource } from "./production-orders.resource";

export class ProductionOrderDto extends BaseDTO {
    public description: string;
    public code: string;
    public active: number;

    public productionOrderResource: ProductionOrderResource;

    public createFromColoquentResource(resource: ProductionOrderResource): ProductionOrderDto {

        if (!resource || typeof resource.getApiId !== "function") {
            return this
        }
        
        this.productionOrderResource = resource;

        this.id = resource?.getApiId();
        this.description = resource?.getAttribute('description');
        this.code = resource?.getAttribute('code');
        const rawActive = resource?.getAttribute('active');
        this.active = Number(rawActive) === 1 ? 1 : 0;

        return this;
    }

    public bindToSave(): ProductionOrderDto {
        return this;
    }
}
