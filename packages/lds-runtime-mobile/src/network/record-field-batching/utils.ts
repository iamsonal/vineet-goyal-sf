import { ResourceRequest, HttpStatusCode } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { ArrayPrototypeJoin, ArrayPrototypePush, ObjectKeys } from '../../utils/language';

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

export function shouldUseAggregateUiForFields(
    fieldsArray: string,
    optionalFieldsArray: string
): boolean {
    return fieldsArray.length + optionalFieldsArray.length >= MAX_STRING_LENGTH_PER_CHUNK;
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
