import type { FetchResponse, NetworkAdapter, ResourceRequest } from '@luvio/engine';
import { HttpStatusCode } from '@luvio/engine';
import type { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { ArrayPrototypeJoin, ArrayPrototypePush, ObjectKeys } from '../language';
import { instrumentation } from '../instrumentation';

const LDS_RECORDS_AGGREGATE_UI = 'LDS_Records_AggregateUi';

// Boundary which represents the limit that we start chunking at,
// determined by comma separated string length of fields
const MAX_STRING_LENGTH_PER_CHUNK = 10000;
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
    recordId: string,
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
                        instrumentation.getRecordAggregateReject(() => recordId);
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

            instrumentation.getRecordAggregateResolve(() => {
                return {
                    recordId,
                    apiName: merged.apiName,
                };
            });
            return createOkResponse(merged);
        },
        (err) => {
            instrumentation.getRecordAggregateReject(() => recordId);

            // rethrow error
            throw err;
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

    // Do the same for optional tracked fields
    for (let i = 0, j = optionalFieldsArray.length; i < j; i += fieldsPerChunk) {
        const newChunk = <string[]>optionalFieldsArray.slice(i, i + fieldsPerChunk);
        ArrayPrototypePush.call(optionalFieldsChunks, newChunk);
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
