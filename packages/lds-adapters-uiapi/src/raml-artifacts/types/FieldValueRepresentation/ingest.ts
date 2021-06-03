import { IngestPath, Luvio, ResourceIngest, Store } from '@luvio/engine';
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

export function makeIngest(
    fieldsTrie: RecordFieldTrie,
    optionalFieldsTrie: RecordFieldTrie,
    recordConflictMap?: RecordConflictMap
): ResourceIngest {
    return (
        input: FieldValueRepresentation,
        path: IngestPath,
        luvio: Luvio,
        store: Store,
        timestamp: number
    ) => {
        if (process.env.NODE_ENV !== 'production') {
            const validateError = validate(input);
            if (validateError !== null) {
                throw validateError;
            }
        }

        const key = path.fullPath;

        let existingRecord = store.records[key];
        // do not ingest locked records
        if (existingRecord !== undefined && existingRecord.__type === 'locked') {
            path.state.result.type = 'locked';
            return createLink(key);
        }

        let incomingRecord = helpers_FieldValueRepresentation_normalize_default(
            input,
            store.records[key],
            {
                fullPath: key,
                parent: path.parent,
                propertyName: path.propertyName,
                state: path.state,
            } as IngestPath,
            luvio,
            store,
            timestamp,
            fieldsTrie,
            optionalFieldsTrie,
            recordConflictMap
        );

        // read again after children ingested in case of a circular ref
        existingRecord = store.records[key];

        incomingRecord = helpers_FieldValueRepresentation_merge_default(
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
}
