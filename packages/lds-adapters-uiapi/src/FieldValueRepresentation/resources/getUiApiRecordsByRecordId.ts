import { IngestPath, Luvio, ResourceIngest, Store } from '@luvio/engine';
import {
    RecordConflictMap,
    resolveConflict,
} from '../../helpers/RecordRepresentation/resolveConflict';
import { createRecordIngest } from '../../util/record-ingest';
import {
    convertTrieToFields,
    markMissingOptionalFields,
    RecordFieldTrie,
    RecordRepresentationLike,
    RecordRepresentationLikeNormalized,
} from '../../util/records';

interface Inputs {
    trackedFields: RecordFieldTrie;
    fields: RecordFieldTrie;
    optionalFields: RecordFieldTrie;
}

export function createFieldsIngest(params: Inputs): ResourceIngest {
    const { fields, optionalFields, trackedFields } = params;
    const recordConflictMap: RecordConflictMap = {};
    const ingest = createRecordIngest(fields, optionalFields, recordConflictMap);

    return (
        data: RecordRepresentationLike,
        path: IngestPath,
        luvio: Luvio,
        store: Store,
        timestamp: number
    ) => {
        const link = ingest(data, path, luvio, store, timestamp);
        resolveConflict(luvio, recordConflictMap);
        const recordNode = luvio.getNode<
            RecordRepresentationLikeNormalized,
            RecordRepresentationLike
        >(link.__ref!);
        markMissingOptionalFields(recordNode, convertTrieToFields(trackedFields));
        return link;
    };
}
