import { StoreLink, IngestPath, LDS, Store } from '@ldsjs/engine';
import {
    RecordRepresentationNormalized,
    RecordRepresentation,
    TTL,
    validate,
    KeyParams,
    keyBuilder,
    normalize,
    select,
    equals,
    deepFreeze,
    ingest as generatedIngest,
} from '../../generated/types/RecordRepresentation';
import { createLink } from '../../generated/types/type-utils';
import { default as helpers_RecordRepresentation_polymorph_default } from '../../helpers/RecordRepresentation/polymorph';
import { default as helpers_RecordRepresentation_merge_default } from '../../helpers/RecordRepresentation/merge';

export {
    RecordRepresentationNormalized,
    RecordRepresentation,
    TTL,
    validate,
    KeyParams,
    keyBuilder,
    normalize,
    select,
    equals,
    deepFreeze,
};

export const ingest: typeof generatedIngest = function RecordRepresentationIngest(
    input: RecordRepresentation,
    path: IngestPath,
    lds: LDS,
    store: Store,
    timestamp: number
): StoreLink {
    if (process.env.NODE_ENV !== 'production') {
        const validateError = validate(input);
        if (validateError !== null) {
            throw validateError;
        }
    }

    const key = helpers_RecordRepresentation_polymorph_default(input);

    let incomingRecord = normalize(
        input,
        store.records[key],
        {
            fullPath: key,
            parent: path.parent,
        },
        lds,
        store,
        timestamp
    );
    const existingRecord = store.records[key];

    incomingRecord = helpers_RecordRepresentation_merge_default(
        existingRecord,
        incomingRecord,
        lds,
        path
    );

    if (existingRecord === undefined || equals(existingRecord, incomingRecord) === false) {
        store.publish(key, incomingRecord);
    }

    store.setExpiration(key, timestamp + 30000);

    return createLink(key);
};
