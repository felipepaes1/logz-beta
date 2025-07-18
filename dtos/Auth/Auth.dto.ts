import { BaseDTO } from "../../base/Base.dto";

export class AuthDTO extends BaseDTO {
    public login?: string;
    public password?: string;
    public remember?: boolean;
    public force_connection?: boolean;
}
