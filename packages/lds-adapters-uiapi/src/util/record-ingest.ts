import { ResourceIngest, IngestPath, LDS, Store, StoreLink } from '@ldsjs/engine';
import {
    RecordRepresentation,
    keyBuilderFromType,
    normalize,
    validate,
    equals,
} from '../overrides/types/RecordRepresentation';
import { createLink } from '../generated/types/type-utils';
import { RecordFieldTrie } from './records';
import merge from '../helpers/RecordRepresentation/merge';
import { RecordConflictMap } from '../helpers/RecordRepresentation/resolveConflict';
// TODO(W-8090378): enable the new normalize implementation
//import { default as helpers_RecordRepresentation_normalize_default } from '../helpers/RecordRepresentation/normalize';

export const createRecordIngest = (
    _fieldsTrie: RecordFieldTrie,
    _optionalFieldsTrie: RecordFieldTrie,
    _recordConflictMap?: RecordConflictMap
): ResourceIngest => {
    return (
        input: RecordRepresentation,
        path: IngestPath,
        lds: LDS,
        store: Store,
        timestamp: number
    ): StoreLink => {
        if (process.env.NODE_ENV !== 'production') {
            const validateError = validate(input);
            if (validateError !== null) {
                throw validateError;
            }
        }

        const key = keyBuilderFromType(input);
        const recordPath = { fullPath: key, parent: path.parent };

        let incomingRecord = normalize(
            // helpers_RecordRepresentation_normalize_default(
            input,
            store.records[key],
            recordPath,
            lds,
            store,
            timestamp
            // fieldsTrie,
            // optionalFieldsTrie,
            // recordConflictMap
        );

        const existingRecord = store.records[key];

        incomingRecord = merge(existingRecord, incomingRecord, lds, path /*, recordConflictMap*/);

        if (existingRecord === undefined || equals(existingRecord, incomingRecord) === false) {
            lds.storePublish(key, incomingRecord);
        }

        lds.storeSetExpiration(key, timestamp + 30000);

        return createLink(key);
    };
};
