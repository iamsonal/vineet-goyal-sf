import { ResourceIngest, IngestPath, Luvio, Store, StoreLink } from '@luvio/engine';
import {
    RecordRepresentation,
    validate,
    equals,
    dynamicNormalize as dynamicNormalize_RecordRepresentation,
} from '../generated/types/RecordRepresentation';
import { ingest as ingest_RecordCollectionRepresentation } from '../generated/types/RecordCollectionRepresentation';
import { keyBuilderFromType } from '../raml-artifacts/types/RecordRepresentation/keyBuilderFromType';
import { createLink } from '../generated/types/type-utils';
import { RecordFieldTrie, BLANK_RECORD_FIELDS_TRIE } from './records';
import merge from '../helpers/RecordRepresentation/merge';
import { RecordConflictMap } from '../helpers/RecordRepresentation/resolveConflict';
import { makeIngest as dynamicIngest_FieldValueRepresentation } from '../raml-artifacts/types/FieldValueRepresentation/ingest';
import { FieldValueRepresentation } from '../generated/types/FieldValueRepresentation';
import { addFieldsToStoreLink } from '../helpers/RecordRepresentation/normalize';

function getChildRecordFieldTrie(parent: RecordFieldTrie, key: string): RecordFieldTrie {
    const value = parent.children[key];

    if (value === undefined) {
        return BLANK_RECORD_FIELDS_TRIE;
    }
    return value;
}

export function createFieldsIngestion(
    fieldsTrie: RecordFieldTrie,
    optionalFieldsTrie: RecordFieldTrie,
    recordConflictMap?: RecordConflictMap
): ResourceIngest {
    return (
        data: FieldValueRepresentation,
        path: IngestPath,
        luvio: Luvio,
        store: Store,
        timestamp: number
    ) => {
        if (process.env.NODE_ENV !== 'production') {
            if (typeof path.propertyName !== 'string') {
                throw new Error(
                    'FieldValueRepresentation should always have a string propertyName value'
                );
            }
        }
        const key = path.propertyName as string;
        const fieldsSubtrie = getChildRecordFieldTrie(fieldsTrie, key);
        const optionalFieldsSubtrie = getChildRecordFieldTrie(optionalFieldsTrie, key);

        const fieldValueLink = dynamicIngest_FieldValueRepresentation(
            fieldsSubtrie,
            optionalFieldsSubtrie,
            recordConflictMap
        )(data, path, luvio, store, timestamp);

        // If a relationship field is null, memorize names of subordinate fields.
        // Spannning fields are specified in the dot notation.
        if (data.value === null) {
            addFieldsToStoreLink(fieldsSubtrie, optionalFieldsSubtrie, fieldValueLink);
        }

        return fieldValueLink;
    };
}

function createChildRecordNormalize(
    fieldsTrie: RecordFieldTrie,
    optionalFieldsTrie: RecordFieldTrie,
    recordConflictMap?: RecordConflictMap
) {
    return dynamicNormalize_RecordRepresentation({
        childRelationships: ingest_RecordCollectionRepresentation,
        fields: createFieldsIngestion(fieldsTrie, optionalFieldsTrie, recordConflictMap),
    });
}

export const createRecordIngest = (
    fieldsTrie: RecordFieldTrie,
    optionalFieldsTrie: RecordFieldTrie,
    recordConflictMap?: RecordConflictMap
): ResourceIngest => {
    const childNormalize = createChildRecordNormalize(
        fieldsTrie,
        optionalFieldsTrie,
        recordConflictMap
    );
    return (
        input: RecordRepresentation,
        path: IngestPath,
        luvio: Luvio,
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
        const recordPath = {
            fullPath: key,
            parent: path.parent,
            propertyName: path.propertyName,
        } as IngestPath;

        let incomingRecord = childNormalize(
            input,
            store.records[key],
            recordPath,
            luvio,
            store,
            timestamp
        );

        const existingRecord = store.records[key];

        incomingRecord = merge(existingRecord, incomingRecord, luvio, path, recordConflictMap);

        if (existingRecord === undefined || equals(existingRecord, incomingRecord) === false) {
            luvio.storePublish(key, incomingRecord);
        }

        luvio.storeSetExpiration(key, timestamp + 30000);
        return createLink(key);
    };
};
