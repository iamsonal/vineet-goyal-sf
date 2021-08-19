import { Luvio, Snapshot, FetchResponse } from '@luvio/engine';

import { deepFreeze } from '../../util/deep-freeze';
import { buildSelectionFromRecord } from '../../selectors/record';

import {
    RecordRepresentation,
    keyBuilder as recordRepresentationKeyBuilder,
} from '../../generated/types/RecordRepresentation';
import {
    updateRecord_ConfigPropertyNames,
    validateAdapterConfig,
    UpdateRecordConfig,
    createResourceParams,
} from '../../generated/adapters/updateRecord';
import patchUiApiRecordsByRecordId from '../../generated/resources/patchUiApiRecordsByRecordId';
import { untrustedIsObject } from '../../generated/adapters/adapter-utils';
import { BLANK_RECORD_FIELDS_TRIE } from '../../util/records';
import { createRecordIngest } from '../../util/record-ingest';
import {
    RecordConflictMap,
    resolveConflict,
} from '../../helpers/RecordRepresentation/resolveConflict';

export interface ClientOptions {
    ifUnmodifiedSince?: string;
}

function getHeaders(clientOptions: unknown) {
    const headers: { ifUnmodifiedSince?: string } = {};

    if (untrustedIsObject<ClientOptions>(clientOptions)) {
        if (typeof clientOptions.ifUnmodifiedSince === 'string') {
            headers.ifUnmodifiedSince = clientOptions.ifUnmodifiedSince;
        }
    }
    return headers;
}

export const factory = (luvio: Luvio) => {
    return (
        untrusted: unknown,
        clientOptions?: unknown
    ): Promise<Snapshot<RecordRepresentation>> => {
        let config = null;
        if (
            untrustedIsObject<UpdateRecordConfig>(untrusted) &&
            untrustedIsObject(untrusted.fields)
        ) {
            config = validateAdapterConfig(
                { recordId: untrusted.fields.Id, ...untrusted },
                updateRecord_ConfigPropertyNames
            );
        }

        // Invalid or incomplete config
        if (config === null) {
            // eslint-disable-next-line @salesforce/lds/no-error-in-production
            throw new Error('Invalid recordInput');
        }

        const { recordId } = config;
        const headers = getHeaders(clientOptions);

        const resourceParams = createResourceParams({ ...config, ...headers });
        const request = patchUiApiRecordsByRecordId(resourceParams);

        const fieldTrie = BLANK_RECORD_FIELDS_TRIE;
        const optionalFieldTrie = BLANK_RECORD_FIELDS_TRIE;
        const conflictMap: RecordConflictMap = {
            conflicts: {},
            serverRequestCount: 0, // do not count the update request we're about to make
        };
        const recordIngest = createRecordIngest(fieldTrie, optionalFieldTrie, conflictMap);

        return luvio.dispatchResourceRequest<RecordRepresentation>(request).then(
            (response) => {
                const { body } = response;

                const sel = buildSelectionFromRecord(body);
                const key = recordRepresentationKeyBuilder({
                    recordId,
                });

                luvio.storeIngest(key, recordIngest, body);
                resolveConflict(luvio, conflictMap);

                const snapshot = luvio.storeLookup<RecordRepresentation>({
                    recordId: key,
                    node: {
                        kind: 'Fragment',
                        private: [],
                        selections: sel,
                    },
                    variables: {},
                });

                luvio.storeBroadcast();

                return snapshot;
            },
            (err: FetchResponse<{ error: string }>) => {
                deepFreeze(err);
                throw err;
            }
        );
    };
};
