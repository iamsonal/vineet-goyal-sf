import { IngestPath, LDS, Store } from '@ldsjs/engine';
import { ObjectKeys } from '../../util/language';
import { createLink } from '../../generated/types/type-utils';
import {
    RecordRepresentationNormalized,
    RecordRepresentation,
} from '../../generated/types/RecordRepresentation';
import { ingest as RecordCollectionRepresentation_ingest } from '../../generated/types/RecordCollectionRepresentation';
import { ingest as FieldValueRepresentation_ingest } from '../../overrides/types/FieldValueRepresentation';
import { RecordFieldTrie } from '../../util/records';
import { RecordConflictMap } from './resolveConflict';

export default function normalize(
    input: RecordRepresentation,
    existing: RecordRepresentationNormalized,
    path: IngestPath,
    lds: LDS,
    store: Store,
    timestamp: number,
    fieldsTrie: RecordFieldTrie,
    optionalFieldsTrie: RecordFieldTrie,
    recordConflictMap: RecordConflictMap
): RecordRepresentationNormalized {
    const input_childRelationships = input.childRelationships;
    if (input_childRelationships) {
        const input_childRelationships_id = path.fullPath + '__childRelationships';

        const input_childRelationships_keys = ObjectKeys(input_childRelationships);
        const input_childRelationships_length = input_childRelationships_keys.length;

        for (let i = 0; i < input_childRelationships_length; i++) {
            const key = input_childRelationships_keys[i];
            const input_childRelationships_prop = input_childRelationships[key];
            const input_childRelationships_prop_id = input_childRelationships_id + '__' + key;

            input_childRelationships[key] = RecordCollectionRepresentation_ingest(
                input_childRelationships_prop,
                {
                    fullPath: input_childRelationships_prop_id,
                    parent: {
                        data: input,
                        key: path.fullPath,
                        existing,
                    },
                },
                lds,
                store,
                timestamp
            ) as any;
        }
    }

    const input_fields = input.fields;
    if (input_fields) {
        const input_fields_id = path.fullPath + '__fields';

        const input_fields_keys = ObjectKeys(input_fields);
        const input_fields_length = input_fields_keys.length;

        const missingOptionalFields = ObjectKeys(optionalFieldsTrie.children);

        for (let i = 0; i < input_fields_length; i++) {
            const key = input_fields_keys[i];
            const input_fields_prop = input_fields[key];
            const input_fields_prop_id = input_fields_id + '__' + key;

            // Gets the “child” fieldsTrie and optionalFieldsTrie for the current spanning record.
            const fieldsSubtrie = fieldsTrie.children[key];
            const optionalFieldsSubtrie = optionalFieldsTrie.children[key];

            // Creates a link by calling FieldValueRepresentation ingest.
            // Pass child fieldsTrie, optionalFieldsTrie and recordConflictMap.
            const fieldValueLink = FieldValueRepresentation_ingest(
                input_fields_prop,
                {
                    fullPath: input_fields_prop_id,
                    parent: {
                        data: input,
                        key: path.fullPath,
                        existing,
                    },
                },
                lds,
                store,
                timestamp,
                fieldsSubtrie,
                optionalFieldsSubtrie,
                recordConflictMap
            ) as any;

            // If the field is null, adds data.fields to the field’s link
            if ((input_fields_prop === null || input_fields_prop.value === null) && fieldsSubtrie) {
                const fields = ObjectKeys(fieldsSubtrie.children);
                if (fields) {
                    fieldValueLink.data = {
                        fields,
                    };
                }
            }

            // Inserts link into the normalized fields map
            input_fields[key] = fieldValueLink;

            // If field name exists in optionalFieldsTrie, remove field name from missingOptionalFields.
            const index = missingOptionalFields.indexOf(key);
            if (index !== -1) {
                missingOptionalFields.splice(index, 1);
            }
        }

        // Create missing links for all field names still present in missingOptionalFields
        for (let i = 0; i < missingOptionalFields.length; i++) {
            const fieldName = missingOptionalFields[i];
            const input_fields_prop_id = input_fields_id + '__' + fieldName;
            const link = createLink(input_fields_prop_id) as any;
            link.isMissing = true;
            input_fields[fieldName] = link;
        }
    }

    return (input as unknown) as RecordRepresentationNormalized;
}
