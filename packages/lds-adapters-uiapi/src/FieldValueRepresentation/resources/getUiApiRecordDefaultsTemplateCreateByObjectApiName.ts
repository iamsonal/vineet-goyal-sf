import { IngestPath, Luvio, ResourceIngest, Store } from '@luvio/engine';
import { ingest as objectInfoIngest } from '../../generated/types/ObjectInfoRepresentation';
import { dynamicIngest as dynamicIngest_RecordDefaultsTemplateCreateRepresentation } from '../../generated/types/RecordDefaultsTemplateCreateRepresentation';
import { dynamicIngest as dynamicIngest_RecordTemplateCreateRepresentation } from '../../generated/types/RecordTemplateCreateRepresentation';
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

interface Inputs {
    trackedFields: RecordFieldTrie;
    fields: RecordFieldTrie;
    optionalFields: RecordFieldTrie;
}

export function createFieldsIngest(params: Inputs): ResourceIngest {
    const { fields, optionalFields, trackedFields } = params;
    const recordConflictMap: RecordConflictMap = {};
    const ingest = dynamicIngest_RecordTemplateCreateRepresentation({
        fields: createFieldsIngestion(fields, optionalFields, recordConflictMap),
    });

    return dynamicIngest_RecordDefaultsTemplateCreateRepresentation({
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
