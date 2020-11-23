import { IngestPath, Luvio, Store, StoreLink } from '@luvio/engine';
import { ArrayPrototypePush, ObjectKeys } from '../../util/language';
import {
    RecordRepresentationNormalized,
    RecordRepresentation,
} from '../../generated/types/RecordRepresentation';
import { ingest as RecordCollectionRepresentation_ingest } from '../../generated/types/RecordCollectionRepresentation';
import { ingest as FieldValueRepresentation_ingest } from '../../raml-artifacts/types/FieldValueRepresentation/ingest';
import { BLANK_RECORD_FIELDS_TRIE, RecordFieldTrie } from '../../util/records';
import { RecordConflictMap } from './resolveConflict';
import { convertTrieToFields } from '../../util/records';
import { dedupe } from '../../validation/utils';

export default function normalize(
    input: RecordRepresentation,
    existing: RecordRepresentationNormalized,
    path: IngestPath,
    lds: Luvio,
    store: Store,
    timestamp: number,
    fieldsTrie: RecordFieldTrie,
    optionalFieldsTrie: RecordFieldTrie,
    recordConflictMap?: RecordConflictMap
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

        for (let i = 0; i < input_fields_length; i++) {
            const key = input_fields_keys[i];
            const input_fields_prop = input_fields[key];
            const input_fields_prop_id = input_fields_id + '__' + key;

            // Gets the “child” fieldsTrie and optionalFieldsTrie for the current spanning record.
            const fieldsSubtrie = fieldsTrie.children[key] || BLANK_RECORD_FIELDS_TRIE;
            const optionalFieldsSubtrie =
                optionalFieldsTrie.children[key] || BLANK_RECORD_FIELDS_TRIE;

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

            // If a relationship field is null, memorize names of subordinate fields.
            // Spannning fields fields are specified in the dot notation.
            if (input_fields_prop === null || input_fields_prop.value === null) {
                addFieldsToStoreLink(fieldsSubtrie, optionalFieldsSubtrie, fieldValueLink);
            }

            // Inserts link into the normalized fields map
            input_fields[key] = fieldValueLink;
        }
    }

    return (input as unknown) as RecordRepresentationNormalized;
}

/**
 * Adds fields listed in the two trie parameters into the store link.
 * Functionally analogous to markNulledOutRequiredFields.
 * @param fieldsTrie
 * @param optionalFieldsTrie
 * @param storeLink
 */
function addFieldsToStoreLink(
    fieldsTrie: RecordFieldTrie,
    optionalFieldsTrie: RecordFieldTrie,
    storeLink: StoreLink
) {
    let fields: string[] = [];
    const fieldSubtries = [] as RecordFieldTrie[];
    if (fieldsTrie) {
        ArrayPrototypePush.call(fieldSubtries, fieldsTrie);
    }
    if (optionalFieldsTrie) {
        ArrayPrototypePush.call(fieldSubtries, optionalFieldsTrie);
    }
    for (let i = 0; i < fieldSubtries.length; i++) {
        const subtrie = fieldSubtries[i];
        const fieldNames = ObjectKeys(subtrie.children);
        for (let i = 0; i < fieldNames.length; i++) {
            const fieldName = fieldNames[i];
            const childTrie = subtrie.children[fieldName];
            if (childTrie) {
                fields = [...fields, ...convertTrieToFields(childTrie)];
            }
        }
    }
    fields = dedupe(fields);
    if (fields.length > 0) {
        storeLink.data = {
            fields,
        };
    }
}
