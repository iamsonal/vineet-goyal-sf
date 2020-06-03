import { ResourceRequest, HttpStatusCode } from '@ldsjs/engine';
import { UiApiParams, DispatchActionConfig } from './utils';
import { AuraFetchResponse } from '../AuraFetchResponse';
import { executeGlobalController } from 'aura';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { ObjectKeys, ArrayPrototypeJoin, ArrayPrototypePush } from '../../../utils/language';

// Boundary which represents the limit that we start chunking at,
// determined by comma separated string length of fields
const MAX_STRING_LENGTH_PER_CHUNK = 10000;
const referenceId = 'LDS_Records_AggregateUi';

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

function createOkResponse(body: RecordRepresentation): AuraFetchResponse<RecordRepresentation> {
    return new AuraFetchResponse(HttpStatusCode.Ok, body);
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
    endpoint: string,
    params: any,
    config: DispatchActionConfig = {}
): Promise<AuraFetchResponse<unknown>> {
    const { action: actionConfig } = config;

    return executeGlobalController(endpoint, params, actionConfig).then(
        (body: CompositeResponseEnvelope<RecordRepresentation>) => {
            // This response body could be an executeAggregateUi, which we don't natively support.
            // Massage it into looking like a getRecord response.

            if (
                body === null ||
                body === undefined ||
                body.compositeResponse === undefined ||
                body.compositeResponse.length === 0
            ) {
                // We shouldn't even get into this state - a 200 with no body?
                throw new AuraFetchResponse(HttpStatusCode.ServerError, {
                    error: 'No response body in executeAggregateUi found',
                });
            }

            const merged = body.compositeResponse.reduce(
                (seed: null | RecordRepresentation, response) => {
                    if (response.httpStatusCode !== HttpStatusCode.Ok) {
                        throw new AuraFetchResponse(HttpStatusCode.ServerError, {
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
        err => {
            // Handle ConnectedInJava exception shapes
            if (err.data !== undefined && err.data.statusCode !== undefined) {
                const { data } = err;
                throw new AuraFetchResponse(data.statusCode, data);
            }

            // Handle all the other kind of errors
            throw new AuraFetchResponse(HttpStatusCode.ServerError, {
                error: err.message,
            });
        }
    );
}

export function buildAggregateUiUrl(params: UiApiParams, resourceRequest: ResourceRequest): string {
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

export function buildGetRecordByFieldsCompositeRequest(
    recordId: string,
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
    // Formula:  # of fields per chunk = floor(avg field length / max length per chunk)
    const averageFieldStringLength = Math.floor(
        (fieldsLength + optionalFieldsLength) / (fieldsArray.length + optionalFieldsArray.length)
    );
    const fieldsPerChunk = Math.floor(MAX_STRING_LENGTH_PER_CHUNK / averageFieldStringLength);

    const fieldsChunks: string[][] = [];
    const optionalFieldsChunks: string[][] = [];

    for (let i = 0, j = fieldsArray.length; i < j; i += fieldsPerChunk) {
        const newChunk = <string[]>fieldsArray.slice(i, i + fieldsPerChunk);
        ArrayPrototypePush.call(fieldsChunks, newChunk);
    }

    for (let i = 0, j = optionalFieldsArray.length; i < j; i += fieldsPerChunk) {
        const newChunk = <string[]>optionalFieldsArray.slice(i, i + fieldsPerChunk);
        ArrayPrototypePush.call(optionalFieldsChunks, newChunk);
    }

    const compositeRequest: CompositeRequest[] = [];

    for (let i = 0, len = fieldsChunks.length; i < len; i += 1) {
        const fieldChunk = fieldsChunks[i];
        const url = buildAggregateUiUrl(
            {
                recordId,
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
                recordId,
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

export function shouldUseAggregateUiForGetRecord(
    fieldsArray: string,
    optionalFieldsArray: string
): boolean {
    return fieldsArray.length + optionalFieldsArray.length >= MAX_STRING_LENGTH_PER_CHUNK;
}
