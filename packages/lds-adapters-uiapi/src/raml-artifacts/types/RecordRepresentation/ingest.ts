import type { IngestPath, Luvio, Store } from '@luvio/engine';
import type { RecordConflictMap } from '../../../helpers/RecordRepresentation/resolveConflict';
import { resolveConflict } from '../../../helpers/RecordRepresentation/resolveConflict';
import type {
    ingest as generatedIngest,
    RecordRepresentation,
} from '../../../generated/types/RecordRepresentation';
import { createRecordIngest } from '../../../util/record-ingest';
import type { RecordFieldTrie } from '../../../util/records';
import { BLANK_RECORD_FIELDS_TRIE } from '../../../util/records';

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
        const conflictMap: RecordConflictMap = {
            conflicts: {},
            serverRequestCount: 0,
        };
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
    const conflictMap = {
        conflicts: {},
        serverRequestCount: 0,
    };
    const result = createRecordIngest(
        BLANK_RECORD_FIELDS_TRIE,
        BLANK_RECORD_FIELDS_TRIE,
        conflictMap
    )(input, path, luvio, store, timestamp);
    resolveConflict(luvio, conflictMap);
    return result;
};
