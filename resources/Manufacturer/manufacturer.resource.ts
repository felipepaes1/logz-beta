import { BaseResource } from "../../base/BaseResource";
import { ManufacturerDto } from "./manufacturer.dto";

export class ManufacturerResource extends BaseResource {
    public static jsonApiType = 'tenants/:tenant_id/manufacturers';

    protected static table = 'manufacturers';

    public static async createOrUpdate(manufacturerDto: ManufacturerDto): Promise<any> {
        return this.action('create-or-update', {manufacturer_dto: manufacturerDto});
    }
}
