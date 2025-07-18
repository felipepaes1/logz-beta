import { AuthDTO } from "../../dtos/Auth/Auth.dto";
import { HttpClientResponse } from 'coloquent';
import { BaseResource } from "../../base/BaseResource";
import { AuthenticatedUser } from "./authenticated-user.resource";

export class AuthResource extends BaseResource {
    public static jsonApiType = "";

    public static async login(authDTO: AuthDTO) {
        const payload = {
            email: authDTO.login,
            password: authDTO.password,
        };

        return this.action('login', payload)
            .then((response: HttpClientResponse) =>
                AuthenticatedUser.saveOnLocalStorage(response.getData())
            );
    }

    public static async validateJwt(): Promise<void> {
        return this.action('validate');
    }
}
