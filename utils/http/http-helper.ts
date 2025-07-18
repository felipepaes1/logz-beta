const REMOVE_QUERY_STRING_REGEX: RegExp = new RegExp('(^[^?]+)');

declare const escape: any;

export function getErrorMessageByStatus(status: number): string {
    switch (status) {
        case 401:
            return "Ação não autorizada!";

        case 404:
            return "Recurso não encontrado";

        case 422:
            return "Parece que algum campo obrigatório não foi preenchido corretamente";

        default:
            return 'Erro interno do servidor';
    }
}

export function buildQueryStringFromParams(params: any, num_prefix?: number, temp_key?: string): string {
    const output_string: string[] = [];

    params = !params ? {} : params;

    Object.keys(params).forEach((val) => {
        let key = val;

        if (num_prefix && !isNaN(<any>key)) {
            key = num_prefix + key;
        }

        key = encodeURIComponent(key.replace(/[!'()*]/g, escape));

        if (temp_key) {
            key = temp_key + '[' + key + ']';
        }

        if (typeof params[val] === 'object') {
            let query = buildQueryStringFromParams(params[val], null, key);

            if (query) {
                output_string.push(query);
            }
        } else {
            let value = encodeURIComponent(params[val] + ''.replace(/[!'()*]/g, escape));

            if (key) {
                output_string.push(key + '=' + value);
            }
        }
    });

    return output_string.join('&');
}

export function urlWithoutQueryString(url: string): string {
    return REMOVE_QUERY_STRING_REGEX.exec(url)?.shift() ?? url;
}
