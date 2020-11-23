import { Request, Response } from '@mobileplatform/nimbus-plugin-lds';
import { ResourceRequest, FetchResponse, HttpStatusCode } from '@luvio/engine';

function ldsParamsToString(params: ResourceRequest['queryParams']): Request['queryParams'] {
    const returnParams = Object.create(null);

    const keys = Object.keys(params);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const value = params[key];

        if (value === undefined) {
            // filter out params that have no value
            continue;
        }

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

function methodFromResourceRequestMethod(method: string) {
    switch (method.toLowerCase()) {
        case 'get':
            return 'GET';
        case 'put':
            return 'PUT';
        case 'post':
            return 'POST';
        case 'delete':
            return 'DELETE';
        case 'patch':
            return 'PATCH';
        default:
            throw Error(`Unexpected method ${method}`);
    }
}

function isStatusOk(status: number): boolean {
    return status >= 200 && status <= 299;
}

function stringifyIfPresent(value: any | null): string | null {
    if (value === undefined || value === null) {
        return null;
    }
    return JSON.stringify(value);
}

function parseIfPresent(value: string | null): any | null {
    if (value === undefined || value === null) {
        return null;
    }
    return JSON.parse(value);
}

export function buildNimbusNetworkPluginRequest(resourceRequest: ResourceRequest): Request {
    const { basePath, baseUri, method, headers, queryParams, body } = resourceRequest;
    return {
        method: methodFromResourceRequestMethod(method),
        body: stringifyIfPresent(body),
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
        body: parseIfPresent(responseBody),
        headers,
        ok: isStatusOk(status),
    };
}
