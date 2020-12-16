import { ingest as objectInfoIngest } from '../../generated/types/ObjectInfoRepresentation';
import {
    RecordConflictMap,
    resolveConflict,
} from '../../helpers/RecordRepresentation/resolveConflict';
import { createFieldsIngestion } from '../../util/record-ingest';
import {
    convertTrieToFields,
    markMissingOptionalFields,
    RecordFieldTrie,
    RecordRepresentationLike,
    RecordRepresentationLikeNormalized,
} from '../../util/records';
import { dynamicIngest as dynamicIngest_RecordTemplateCloneRepresentation } from '../../generated/types/RecordTemplateCloneRepresentation';
import { dynamicIngest as dynamicIngest_RecordDefaultsTemplateCloneRepresentation } from '../../generated/types/RecordDefaultsTemplateCloneRepresentation';
import { IngestPath, Luvio, ResourceIngest, Store } from '@luvio/engine';

interface Inputs {
    trackedFields: RecordFieldTrie;
    fields: RecordFieldTrie;
    optionalFields: RecordFieldTrie;
}

export function createFieldsIngest(params: Inputs): ResourceIngest {
    const { fields, optionalFields, trackedFields } = params;
    const recordConflictMap: RecordConflictMap = {};
    const ingest = dynamicIngest_RecordTemplateCloneRepresentation({
        fields: createFieldsIngestion(fields, optionalFields, recordConflictMap),
    });

    return dynamicIngest_RecordDefaultsTemplateCloneRepresentation({
        objectInfos: objectInfoIngest,
        record: (
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
        },
    });
}
