import { BaseResource } from "../../base/BaseResource";
import api_url from "../../services/api";

export class AttachmentResource extends BaseResource{
    protected jsonApiType = 'tenants/:tenant_id/attachments';

    public getToken(): string {
        return this.getAttribute('token');
    }

    public getOriginalFileName(): string {
        return this.getAttribute('original_file_name');
    }

    public getOriginalFileMimetype(): string {
        return this.getAttribute('original_file_mimetype');
    }

    public getPreviewUrl(): string {
        return `${api_url}/${this.jsonApiType}/${this.getToken()}/preview`;
    }

    public getDownloadUrlWithTenancy(tenancyId: string): string{
        const url = (this.jsonApiType + '').replace(':tenant_id', tenancyId);
        return `${api_url}/${url}/${this.getToken()}/download`;
    }
    

    public getThumbnailUrl(): string {
        return `${api_url}/${this.jsonApiType}/${this.getToken()}/thumbnail`;
    }

    public setFile(file: File): void {
        this.setAttribute('file', file);
    }
}
