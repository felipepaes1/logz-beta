import { HttpClientResponse, Model, PluralResponse, SingularResponse } from 'coloquent';
import { JsonApiResponseBody } from 'coloquent/dist/JsonApiResponseBody';
import { Query } from 'coloquent/dist/Query';
import { BaseResource } from '../base/BaseResource';

export interface HttpColoquentResponse {
    data: Array<any>;
    included: Array<any>;
}

export interface ProcessColoquentResponseInterface {
    response: HttpClientResponse;
    data: Array<any>;
    included: Array<any>;
    jsonApiType: string;
    coloquentResource: any;
    targetKey?: string;
}

function makePluralResponse(
    processColoquentResponseInterface: ProcessColoquentResponseInterface,
    data: Array<any>
): PluralResponse {
    const responseBody: JsonApiResponseBody = {
        data: data,
        included: processColoquentResponseInterface.included ? processColoquentResponseInterface.included : [],
    };

    return new PluralResponse(
        new Query(processColoquentResponseInterface.jsonApiType),
        processColoquentResponseInterface.response,
        <any>processColoquentResponseInterface.coloquentResource,
        responseBody
    );
}

function makeSingularResponse(
    processColoquentResponseInterface: ProcessColoquentResponseInterface,
    data: any
): SingularResponse {
    const responseBody: JsonApiResponseBody = {
        data: data,
        included: processColoquentResponseInterface.included ? processColoquentResponseInterface.included : [],
    };

    return new SingularResponse(
        new Query(processColoquentResponseInterface.jsonApiType),
        processColoquentResponseInterface.response,
        <any>processColoquentResponseInterface.coloquentResource,
        responseBody
    );
}

export function processSingularResponse(
    processColoquentResponseInterface: ProcessColoquentResponseInterface
): any {
    if (!processColoquentResponseInterface.data?.length) {
        return [];
    }

    return makeSingularResponse(
        processColoquentResponseInterface,
        processColoquentResponseInterface.data[0]
    ).getData();
}

export function getResourceFromApiResourceObject(resourceObject: any, resourceType: BaseResource): Model | null {
    const responseBody: JsonApiResponseBody = {
        data: resourceObject,
        included: [],
    };

    return new SingularResponse(
        new Query(resourceObject.type),
        <HttpClientResponse>resourceObject,
        <any>resourceType,
        responseBody
    ).getData();
}

export function processPluralResponse(
    processColoquentResponseInterface: ProcessColoquentResponseInterface
): Array<any> {
    if (!processColoquentResponseInterface.data?.length) {
        return [];
    }

    if (processColoquentResponseInterface.targetKey) {
        const formattedResponse: any[] = [];

        processColoquentResponseInterface.data.forEach(element => {
            const data = Array.isArray(element[processColoquentResponseInterface.targetKey])
                ? element[processColoquentResponseInterface.targetKey]
                : [element[processColoquentResponseInterface.targetKey]];

            const pluralResponse = makePluralResponse(processColoquentResponseInterface, data);

            element[processColoquentResponseInterface.targetKey] = pluralResponse.getData();

            formattedResponse.push(element);
        });

        return formattedResponse;
    }

    const data = Array.isArray(processColoquentResponseInterface.data)
        ? processColoquentResponseInterface.data
        : [processColoquentResponseInterface.data];

    return makePluralResponse(processColoquentResponseInterface, data).getData();
}
