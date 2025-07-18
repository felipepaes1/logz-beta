import { HttpClientResponse } from "coloquent";
import { BaseResource } from "../../base/BaseResource";
import { PcpDto } from "./pcp.dto";

export class PcpResource extends BaseResource {
    public static jsonApiType: string = 'tenants/:tenant_id/production-orders';

    protected static table = 'production_orders';

    public static async inviteOrUpdate(pcpDto: PcpDto): Promise<PcpResource> {
        return this.action('invite-or-update', {pcp_dto: pcpDto});
    }

    public static async reSendInvite(productionOrderId: string): Promise<HttpClientResponse> {
        return this.action('resend-invite', {production_order_id: productionOrderId});
    }
}
