import { LDS, FetchResponse, Snapshot } from '@ldsjs/engine';

import { deepFreeze } from '../../util/deep-freeze';
import { buildSelectionFromRecord } from '../../selectors/record';

import {
    RecordRepresentation,
    keyBuilder as recordRepresentationKeyBuilder,
} from '../../generated/types/RecordRepresentation';
import postUiApiRecords from '../../generated/resources/postUiApiRecords';
import { ingest } from '../../overrides/types/RecordRepresentation';
import { createResourceParams, CreateRecordConfig } from '../../generated/adapters/createRecord';

export const factory = (lds: LDS) => {
    return function(untrustedConfig: unknown): Promise<Snapshot<RecordRepresentation>> {
        const resourceParams = createResourceParams(untrustedConfig as CreateRecordConfig);
        const request = postUiApiRecords(resourceParams);
        return lds.dispatchResourceRequest<RecordRepresentation>(request).then(
            response => {
                const { body } = response;

                const selections = buildSelectionFromRecord(body);
                const key = recordRepresentationKeyBuilder({
                    recordId: body.id,
                });

                lds.storeIngest(key, ingest, body);
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
