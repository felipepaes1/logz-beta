import { HttpClientResponse } from "coloquent";
import { BaseResource } from "../../base/BaseResource";
import { MachineDto } from "./machine.dto";

export class MachineResource extends BaseResource {
    public static jsonApiType: string = 'tenants/:tenant_id/machines';

    protected static table = 'machines';

    public static async inviteOrUpdate(machineDto: MachineDto): Promise<MachineResource> {
        return this.action('invite-or-update', {machine_dto: machineDto});
    }

    public static async reSendInvite(machineId: string): Promise<HttpClientResponse> {
        return this.action('resend-invite', {machine_id: machineId});
    }
}
