import { IngestPath, Luvio, Store } from '@luvio/engine';
import {
    FieldValueRepresentationNormalized,
    FieldValueRepresentation,
} from '../../generated/types/FieldValueRepresentation';
import { ingest as RecordRepresentation_ingest } from '../../raml-artifacts/types/RecordRepresentation/ingest';
import { createRecordIngest } from '../../util/record-ingest';
import { RecordFieldTrie } from '../../util/records';
import { RecordConflictMap } from '../RecordRepresentation/resolveConflict';

export default function normalize(
    input: FieldValueRepresentation,
    existing: FieldValueRepresentationNormalized,
    path: IngestPath,
    luvio: Luvio,
    store: Store,
    timestamp: number,
    fieldsTrie?: RecordFieldTrie,
    optionalFieldsTrie?: RecordFieldTrie,
    recordConflictMap?: RecordConflictMap
): FieldValueRepresentationNormalized {
    const input_value = input.value;
    const input_value_id = path.fullPath + '__value';

    if (input_value !== null && typeof input_value === 'object') {
        let ingest;
        if (fieldsTrie && optionalFieldsTrie) {
            ingest = createRecordIngest(fieldsTrie, optionalFieldsTrie, recordConflictMap);
        } else {
            ingest = RecordRepresentation_ingest;
        }
        input.value = ingest(
            input_value,
            {
                fullPath: input_value_id,
                propertyName: 'value',
                parent: {
                    data: input,
                    key: path.fullPath,
                    existing: existing,
                },
            },
            luvio,
            store,
            timestamp
        ) as any;
    }

    return (input as unknown) as FieldValueRepresentationNormalized;
}
