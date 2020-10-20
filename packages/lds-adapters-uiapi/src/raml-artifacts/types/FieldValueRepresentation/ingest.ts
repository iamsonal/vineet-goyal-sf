import { IngestPath, LDS, Store, StoreLink } from '@ldsjs/engine';
import {
    equals,
    FieldValueRepresentation,
    validate,
} from '../../../generated/types/FieldValueRepresentation';
import { createLink } from '../../../generated/types/type-utils';
import { default as helpers_FieldValueRepresentation_merge_default } from '../../../helpers/FieldValueRepresentation/merge';
import { default as helpers_FieldValueRepresentation_normalize_default } from '../../../helpers/FieldValueRepresentation/normalize';
import { RecordConflictMap } from '../../../helpers/RecordRepresentation/resolveConflict';
import { RecordFieldTrie } from '../../../util/records';

export function ingest(
    input: FieldValueRepresentation,
    path: IngestPath,
    lds: LDS,
    store: Store,
    timestamp: number,
    fieldsTrie?: RecordFieldTrie,
    optionalFieldsTrie?: RecordFieldTrie,
    recordConflictMap?: RecordConflictMap
): StoreLink {
    if (process.env.NODE_ENV !== 'production') {
        const validateError = validate(input);
        if (validateError !== null) {
            throw validateError;
        }
    }

    const key = path.fullPath;

    let incomingRecord = helpers_FieldValueRepresentation_normalize_default(
        input,
        store.records[key],
        {
            fullPath: key,
            parent: path.parent,
        },
        lds,
        store,
        timestamp,
        fieldsTrie,
        optionalFieldsTrie,
        recordConflictMap
    );
    const existingRecord = store.records[key];

    incomingRecord = helpers_FieldValueRepresentation_merge_default(
        existingRecord,
        incomingRecord,
        lds,
        path
    );

    if (existingRecord === undefined || equals(existingRecord, incomingRecord) === false) {
        lds.storePublish(key, incomingRecord);
    }

    return createLink(key);
}
