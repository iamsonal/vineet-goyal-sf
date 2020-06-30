import { Request, Response } from '@hybrid/nimbus-plugin-lds';
import { ResourceRequest, FetchResponse, HttpStatusCode } from '@ldsjs/engine';

function ldsParamsToString(params: ResourceRequest['queryParams']): Request['queryParams'] {
    const returnParams = Object.create(null);

    const keys = Object.keys(params);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const value = params[key];

        if (Array.isArray(value)) {
            returnParams[key] = value.join(',');
        } else {
            returnParams[key] = `${value}`;
        }
    }

    return returnParams;
}

function statusTextFromStatusCode(status: number): string {
    switch (status) {
        case HttpStatusCode.Ok:
            return 'OK';
        case HttpStatusCode.NotModified:
            return 'Not Modified';
        case HttpStatusCode.NotFound:
            return 'Not Found';
        case HttpStatusCode.BadRequest:
            return 'Bad Request';
        case HttpStatusCode.ServerError:
            return 'Server Error';
        default:
            return `Unexpected HTTP Status Code: ${status}`;
    }
}

function isStatusOk(status: number): boolean {
    return status >= 200 && status <= 299;
}

export function buildNimbusNetworkPluginRequest(resourceRequest: ResourceRequest): Request {
    const { basePath, baseUri, method, headers, queryParams, body } = resourceRequest;
    return {
        method: method.toUpperCase(),
        body: body ? JSON.stringify(body) : null,
        headers,
        queryParams: ldsParamsToString(queryParams),
        path: `${baseUri}${basePath}`,
    };
}

export function buildLdsResponse(response: Response): FetchResponse<any> {
    const { body: responseBody, headers, status } = response;

    const statusText = statusTextFromStatusCode(status);

    return {
        statusText,
        status,
        body: responseBody === null ? null : JSON.parse(responseBody),
        headers,
        ok: isStatusOk(status),
    };
}
