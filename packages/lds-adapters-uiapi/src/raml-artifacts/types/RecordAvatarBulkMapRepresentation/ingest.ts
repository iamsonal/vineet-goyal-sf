import { StoreLink, IngestPath, Luvio, Store } from '@luvio/engine';
import {
    RecordAvatarBulkMapRepresentation,
    validate,
    normalize,
    equals,
    ingest as generatedIngest,
} from '../../../generated/types/RecordAvatarBulkMapRepresentation';
import { createLink } from '../../../generated/types/type-utils';
import { default as helpers_RecordAvatarBulkRepresentation_merge_default } from '../../../helpers/RecordAvatarBulkRepresentation/merge';

export const ingest: typeof generatedIngest = function RecordAvatarBulkMapRepresentationIngest(
    input: RecordAvatarBulkMapRepresentation,
    path: IngestPath,
    luvio: Luvio,
    store: Store,
    timestamp: number
): StoreLink {
    if (process.env.NODE_ENV !== 'production') {
        const validateError = validate(input);
        if (validateError !== null) {
            throw validateError;
        }
    }

    const key = path.fullPath;

    let incomingRecord = normalize(
        input,
        store.records[key],
        {
            fullPath: key,
            parent: path.parent,
        },
        luvio,
        store,
        timestamp
    );
    const existingRecord = store.records[key];

    incomingRecord = helpers_RecordAvatarBulkRepresentation_merge_default(
        existingRecord,
        incomingRecord,
        luvio,
        path
    );

    if (existingRecord === undefined || equals(existingRecord, incomingRecord) === false) {
        luvio.storePublish(key, incomingRecord);
    }

    return createLink(key);
};
