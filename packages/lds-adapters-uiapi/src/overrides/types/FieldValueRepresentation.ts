import { StoreLink, IngestPath, LDS, Store } from '@ldsjs/engine';
import {
    FieldValueRepresentationNormalized,
    FieldValueRepresentation,
    validate,
    normalize,
    select,
    equals,
    deepFreeze,
    ingest as generatedIngest,
} from '../../generated/types/FieldValueRepresentation';
import { createLink } from '../../generated/types/type-utils';
import { default as helpers_FieldValueRepresentation_merge_default } from '../../helpers/FieldValueRepresentation/merge';

export {
    FieldValueRepresentationNormalized,
    FieldValueRepresentation,
    validate,
    normalize,
    select,
    equals,
    deepFreeze,
};

export const ingest: typeof generatedIngest = function FieldValueRepresentationIngest(
    input: FieldValueRepresentation,
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

    const key = path.fullPath;

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

    incomingRecord = helpers_FieldValueRepresentation_merge_default(
        existingRecord,
        incomingRecord,
        lds,
        path
    );

    if (existingRecord === undefined || equals(existingRecord, incomingRecord) === false) {
        store.publish(key, incomingRecord);
    }

    return createLink(key);
};
