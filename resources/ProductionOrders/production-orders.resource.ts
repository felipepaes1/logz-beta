import { HttpClientResponse } from "coloquent";
import { BaseResource } from "../../base/BaseResource";
import { ProductionOrderDto } from "./production-orders.dto";

export class ProductionOrderResource extends BaseResource {
    public static jsonApiType: string = 'tenants/:tenant_id/production-orders';

    protected static table = 'production_orders';

    public static async inviteOrUpdate(productionOrderDto: ProductionOrderDto): Promise<ProductionOrderResource> {
        return this.action('invite-or-update', {pcp_dto: productionOrderDto});
    }

    public static async reSendInvite(productionOrderId: string): Promise<HttpClientResponse> {
        return this.action('resend-invite', {production_order_id: productionOrderId});
    }

    public static async destroy(id: number | string, tenantId?: number | string): Promise<void> {
        if (!id && id !== 0) return
        const idNum = Number(id)
        if (!Number.isFinite(idNum) || idNum <= 0) return
        const base = this.buildBase(tenantId)
        const uri = `${base}/${idNum}`
        await this.getHttpClient().delete(uri)
    }

    private static buildBase(tenantId?: number | string): string {
        if (tenantId !== undefined && tenantId !== null) {
            return (this.jsonApiType as string).replace(":tenant_id", String(tenantId))
        }
        return (new (this as any)() as BaseResource).getJsonApiType()
    }
}
