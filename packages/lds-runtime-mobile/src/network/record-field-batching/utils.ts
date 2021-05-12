import { ResourceRequest, HttpStatusCode, FetchResponse } from '@luvio/engine';
import {
    RecordRepresentation,
    RelatedListRecordCollectionRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import {
    ArrayIsArray,
    ArrayPrototypeJoin,
    ArrayPrototypePush,
    ObjectEntries,
    ObjectKeys,
} from '../../utils/language';

export const MAX_STRING_LENGTH_PER_CHUNK = 10000;

export interface CompositeRequest {
    url: string;
    referenceId: string;
}

interface UiApiClientOptions {
    ifModifiedSince?: string;
    ifUnmodifiedSince?: string;
}

export interface UiApiParams {
    [name: string]: any;
    clientOptions?: UiApiClientOptions;
}

export type CompositeResponse<T> = {
    body: T;
    httpStatusCode: HttpStatusCode.Ok;
};

export interface CompositeResponseEnvelope<T> {
    compositeResponse: CompositeResponse<T>[];
}

/**
 * Object Representation types allowed when merging
 */
type SupportedAggregateRepresentation<T> = Extract<
    T,
    RelatedListRecordCollectionRepresentation | RecordRepresentation
>;

export type AggregateResponse<T> = FetchResponse<
    CompositeResponseEnvelope<SupportedAggregateRepresentation<T>>
>;

interface MergerError {
    error: string;
}

/**
 * merge the aggregate ui child responses into a single object representation
 * @param response
 * @param mergeFunc the function used to define how the records should be merged together
 * @returns the merged record
 */
export function mergeAggregateUiResponse<T>(
    response: AggregateResponse<T>,
    mergeFunc: (first: T, second: T) => SupportedAggregateRepresentation<T>
): FetchResponse<SupportedAggregateRepresentation<T> | MergerError> {
    const { body } = response;

    try {
        if (
            body === null ||
            body === undefined ||
            body.compositeResponse === undefined ||
            body.compositeResponse.length === 0
        ) {
            // We shouldn't even get into this state - a 200 with no body?
            throw new Error('No response body in executeAggregateUi found');
        }

        const merged = body.compositeResponse.reduce(
            (seed: null | SupportedAggregateRepresentation<T>, resp) => {
                if (seed === null) {
                    return resp.body;
                }

                return mergeFunc(seed, resp.body);
            },
            null
        ) as SupportedAggregateRepresentation<T>;

        return {
            ...response,
            body: merged,
        };
    } catch (error) {
        return {
            ...response,
            status: HttpStatusCode.ServerError,
            statusText: 'Server Error',
            body: {
                error: error.toString(),
            },
        };
    }
}

export function buildAggregateUiUrl(params: UiApiParams, resourceRequest: ResourceRequest): string {
    const { fields, optionalFields } = params;
    const mergedParams = {
        ...resourceRequest.queryParams,
        fields,
        optionalFields,
    };
    const queryString: string[] = [];
    for (const [key, value] of ObjectEntries(mergedParams)) {
        if (value !== undefined) {
            queryString.push(`${key}=${ArrayIsArray(value) ? value.join(',') : value}`);
        }
    }
    return `${resourceRequest.baseUri}${resourceRequest.basePath}?${ArrayPrototypeJoin.call(
        queryString,
        '&'
    )}`;
}

export function shouldUseAggregateUiForFields(
    fieldsArray: string,
    optionalFieldsArray: string
): boolean {
    return fieldsArray.length + optionalFieldsArray.length >= MAX_STRING_LENGTH_PER_CHUNK;
}

export function isSpanningRecord(
    fieldValue: null | string | number | boolean | RecordRepresentation
): fieldValue is RecordRepresentation {
    return fieldValue !== null && typeof fieldValue === 'object';
}

export function mergeRecordFields(
    first: RecordRepresentation,
    second: RecordRepresentation
): RecordRepresentation {
    const { fields: targetFields } = first;
    const { fields: sourceFields } = second;
    const fieldNames = ObjectKeys(sourceFields);
    for (let i = 0, len = fieldNames.length; i < len; i += 1) {
        const fieldName = fieldNames[i];
        const sourceField = sourceFields[fieldName];
        const targetField = targetFields[fieldName];

        if (isSpanningRecord(sourceField.value)) {
            if (targetField === undefined) {
                targetFields[fieldName] = sourceField;
                continue;
            }

            mergeRecordFields(targetField.value as RecordRepresentation, sourceField.value);
            continue;
        }

        targetFields[fieldName] = sourceField;
    }
    return first;
}

/**
 * Check to see if we have fields that are > max allowed characters long
 * @param resourceRequest resource request to check
 * @param endpoint Regular Expression to check the endpoint to aggregate
 * @returns undefined if we should not aggregate. object if we should.
 */
export function createAggregateBatchRequestInfo(
    resourceRequest: ResourceRequest,
    endpoint: RegExp
) {
    // only handle GETs on the given endpoint regex
    if (!isGetRequestForEndpoint(endpoint, resourceRequest)) {
        return undefined;
    }

    const {
        queryParams: { fields, optionalFields },
    } = resourceRequest;

    // only handle requests with fields or optional fields
    if (fields === undefined && optionalFields === undefined) {
        return undefined;
    }

    const fieldsArray: string[] = arrayOrEmpty(fields);
    const optionalFieldsArray: string[] = arrayOrEmpty(optionalFields);

    // if fields and optional fields are empty delegate request
    if (fieldsArray.length === 0 && optionalFieldsArray.length === 0) {
        return undefined;
    }

    const fieldsString = fieldsArray.join(',');
    const optionalFieldsString = optionalFieldsArray.join(',');
    if (!shouldUseAggregateUiForFields(fieldsString, optionalFieldsString)) {
        return undefined;
    }

    return { fieldsArray, optionalFieldsArray, fieldsString, optionalFieldsString };
}

export function createAggregateUiRequest(
    resourceRequest: ResourceRequest,
    compositeRequest: CompositeRequest[]
) {
    const aggregateUiPostBody = { compositeRequest };

    const aggregateResourceRequest: ResourceRequest = {
        method: 'post',
        baseUri: resourceRequest.baseUri,
        basePath: '/ui-api/aggregate-ui',
        body: aggregateUiPostBody,
        queryParams: {},
        headers: {},
        urlParams: {},
    };
    return aggregateResourceRequest;
}

export function buildCompositeRequestByFields(
    referenceId: string,
    resourceRequest: ResourceRequest,
    recordsCompositeRequest: {
        fieldsArray: Array<string>;
        optionalFieldsArray: Array<string>;
        fieldsLength: number;
        optionalFieldsLength: number;
    }
): CompositeRequest[] {
    const {
        fieldsArray,
        optionalFieldsArray,
        fieldsLength,
        optionalFieldsLength,
    } = recordsCompositeRequest;
    // Formula:  # of fields per chunk = floor( max length per chunk / avg field length)
    const averageFieldStringLength = Math.floor(
        (fieldsLength + optionalFieldsLength) / (fieldsArray.length + optionalFieldsArray.length)
    );
    const fieldsPerChunk = Math.floor(MAX_STRING_LENGTH_PER_CHUNK / averageFieldStringLength);

    const fieldsChunks: string[][] = [];
    const optionalFieldsChunks: string[][] = [];

    for (let i = 0, len = fieldsArray.length; i < len; i += fieldsPerChunk) {
        const newChunk = <string[]>fieldsArray.slice(i, i + fieldsPerChunk);
        ArrayPrototypePush.call(fieldsChunks, newChunk);
    }

    for (let i = 0, len = optionalFieldsArray.length; i < len; i += fieldsPerChunk) {
        const newChunk = <string[]>optionalFieldsArray.slice(i, i + fieldsPerChunk);
        ArrayPrototypePush.call(optionalFieldsChunks, newChunk);
    }

    const compositeRequest: CompositeRequest[] = [];

    for (let i = 0, len = fieldsChunks.length; i < len; i += 1) {
        const fieldChunk = fieldsChunks[i];
        const url = buildAggregateUiUrl(
            {
                fields: fieldChunk,
            },
            resourceRequest
        );

        ArrayPrototypePush.call(compositeRequest, {
            url,
            referenceId: `${referenceId}_fields_${i}`,
        });
    }

    for (let i = 0, len = optionalFieldsChunks.length; i < len; i += 1) {
        const fieldChunk = optionalFieldsChunks[i];
        const url = buildAggregateUiUrl(
            {
                optionalFields: fieldChunk,
            },
            resourceRequest
        );

        ArrayPrototypePush.call(compositeRequest, {
            url,
            referenceId: `${referenceId}_optionalFields_${i}`,
        });
    }

    return compositeRequest;
}

/**
 * Checks if a resource request is a GET method on the given endpoint
 * @param endpoint Regular Expression of the endpoint
 * @param request the resource request
 */
function isGetRequestForEndpoint(endpoint: RegExp, request: ResourceRequest) {
    const { basePath, method } = request;
    return endpoint.test(basePath) && method === 'get';
}

/**
 * Checks if any is an array and returns it as an array.
 * if not an array it returns an empty array.
 * @param array the item to check is an array
 * @returns the array or an empty array
 */
function arrayOrEmpty<T>(array: any): T[] {
    return array !== undefined && ArrayIsArray(array) ? array : [];
}
