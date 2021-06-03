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
    const existingRecord = store.records[key];
    // do not ingest locked records
    if (existingRecord !== undefined && existingRecord.__type === 'locked') {
        path.state.result.type = 'locked';
        return createLink(key);
    }

    let incomingRecord = normalize(
        input,
        store.records[key],
        {
            fullPath: key,
            propertyName: path.propertyName,
            parent: path.parent,
            state: path.state,
        } as IngestPath,
        luvio,
        store,
        timestamp
    );

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
