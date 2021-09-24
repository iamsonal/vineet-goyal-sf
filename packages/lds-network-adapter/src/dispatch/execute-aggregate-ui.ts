import { FetchResponse, HttpStatusCode, NetworkAdapter, ResourceRequest } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    ArrayPrototypeJoin,
    ArrayPrototypePush,
    ArrayPrototypeUnshift,
    ObjectKeys,
} from '../language';

const LDS_RECORDS_AGGREGATE_UI = 'LDS_Records_AggregateUi';

// Boundary which represents the limit that we start chunking at,
// determined by comma separated string length of fields
const MAX_STRING_LENGTH_PER_CHUNK = 10000;
// Due to underlying SOQL limits with the maximum number of external objects
// allowed per query, use *four* as our lookup limit
const MAX_EXTERNAL_LOOKUP_LIMIT = 4;
// UIAPI limit
export const MAX_AGGREGATE_UI_CHUNK_LIMIT = 50;

export interface CompositeRequest {
    url: string;
    referenceId: string;
}

type CompositeResponse<T> =
    | {
          body: T;
          httpStatusCode: HttpStatusCode.Ok;
      }
    | {
          message: string;
          httpStatusCode: Exclude<HttpStatusCode, HttpStatusCode.Ok>;
      };

interface CompositeResponseEnvelope<T> {
    compositeResponse: CompositeResponse<T>[];
}

function createOkResponse(body: RecordRepresentation): FetchResponse<RecordRepresentation> {
    return {
        status: HttpStatusCode.Ok,
        body,
        statusText: 'ok',
        headers: {},
        ok: true,
    };
}

function getErrorResponseText(status: HttpStatusCode): string {
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

function createErrorResponse(status: HttpStatusCode, body: unknown): FetchResponse<unknown> {
    return {
        status,
        body,
        statusText: getErrorResponseText(status),
        headers: {},
        ok: false,
    };
}

function isSpanningRecord(
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
                targetFields[fieldName] = sourceFields[fieldName];
                continue;
            }

            mergeRecordFields(targetField.value as RecordRepresentation, sourceField.value);
            continue;
        }

        targetFields[fieldName] = sourceFields[fieldName];
    }
    return first;
}

/** Invoke executeAggregateUi Aura controller.  This is only to be used with large getRecord requests that
 *  would otherwise cause a query length exception.
 */
export function dispatchSplitRecordAggregateUiAction(
    networkAdapter: NetworkAdapter,
    resourceRequest: ResourceRequest
): Promise<FetchResponse<unknown>> {
    return networkAdapter(resourceRequest).then(
        (resp: FetchResponse<CompositeResponseEnvelope<RecordRepresentation>>) => {
            const { body } = resp;
            // This response body could be an executeAggregateUi, which we don't natively support.
            // Massage it into looking like a getRecord response.

            if (
                body === null ||
                body === undefined ||
                body.compositeResponse === undefined ||
                body.compositeResponse.length === 0
            ) {
                // We shouldn't even get into this state - a 200 with no body?
                throw createErrorResponse(HttpStatusCode.ServerError, {
                    error: 'No response body in executeAggregateUi found',
                });
            }

            const merged = body.compositeResponse.reduce(
                (seed: null | RecordRepresentation, response) => {
                    if (response.httpStatusCode !== HttpStatusCode.Ok) {
                        throw createErrorResponse(HttpStatusCode.ServerError, {
                            error: response.message,
                        });
                    }

                    if (seed === null) {
                        return response.body;
                    }

                    return mergeRecordFields(seed, response.body);
                },
                null
            ) as RecordRepresentation;

            return createOkResponse(merged);
        },
        (err) => {
            // Handle ConnectedInJava exception shapes
            if (err.data !== undefined && err.data.statusCode !== undefined) {
                const { data } = err;
                throw createErrorResponse(data.statusCode, data);
            }

            // Handle all the other kind of errors
            throw createErrorResponse(HttpStatusCode.ServerError, { error: err.message });
        }
    );
}

export function shouldUseAggregateUiForGetRecord(
    fieldsArray: string,
    optionalFieldsArray: string
): boolean {
    return fieldsArray.length + optionalFieldsArray.length >= MAX_STRING_LENGTH_PER_CHUNK;
}

interface AggregateUiParams {
    fields?: string[];
    optionalFields?: string[];
}

export function buildAggregateUiUrl(
    params: AggregateUiParams,
    resourceRequest: ResourceRequest
): string {
    const { fields, optionalFields } = params;
    const queryString: string[] = [];

    if (fields !== undefined && fields.length > 0) {
        const fieldString = ArrayPrototypeJoin.call(fields, ',');
        ArrayPrototypePush.call(queryString, `fields=${fieldString}`);
    }

    if (optionalFields !== undefined && optionalFields.length > 0) {
        const optionalFieldString = ArrayPrototypeJoin.call(optionalFields, ',');
        ArrayPrototypePush.call(queryString, `optionalFields=${optionalFieldString}`);
    }

    return `${resourceRequest.baseUri}${resourceRequest.basePath}?${ArrayPrototypeJoin.call(
        queryString,
        '&'
    )}`;
}

export type ResourceRequestWithConfigOptionalFields = ResourceRequest & {
    configOptionalFields: string[];
};

function getConfigOptionalFields(resourceRequest: ResourceRequest): string[] {
    if ('configOptionalFields' in resourceRequest) {
        return (resourceRequest as ResourceRequestWithConfigOptionalFields).configOptionalFields;
    }
    return [];
}

export interface GetRecordCompositeRequestParams {
    fieldsArray: Array<string>;
    optionalFieldsArray: Array<string>;
    fieldsLength: number;
    optionalFieldsLength: number;
}

export function buildGetRecordByFieldsCompositeRequest(
    resourceRequest: ResourceRequest,
    recordsCompositeRequest: GetRecordCompositeRequestParams
): CompositeRequest[] {
    const { fieldsArray, optionalFieldsArray, fieldsLength, optionalFieldsLength } =
        recordsCompositeRequest;
    // Formula:  # of fields per chunk = floor(avg field length / max length per chunk)
    const averageFieldStringLength = Math.floor(
        (fieldsLength + optionalFieldsLength) / (fieldsArray.length + optionalFieldsArray.length)
    );
    const fieldsPerChunk = Math.floor(MAX_STRING_LENGTH_PER_CHUNK / averageFieldStringLength);

    const optionalFieldsChunks: string[][] = [];

    // For OptionalFields, first check if we need to preserve a config's original fieldset
    const optionalFieldsFromConfig = getConfigOptionalFields(resourceRequest);

    // Right now, optionalFieldsArray includes optional fields from a config.  Let's remove those to cut down duplicate entries.
    const optionalTrackedFields =
        optionalFieldsFromConfig.length > 0
            ? dedupeFields(optionalFieldsFromConfig, optionalFieldsArray)
            : optionalFieldsArray;

    // Separate lookup fields from the tracked fields list so we can distribute them later
    const optionalTrackedFieldsLookupsOnly: string[] = [];
    const optionalTrackedFieldsNoLookups: string[] = [];

    for (let i = 0; i < optionalTrackedFields.length; i++) {
        if (optionalTrackedFields[i].indexOf('__r') > -1) {
            ArrayPrototypePush.call(optionalTrackedFieldsLookupsOnly, optionalTrackedFields[i]);
        } else {
            ArrayPrototypePush.call(optionalTrackedFieldsNoLookups, optionalTrackedFields[i]);
        }
    }

    // Do the same for optional tracked fields
    for (let i = 0, j = optionalTrackedFieldsNoLookups.length; i < j; i += fieldsPerChunk) {
        const newChunk = <string[]>optionalTrackedFieldsNoLookups.slice(i, i + fieldsPerChunk);
        ArrayPrototypePush.call(optionalFieldsChunks, newChunk);
    }

    // Distribute the lookup fields such that there are no more than four per chunk
    for (let i = 0, j = 0; i < optionalTrackedFieldsLookupsOnly.length; i++) {
        let optionalFieldsChunk = optionalFieldsChunks[j];
        if (optionalFieldsChunk === undefined) {
            optionalFieldsChunk = [];
            ArrayPrototypePush.call(optionalFieldsChunks, optionalFieldsChunk);
        }

        ArrayPrototypePush.call(optionalFieldsChunk, optionalTrackedFieldsLookupsOnly[i]);

        // Move to the next chunk if we've already added the max external lookups to the current chunk
        // i + 1 because 0 indexing would result in the first chunk having one lookup
        if ((i + 1) % MAX_EXTERNAL_LOOKUP_LIMIT === 0) {
            j++;
        }
    }

    // Add config fields to the first chunk preserved
    if (optionalFieldsFromConfig.length > 0) {
        ArrayPrototypeUnshift.call(optionalFieldsChunks, optionalFieldsFromConfig);
    }

    const compositeRequest: CompositeRequest[] = [];

    // Add fields as one chunk at the beginning of the compositeRequest
    if (fieldsArray.length > 0) {
        const url = buildAggregateUiUrl(
            {
                fields: fieldsArray,
            },
            resourceRequest
        );

        ArrayPrototypePush.call(compositeRequest, {
            url,
            referenceId: `${LDS_RECORDS_AGGREGATE_UI}_fields`,
        });
    }

    // Add optionalField chunks to the compositeRequest

    // Make sure we don't exceed the max subquery chunk limit for aggUi by capping the amount
    // of optionalFields subqueries at MAX_AGGREGATE_UI_CHUNK_LIMIT - 1 (first chunk is for fields)
    const maxNumberOfAllowableOptionalFieldsChunks = MAX_AGGREGATE_UI_CHUNK_LIMIT - 1;
    const optionalFieldsChunksLength = Math.min(
        optionalFieldsChunks.length,
        maxNumberOfAllowableOptionalFieldsChunks
    );

    for (let i = 0; i < optionalFieldsChunksLength; i += 1) {
        const fieldChunk = optionalFieldsChunks[i];
        const url = buildAggregateUiUrl(
            {
                optionalFields: fieldChunk,
            },
            resourceRequest
        );

        ArrayPrototypePush.call(compositeRequest, {
            url,
            referenceId: `${LDS_RECORDS_AGGREGATE_UI}_optionalFields_${i}`,
        });
    }

    return compositeRequest;
}

/**
 * Returns array of fields in fieldsToDedupe that are not present in baseFields.
 * @param baseFields - array of fields.
 * @param fieldsToDedupe - array of fields to be deduped from baseFields.
 * @returns - array of fields in fieldsToDedupe that are not present in baseFields.
 */
function dedupeFields(baseFields: string[], fieldsToDedupe: string[]): string[] {
    const baseFieldsMap: Record<string, true> = {};
    for (let i = 0; i < baseFields.length; i++) {
        baseFieldsMap[baseFields[i]] = true;
    }

    const dedupedFields = [];
    for (let i = 0; i < fieldsToDedupe.length; i++) {
        const field = fieldsToDedupe[i];
        if (baseFieldsMap[field] !== true) {
            dedupedFields.push(field);
        }
    }
    return dedupedFields;
}
