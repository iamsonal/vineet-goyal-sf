import { LDS, FetchResponse, Snapshot } from '@salesforce-lds/engine';

import { deepFreeze } from '../../util/deep-freeze';
import { buildSelectionFromRecord } from '../../selectors/record';

import {
    RecordRepresentation,
    keyBuilder as recordRepresentationKeyBuilder,
} from '../../generated/types/RecordRepresentation';
import { RecordInputRepresentation } from '../../generated/types/RecordInputRepresentation';
import postUiApiRecords from '../../generated/resources/postUiApiRecords';

export const factory = (lds: LDS) => {
    return function(config: RecordInputRepresentation): Promise<Snapshot<RecordRepresentation>> {
        const request = postUiApiRecords({
            body: config,
        });

        return lds.dispatchResourceRequest<RecordRepresentation>(request).then(
            response => {
                const { body } = response;

                const selections = buildSelectionFromRecord(body);
                const key = recordRepresentationKeyBuilder({
                    recordId: body.id,
                });

                lds.storeIngest(key, request, body);
                lds.storeBroadcast();

                return lds.storeLookup({
                    recordId: key,
                    node: {
                        kind: 'Fragment',
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
