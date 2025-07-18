import { HttpClientResponse } from "coloquent";
import { BaseResource } from "../../base/BaseResource";

export class StorageResource extends BaseResource {
    public static jsonApiType: string = 'tenants/:tenant_id/storages';

    protected static table = 'storages';

    public static async openStorage(storageId?: string): Promise<HttpClientResponse> {
        return this.action('open-storage', {id: storageId});
    }
}
