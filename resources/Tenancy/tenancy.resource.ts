import { BaseResource } from "../../base/BaseResource";
import { TenancyTypeEnum } from "./tenancy.enum";

export class TenancyResource extends BaseResource {
    public static jsonApiType = "system/tenancies";

    public parent() {
        return this.hasOne(TenancyResource, 'parent');
    }

    public isMain(): boolean {
        return this.hasType([TenancyTypeEnum.MAIN]);
    }

    public hasType(tenancyTypes: Array<TenancyTypeEnum>) {
        return tenancyTypes.includes(
            this.getRelation('tenancyType')?.getAttribute('name')
        );
    }
}
