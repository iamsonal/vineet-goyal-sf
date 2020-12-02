import { Luvio, FulfilledSnapshot } from '@luvio/engine';
import {
    ObjectFreeze,
    getFetchResponseStatusText,
} from '../../../generated/adapters/adapter-utils';
import {
    keyBuilder as getUiApiRecordsByRecordId_keyBuilder,
    ResourceRequestConfig as getUiApiRecordsByRecordId_ResourceRequestConfig,
} from '../../../generated/resources/getUiApiRecordsByRecordId';
import { BatchRepresentation } from '../../../generated/types/BatchRepresentation';
import { BatchResultRepresentation } from '../../../generated/types/BatchResultRepresentation';
import { RecordRepresentation } from '../../../generated/types/RecordRepresentation';
import {
    ingestSuccess as getRecord_onResourceSuccess,
    ingestError as getRecord_onResourceError,
} from '../../../wire/getRecord/GetRecordFields';

export function ingestSuccessChildResourceParams(
    luvio: Luvio,
    childResourceParamsArray: getUiApiRecordsByRecordId_ResourceRequestConfig[],
    childEnvelopes: BatchResultRepresentation[]
): { childSnapshotData: BatchRepresentation; seenRecords: { [key: string]: boolean } } {
    const childSnapshotDataResponses: BatchRepresentation['results'] = [];
    let seenRecords: FulfilledSnapshot<BatchRepresentation, {}>['seenRecords'] = {};
    for (let index = 0, len = childResourceParamsArray.length; index < len; index += 1) {
        const childResourceParams = childResourceParamsArray[index];
        const result = childEnvelopes[index];
        const childStatusCodeText = getFetchResponseStatusText(result.statusCode);
        if (result.statusCode === 200) {
            const { statusCode: childStatusCode, result: childBody } = result;
            const childResponse = {
                status: childStatusCode,
                body: childBody,
                ok: true,
                statusText: childStatusCodeText,
                headers: {},
            };
            const childSnapshot = getRecord_onResourceSuccess(
                luvio,
                {
                    recordId: childResourceParams.urlParams.recordId,
                    fields: childResourceParams.queryParams.fields,
                    optionalFields: childResourceParams.queryParams.optionalFields,
                },
                getUiApiRecordsByRecordId_keyBuilder(childResourceParams),
                [],
                childResponse
            ) as FulfilledSnapshot<RecordRepresentation, {}>;
            seenRecords = {
                ...seenRecords,
                ...childSnapshot.seenRecords,
                [childSnapshot.recordId]: true,
            };
            const childValue = {
                statusCode: childStatusCode,
                result: childSnapshot.data,
            };
            ObjectFreeze(childValue);
            childSnapshotDataResponses.push(childValue);
        } else if (result.statusCode === 404) {
            const { statusCode: childStatusCode, result: childBody } = result;
            const childResponse = {
                status: childStatusCode,
                body: childBody,
                ok: false,
                statusText: childStatusCodeText,
                headers: {},
            };
            const childErrorSnapshot = getRecord_onResourceError(
                luvio,
                {
                    recordId: childResourceParams.urlParams.recordId,
                    fields: childResourceParams.queryParams.fields,
                    optionalFields: childResourceParams.queryParams.optionalFields,
                },
                getUiApiRecordsByRecordId_keyBuilder(childResourceParams),
                childResponse
            );
            seenRecords = {
                ...seenRecords,
                [getUiApiRecordsByRecordId_keyBuilder(childResourceParams)]: true,
            };
            const childValue = {
                statusCode: childStatusCode,
                result: childErrorSnapshot.error,
            };
            ObjectFreeze(childValue);
            childSnapshotDataResponses.push(childValue);
        }
    }

    ObjectFreeze(childSnapshotDataResponses);
    const childSnapshotData: BatchRepresentation = {
        results: childSnapshotDataResponses,
    };

    return { childSnapshotData: ObjectFreeze(childSnapshotData), seenRecords };
}
