import type {
    FieldValueRepresentationNormalized,
    ObjectInfoRepresentation,
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '@salesforce/lds-adapters-uiapi';
import { keyBuilderRecord } from '@salesforce/lds-adapters-uiapi';
import type { ResourceRequest } from '@luvio/engine';
import type { DraftAction } from '../DraftQueue';
import { ObjectAssign, ObjectKeys } from './language';
import type { DraftRepresentation, ScalarFieldRepresentationValue } from './records';
import { createLink } from './records';
import { buildRecordFieldStoreKey } from '@salesforce/lds-uiapi-record-utils';

export interface DraftRecordRepresentationNormalized extends RecordRepresentationNormalized {
    drafts?: DraftRepresentation;
}

type RecordWithDraftsResult = Record<
    string,
    DraftRecordRepresentationNormalized | FieldValueRepresentationNormalized
>;

const DEFAULT_FIELD_LAST_MODIFIED_BY_ID = 'LastModifiedById';
const DEFAULT_FIELD_LAST_MODIFIED_DATE = 'LastModifiedDate';

/**
 * Applies a set of drafts to a normalized record and it's normalized fields
 * @param recordKey The record store key
 * @param record The normalized record
 * @param originalFields A set of normalized field values that the normalized record links to
 * @param drafts An array of draft actions that are applied to the record
 * @param objectInfo The object info for the record
 * @param userId The logged in user id
 * @returns A normalized set of record and fields that now contain draft changes
 */
export function applyDrafts(
    recordKey: string,
    record: RecordRepresentationNormalized,
    originalFields: Record<string, FieldValueRepresentationNormalized>,
    drafts: DraftAction<RecordRepresentation, ResourceRequest>[],
    objectInfo: ObjectInfoRepresentation,
    userId: string
): RecordWithDraftsResult {
    const result: RecordWithDraftsResult = {};
    ObjectAssign(result, { [recordKey]: record }, originalFields);

    if (drafts.length === 0) {
        return result;
    }

    // if drafts are already applied to the record, restore the original server values
    // prior to replaying drafts so the original values are preserved
    if ((record as DraftRecordRepresentationNormalized).drafts !== undefined) {
        restoreServerValues(recordKey, record, originalFields);
    }

    const recordWithDrafts: DraftRecordRepresentationNormalized = { ...record };
    result[recordKey] = recordWithDrafts;

    const draftNode = {
        created: false,
        edited: false,
        deleted: false,
        serverValues: {} as Record<string, ScalarFieldRepresentationValue>,
        draftActionIds: [] as string[],
        latestDraftActionId: '',
    };

    for (const draft of drafts) {
        draftNode.draftActionIds.push(draft.id);
        draftNode.latestDraftActionId = draft.id;

        if (draft.data.method.toLowerCase() === 'post') {
            draftNode.created = true;
        } else if (draft.data.method.toLowerCase() === 'delete') {
            draftNode.deleted = true;
        } else if (draft.data.method.toLowerCase() === 'patch') {
            draftNode.edited = true;
            const fields = draft.data.body.fields;
            const fieldNames = ObjectKeys(fields);
            for (const fieldName of fieldNames) {
                const fieldKey = buildRecordFieldStoreKey(recordKey, fieldName);
                const field = originalFields[fieldKey];

                if (
                    field !== undefined &&
                    recordWithDrafts.fields[fieldName] !== undefined &&
                    draftNode.serverValues[fieldName] === undefined
                ) {
                    draftNode.serverValues[fieldName] = {
                        ...field,
                    } as ScalarFieldRepresentationValue;
                }

                const fieldResult = applyDraftToField(
                    recordKey,
                    recordWithDrafts,
                    fieldKey,
                    fieldName,
                    draft,
                    objectInfo
                );

                ObjectAssign(result, fieldResult);
            }

            const lastModifiedDate = new Date(draft.timestamp).toISOString();
            recordWithDrafts.lastModifiedById = userId;
            recordWithDrafts.lastModifiedDate = lastModifiedDate;

            const lastModifiedByIdKey = buildRecordFieldStoreKey(
                recordKey,
                DEFAULT_FIELD_LAST_MODIFIED_BY_ID
            );
            const lastModifiedDateKey = buildRecordFieldStoreKey(
                recordKey,
                DEFAULT_FIELD_LAST_MODIFIED_DATE
            );

            result[lastModifiedByIdKey] = {
                value: userId,
                displayValue: userId,
            };

            result[lastModifiedDateKey] = {
                value: lastModifiedDate,
                displayValue: lastModifiedDate,
            };

            recordWithDrafts.fields[DEFAULT_FIELD_LAST_MODIFIED_BY_ID] = {
                __ref: lastModifiedByIdKey,
            };
            recordWithDrafts.fields[DEFAULT_FIELD_LAST_MODIFIED_DATE] = {
                __ref: lastModifiedDateKey,
            };
        }
    }

    recordWithDrafts.drafts = draftNode;

    return result;
}

/**
 * Applies a draft change to a normalized record field.
 * @returns a set of normalized record fields, this may contain more than one field
 * in the event that a there was a field relationship change
 */
function applyDraftToField(
    recordKey: string,
    record: DraftRecordRepresentationNormalized,
    fieldKey: string,
    fieldName: string,
    draft: DraftAction<RecordRepresentation, ResourceRequest>,
    objectInfo: ObjectInfoRepresentation
): Record<string, FieldValueRepresentationNormalized> {
    const result: Record<string, FieldValueRepresentationNormalized> = {};

    let objectInfoFieldRep = objectInfo.fields[fieldName];

    let isRelationship = false;
    let dataType = '';
    let relationshipName: string = '';
    if (objectInfoFieldRep !== undefined) {
        dataType = objectInfoFieldRep.dataType;
        relationshipName = objectInfoFieldRep.relationshipName as string;
        isRelationship = dataType === 'Reference' && relationshipName !== null;
    }

    const draftValue = draft.data.body.fields[fieldName];
    if (draftValue !== undefined) {
        const draftField = {
            value: draftValue,
            displayValue: formatDisplayValue(draftValue),
        };

        if (isRelationship) {
            const relationshipKey = buildRecordFieldStoreKey(recordKey, relationshipName);
            // update the relationship field
            record.fields[relationshipName] = createLink(relationshipKey);

            const key = keyBuilderRecord({ recordId: draftValue });
            const link = createLink(key);

            result[relationshipKey] = {
                value: link,
                displayValue: null,
            };
        }
        result[fieldKey] = draftField;
    }

    return result;
}

/**
 * Formats the display value for a draft field
 * @param value the value to format
 */
function formatDisplayValue(value: boolean | number | string | null) {
    // TODO [W-7919614]: This method should properly format displayValues for FieldValueRepresentations
    return value === null ? null : value.toString();
}

/**
 * Restores the normalize field original server values
 * @param recordKey The record key
 * @param record The record - note the record will be mutated to remove the draft node
 * @param fields The normalized fields that the record links to
 * @returns
 */
function restoreServerValues(
    recordKey: string,
    record: DraftRecordRepresentationNormalized,
    fields: Record<string, FieldValueRepresentationNormalized>
) {
    if (record.drafts === undefined) {
        return;
    }

    const serverValues = record.drafts.serverValues;
    const fieldNames = ObjectKeys(serverValues);
    for (const fieldName of fieldNames) {
        const fieldKey = buildRecordFieldStoreKey(recordKey, fieldName);
        const field = fields[fieldKey];

        if (field !== undefined) {
            const serverValue = serverValues[fieldName];
            field.value = serverValue.value;
            field.displayValue = serverValue.displayValue;
        }
    }

    delete record.drafts;
}
