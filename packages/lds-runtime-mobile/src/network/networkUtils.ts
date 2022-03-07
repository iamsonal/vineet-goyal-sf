import type { Request, Response, ObservabilityContext } from '@mobileplatform/nimbus-plugin-lds';
import type { ResourceRequest, FetchResponse, ResourceRequestContext } from '@luvio/engine';
import { HttpStatusCode } from '@luvio/engine';
import {
    ArrayIsArray,
    ObjectKeys,
    ObjectCreate,
    JSONParse,
    JSONStringify,
} from '../utils/language';

function ldsParamsToString(params: ResourceRequest['queryParams']): Request['queryParams'] {
    const returnParams = ObjectCreate(null);

    const keys = ObjectKeys(params);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const value = params[key];

        if (value === undefined) {
            // filter out params that have no value
            continue;
        }

        if (ArrayIsArray(value)) {
            // filter out empty arrays
            if (value.length > 0) {
                returnParams[key] = value.join(',');
            }
        } else {
            returnParams[key] = `${value}`;
        }

        if (isObject(value) === true && ObjectKeys(value).length > 0) {
            returnParams[key] = JSONStringify(value);
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

function priorityFromResourceRequest(request: ResourceRequest) {
    switch (request.priority) {
        case 'background':
            return 'background';
        case 'high':
            return 'high';
        case 'normal':
        default:
            return 'normal';
    }
}

function isStatusOk(status: number): boolean {
    return status >= 200 && status <= 299;
}

// adapted from adapter-utils untrustedIsObject
function isObject(value: unknown) {
    return typeof value === 'object' && value !== null && ArrayIsArray(value) === false;
}

function stringifyIfPresent(value: any | null): string | null {
    if (value === undefined || value === null) {
        return null;
    }
    return JSONStringify(value);
}

function parseIfPresent(value: string | null): any | null {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    return JSONParse(value);
}

interface RequestCorrelator {
    observabilityContext?: ObservabilityContext;
}

export function buildNimbusNetworkPluginRequest(
    resourceRequest: ResourceRequest,
    resourceRequestContext?: ResourceRequestContext
): Request {
    const { basePath, baseUri, method, headers, queryParams, body } = resourceRequest;

    let observabilityContext: ObservabilityContext | null = null;

    if (
        resourceRequestContext !== undefined &&
        resourceRequestContext.requestCorrelator !== undefined &&
        (resourceRequestContext.requestCorrelator as RequestCorrelator).observabilityContext !==
            undefined
    ) {
        ({ observabilityContext = null } =
            resourceRequestContext.requestCorrelator as RequestCorrelator);
    }

    return {
        method: methodFromResourceRequestMethod(method),
        body: stringifyIfPresent(body),
        headers,
        queryParams: ldsParamsToString(queryParams),
        path: `${baseUri}${basePath}`,
        priority: priorityFromResourceRequest(resourceRequest),
        observabilityContext,
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
