import { Luvio, FulfilledSnapshot, ResourceResponse, StaleSnapshot } from '@luvio/engine';
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
import { getTrackedFields } from '../../../util/records';

export function ingestSuccessChildResourceParams(
    luvio: Luvio,
    childResourceParamsArray: getUiApiRecordsByRecordId_ResourceRequestConfig[],
    childEnvelopes: BatchResultRepresentation[]
): {
    childSnapshotData: BatchRepresentation;
    seenRecords: { [key: string]: boolean };
    snapshotState: string;
} {
    const childSnapshotDataResponses: BatchRepresentation['results'] = [];
    let seenRecords: FulfilledSnapshot<BatchRepresentation, {}>['seenRecords'] = {};
    let snapshotState = 'Fulfilled';
    for (let index = 0, len = childResourceParamsArray.length; index < len; index += 1) {
        const childResourceParams = childResourceParamsArray[index];
        const result = childEnvelopes[index];
        if (result.statusCode === 200) {
            const { statusCode: childStatusCode, result: childBody } = result;
            const childResponse: ResourceResponse<RecordRepresentation> = {
                status: childStatusCode,
                body: childBody,
                ok: true,
                statusText: 'OK',
                headers: undefined,
            };

            const childKey = getUiApiRecordsByRecordId_keyBuilder(childResourceParams);
            const childTrackedFields = getTrackedFields(
                childKey,
                luvio.getNode(childKey),
                childResourceParams.queryParams.optionalFields
            );
            const childSnapshot = getRecord_onResourceSuccess(
                luvio,
                {
                    recordId: childResourceParams.urlParams.recordId,
                    fields: childResourceParams.queryParams.fields,
                    optionalFields: childResourceParams.queryParams.optionalFields,
                },
                childKey,
                childTrackedFields,
                childResponse
            ) as
                | FulfilledSnapshot<RecordRepresentation, {}>
                | StaleSnapshot<RecordRepresentation, {}>;
            if (childSnapshot.state === 'Stale') {
                snapshotState = 'Stale';
            }
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
            const childStatusCodeText = getFetchResponseStatusText(result.statusCode);
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

    return { childSnapshotData: ObjectFreeze(childSnapshotData), seenRecords, snapshotState };
}
