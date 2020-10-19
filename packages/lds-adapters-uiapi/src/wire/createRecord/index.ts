import { LDS, FetchResponse, Snapshot } from '@ldsjs/engine';

import { deepFreeze } from '../../util/deep-freeze';
import { buildSelectionFromRecord } from '../../selectors/record';

import {
    RecordRepresentation,
    keyBuilder as recordRepresentationKeyBuilder,
} from '../../generated/types/RecordRepresentation';
import postUiApiRecords from '../../generated/resources/postUiApiRecords';
import { createResourceParams, CreateRecordConfig } from '../../generated/adapters/createRecord';
import { BLANK_RECORD_FIELDS_TRIE } from '../../util/records';
import { createRecordIngest } from '../../util/record-ingest';

export const factory = (lds: LDS) => {
    return function(untrustedConfig: unknown): Promise<Snapshot<RecordRepresentation>> {
        const resourceParams = createResourceParams(untrustedConfig as CreateRecordConfig);
        const request = postUiApiRecords(resourceParams);
        const fieldTrie = BLANK_RECORD_FIELDS_TRIE;
        const optionalFieldTrie = BLANK_RECORD_FIELDS_TRIE;
        const recordIngest = createRecordIngest(fieldTrie, optionalFieldTrie);
        return lds.dispatchResourceRequest<RecordRepresentation>(request).then(
            response => {
                const { body } = response;

                const selections = buildSelectionFromRecord(body);
                const key = recordRepresentationKeyBuilder({
                    recordId: body.id,
                });

                lds.storeIngest(key, recordIngest, body);
                lds.storeBroadcast();

                return lds.storeLookup({
                    recordId: key,
                    node: {
                        kind: 'Fragment',
                        private: [],
                        selections,
                    },
                    variables: {},
                });
            },
            (err: FetchResponse<{ error: string }>) => {
                deepFreeze(err);
                throw err;
            }
        );
    };
};
