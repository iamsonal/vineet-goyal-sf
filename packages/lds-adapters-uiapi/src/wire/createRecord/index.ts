import { Luvio, FetchResponse, Snapshot, ResourceIngest } from '@luvio/engine';

import { deepFreeze } from '../../util/deep-freeze';
import { buildSelectionFromRecord } from '../../selectors/record';

import {
    RecordRepresentation,
    keyBuilder as recordRepresentationKeyBuilder,
} from '../../generated/types/RecordRepresentation';
import postUiApiRecords from '../../generated/resources/postUiApiRecords';
import { createResourceParams, CreateRecordConfig } from '../../generated/adapters/createRecord';
import { naiveGetResponseCacheKeys as getResponseCacheKeys } from '../../generated/adapters/getRecord';
import { BLANK_RECORD_FIELDS_TRIE } from '../../util/records';
import { createRecordIngest } from '../../util/record-ingest';
import {
    RecordConflictMap,
    resolveConflict,
} from '../../helpers/RecordRepresentation/resolveConflict';

function onResponseSuccess(
    luvio: Luvio,
    response: FetchResponse<RecordRepresentation>,
    recordIngest: ResourceIngest,
    conflictMap: RecordConflictMap
) {
    const { body } = response;

    const selections = buildSelectionFromRecord(body);
    const key = recordRepresentationKeyBuilder({
        recordId: body.id,
    });

    luvio.storeIngest(key, recordIngest, body);
    resolveConflict(luvio, conflictMap);
    const snapshot = luvio.storeLookup<RecordRepresentation>({
        recordId: key,
        node: {
            kind: 'Fragment',
            private: [],
            selections,
        },
        variables: {},
    });

    luvio.storeBroadcast();

    return snapshot;
}

export const factory = (luvio: Luvio) => {
    return function (untrustedConfig: unknown): Promise<Snapshot<RecordRepresentation>> {
        const resourceParams = createResourceParams(untrustedConfig as CreateRecordConfig);
        const request = postUiApiRecords(resourceParams);
        const fieldTrie = BLANK_RECORD_FIELDS_TRIE;
        const optionalFieldTrie = BLANK_RECORD_FIELDS_TRIE;
        const conflictMap: RecordConflictMap = {
            conflicts: {},
            serverRequestCount: 1,
        };
        const recordIngest = createRecordIngest(fieldTrie, optionalFieldTrie, conflictMap);
        return luvio.dispatchResourceRequest<RecordRepresentation>(request).then(
            (response) => {
                return luvio.handleSuccessResponse(
                    () => onResponseSuccess(luvio, response, recordIngest, conflictMap),
                    // TODO [W-10055997]: use getResponseCacheKeys from type
                    () =>
                        getResponseCacheKeys(
                            luvio,
                            {
                                urlParams: { recordId: response.body.id },
                                queryParams: {},
                            },
                            response
                        )
                );
            },
            (err: FetchResponse<{ error: string }>) => {
                deepFreeze(err);
                throw err;
            }
        );
    };
};
