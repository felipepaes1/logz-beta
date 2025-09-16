import { BaseDTO } from "../../base/Base.dto";
import { UserResource } from "./user.resource";

export class UserDto extends BaseDTO {
  public id?: string;

  public role_id?: number | null;
  public avatar_id?: number | null;

  public name: string;
  public email: string;

  public document_number?: string | null;
  public phone?: string | null;

  public invited?: boolean;

  public password?: string;

  public created_at?: string;
  public updated_at?: string;
  public deleted_at?: string | null;

  public userResource?: UserResource;


  public createFromColoquentResource(userResource: UserResource | null): UserDto {
    if (!userResource || typeof userResource.getApiId !== "function") {
      return this;
    }

    this.userResource   = userResource;
    this.id             = userResource.getApiId();

    this.tenant_id      = userResource.getAttribute("tenant_id");
    this.role_id        = userResource.getAttribute("role_id");
    this.avatar_id      = userResource.getAttribute("avatar_id");

    this.name           = userResource.getAttribute("name");
    this.email          = userResource.getAttribute("email");

    this.document_number = userResource.getAttribute("document_number");
    this.phone           = userResource.getAttribute("phone");

    this.invited        = !!userResource.getAttribute("invited");

    this.created_at     = userResource.getAttribute("created_at");
    this.updated_at     = userResource.getAttribute("updated_at");
    this.deleted_at     = userResource.getAttribute("deleted_at");

    return this;
  }


  public bindToSave(): Partial<UserDto> {
    return {
      tenant_id: this.tenant_id,
      role_id: this.role_id ?? null,
      avatar_id: this.avatar_id ?? null,
      name: this.name,
      email: this.email,
      document_number: this.document_number ?? null,
      phone: this.phone ?? null,
      invited: this.invited,
      ...(this.password ? { password: this.password } : {}),
    };
  }
}
