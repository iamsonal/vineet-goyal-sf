import { IngestPath, Luvio, Store } from '@luvio/engine';
import {
    resolveConflict,
    RecordConflictMap,
} from '../../../helpers/RecordRepresentation/resolveConflict';
import {
    ingest as generatedIngest,
    RecordRepresentation,
} from '../../../generated/types/RecordRepresentation';
import { createRecordIngest } from '../../../util/record-ingest';
import { BLANK_RECORD_FIELDS_TRIE, RecordFieldTrie } from '../../../util/records';

export const createIngestRecordWithFields: (
    fields: RecordFieldTrie,
    optionalFields: RecordFieldTrie
) => typeof generatedIngest = (fields: RecordFieldTrie, optionalFields: RecordFieldTrie) => {
    return (
        input: RecordRepresentation,
        path: IngestPath,
        luvio: Luvio,
        store: Store,
        timestamp: number
    ) => {
        const conflictMap: RecordConflictMap = {};
        const result = createRecordIngest(fields, optionalFields, conflictMap)(
            input,
            path,
            luvio,
            store,
            timestamp
        );
        resolveConflict(luvio, conflictMap);
        return result;
    };
};

export const ingest: typeof generatedIngest = (
    input: RecordRepresentation,
    path: IngestPath,
    luvio: Luvio,
    store: Store,
    timestamp: number
) => {
    const conflictMap = {};
    const result = createRecordIngest(
        BLANK_RECORD_FIELDS_TRIE,
        BLANK_RECORD_FIELDS_TRIE,
        conflictMap
    )(input, path, luvio, store, timestamp);
    resolveConflict(luvio, conflictMap);
    return result;
};
