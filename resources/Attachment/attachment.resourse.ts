import { BaseResource } from "../../base/BaseResource";
import api_url from "../../services/api";

type AttachmentMediaType = 'preview' | 'thumbnail';

export function buildAttachmentMediaUrl(
    token?: string | null,
    type: AttachmentMediaType = 'preview',
    tenancyId?: string | null
): string {
    const selectedTenancyId =
        tenancyId ??
        (typeof window !== 'undefined'
            ? localStorage.getItem('@tenancy_id') ?? ''
            : '');

    if (!token || !selectedTenancyId) return '';

    return `${api_url}/tenants/${encodeURIComponent(selectedTenancyId)}/attachments/${encodeURIComponent(token)}/${type}`;
}

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
        return buildAttachmentMediaUrl(this.getToken(), 'preview');
    }

    public getDownloadUrlWithTenancy(tenancyId: string): string{
        const url = (this.jsonApiType + '').replace(':tenant_id', tenancyId);
        return `${api_url}/${url}/${this.getToken()}/download`;
    }
    

    public getThumbnailUrl(): string {
        return buildAttachmentMediaUrl(this.getToken(), 'thumbnail');
    }

    public setFile(file: File): void {
        this.setAttribute('file', file);
    }
}
