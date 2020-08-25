import { LDS, Snapshot, FetchResponse } from '@ldsjs/engine';

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
} from '../../generated/adapters/updateRecord';
import patchUiApiRecordsByRecordId from '../../generated/resources/patchUiApiRecordsByRecordId';
import { untrustedIsObject } from '../../generated/adapters/adapter-utils';

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

export const factory = (lds: LDS) => {
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
            throw new Error('Invalid recordInput');
        }

        const { recordId } = config;
        const headers = getHeaders(clientOptions);

        const request = patchUiApiRecordsByRecordId({
            urlParams: {
                recordId,
            },
            body: {
                apiName: config.apiName,
                fields: config.fields,
                allowSaveOnDuplicate: config.allowSaveOnDuplicate,
            },
            headers,
        });

        return lds.dispatchResourceRequest<RecordRepresentation>(request).then(
            response => {
                const { body } = response;

                const sel = buildSelectionFromRecord(body);
                const key = recordRepresentationKeyBuilder({
                    recordId,
                });

                lds.storeIngest(key, request.ingest, body);
                lds.storeBroadcast();

                return lds.storeLookup<RecordRepresentation>({
                    recordId: key,
                    node: {
                        kind: 'Fragment',
                        private: [],
                        selections: sel,
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
