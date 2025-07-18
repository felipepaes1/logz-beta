import axios, { AxiosPromise, AxiosRequestConfig } from 'axios';
import { HttpClientResponse } from 'coloquent';
import { AxiosHttpClientPromise } from 'coloquent/dist/httpclient/axios/AxiosHttpClientPromise';

interface HttpErrorResponse {
    config: AxiosRequestConfig;
    headers: Object;
    request: XMLHttpRequest;
    response: any;
    status: number;
    statusText: string;
    data: any;
}

export interface HttpError {
    status: number;
    message: string;
}

export class RequestHandler {
    public async handle(promise: AxiosPromise): Promise<HttpClientResponse> {
        const handlerPromise = new Promise((resolve, reject) => {
            promise
                .then(response => resolve(response))
                .catch((error: any) => reject(this.proccessRequestError(error)));
        });

        return new AxiosHttpClientPromise(<any>handlerPromise);
    }

    private proccessRequestError(errorResponse: HttpErrorResponse) {
        if (this.isInvalidOrExpiredToken(errorResponse)) {
            return this.handleInvalidOrExpiredToken();
        }

        if (errorResponse?.status !== 403) {
            return this.handleGenericError(errorResponse);
        }

        this.handleAccessDenied();
    }

    private handleInvalidOrExpiredToken(): void {
        // AuthenticatedUser.clearLocalStorage();
        // window.location.href = '/login';
    }

    private handleGenericError(errorResponse: HttpErrorResponse): {} {
        const message: string = typeof errorResponse.data === 'string'
            ? errorResponse.data
            : 'Erro desconhecido. Por favor, contate o suporte.';

        return {
            message: message,
            status: errorResponse.response.status
        };
    }

    private handleAccessDenied(): void {
        // this.router.navigate(['403']);
    }

    private isInvalidOrExpiredToken(errorResponse: HttpErrorResponse): boolean {
        return (errorResponse?.status == 400 && !errorResponse?.data?.message.includes('Requested filter(s)'))
            || errorResponse?.data?.message === 'Unauthenticated.';
    }
}
