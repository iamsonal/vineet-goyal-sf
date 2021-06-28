import { Luvio, FulfilledSnapshot, ResourceResponse, StaleSnapshot } from '@luvio/engine';
import {
    ObjectFreeze,
    getFetchResponseStatusText,
    ObjectCreate,
} from '../../../generated/adapters/adapter-utils';
import {
    keyBuilder as getUiApiRecordsByRecordId_keyBuilder,
    ResourceRequestConfig as getUiApiRecordsByRecordId_ResourceRequestConfig,
} from '../../../generated/resources/getUiApiRecordsByRecordId';
import { BatchRepresentation } from '../../../generated/types/BatchRepresentation';
import { BatchResultRepresentation } from '../../../generated/types/BatchResultRepresentation';
import {
    RecordRepresentation,
    TTL as RecordRepresentationTTL,
} from '../../../generated/types/RecordRepresentation';
import {
    ingestSuccess as getRecord_onResourceSuccess,
    ingestError as getRecord_onResourceError,
} from '../../../wire/getRecord/GetRecordFields';
import { getTrackedFields } from '../../../util/records';
import { configuration } from '../../../configuration';

export const nonCachedErrors: {
    [key: string]: { expiration: number; response: any; status: number } | undefined;
} = ObjectCreate(null);

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
    const now = Date.now();
    for (let index = 0, len = childResourceParamsArray.length; index < len; index += 1) {
        const childResourceParams = childResourceParamsArray[index];
        const childKey = getUiApiRecordsByRecordId_keyBuilder(childResourceParams);
        const result = childEnvelopes[index];
        const { statusCode: childStatusCode, result: childBody } = result;
        if (childStatusCode === 200) {
            const childResponse: ResourceResponse<RecordRepresentation> = {
                status: childStatusCode,
                body: childBody as RecordRepresentation,
                ok: true,
                statusText: 'OK',
                headers: undefined,
            };

            const childTrackedFields = getTrackedFields(
                childKey,
                luvio.getNode(childKey),
                {
                    maxDepth: configuration.getTrackedFieldDepthOnCacheMiss(),
                    onlyFetchLeafNodeId: configuration.getTrackedFieldLeafNodeIdOnly(),
                },
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
        } else {
            const childStatusCodeText = getFetchResponseStatusText(childStatusCode);
            const childResponse = {
                status: childStatusCode,
                body: childBody,
                ok: false,
                statusText: childStatusCodeText,
                headers: {},
            };
            getRecord_onResourceError(
                luvio,
                {
                    recordId: childResourceParams.urlParams.recordId,
                    fields: childResourceParams.queryParams.fields,
                    optionalFields: childResourceParams.queryParams.optionalFields,
                },
                childKey,
                childResponse
            );
            seenRecords = {
                ...seenRecords,
                [childKey]: true,
            };
            const childValue = {
                statusCode: childStatusCode,
                result: childBody,
            };
            ObjectFreeze(childValue);
            childSnapshotDataResponses.push(childValue);
        }

        // track non-cached responses so rebuilds work properly
        if (childStatusCode !== 404 && childStatusCode !== 200) {
            nonCachedErrors[childKey] = {
                expiration: now + RecordRepresentationTTL,
                response: childBody,
                status: childStatusCode,
            };
        } else {
            delete nonCachedErrors[childKey];
        }
    }

    ObjectFreeze(childSnapshotDataResponses);
    const childSnapshotData: BatchRepresentation = {
        results: childSnapshotDataResponses,
    };

    return {
        childSnapshotData: ObjectFreeze(childSnapshotData),
        seenRecords,
        snapshotState,
    };
}
