import { ObjectKeys } from './language';
import { RecordRepresentation } from '../generated/types/RecordRepresentation';
import { ObjectInfoRepresentation } from '../generated/types/ObjectInfoRepresentation';
import { RecordUiRepresentation } from '../generated/types/RecordUiRepresentation';

function getMissingRecordLookupFields(
    record: RecordRepresentation,
    objectInfo: ObjectInfoRepresentation
): string[] {
    const lookupFields: { [key: string]: true } = {};
    const { apiName, fields: recordFields } = record;
    const { fields: objectInfoFields } = objectInfo;
    const objectInfoFieldNames = ObjectKeys(objectInfoFields);

    for (let i = 0, len = objectInfoFieldNames.length; i < len; i += 1) {
        const fieldName = objectInfoFieldNames[i];
        const field = objectInfoFields[fieldName];
        const { relationshipName } = field;

        if (relationshipName === null) {
            continue;
        }

        const recordFieldValue = recordFields[relationshipName];

        // Only interested in record fields that are present and that are null
        if (recordFieldValue === undefined || recordFieldValue.value !== null) {
            continue;
        }

        const { referenceToInfos } = field;
        for (let r = 0, referenceLen = referenceToInfos.length; r < referenceLen; r += 1) {
            const referenceToInfo = referenceToInfos[r];
            // Include the Id field. Ex: Opportunity.Account.Id, Opportunity.relation1__r.Id
            const idFieldName = `${apiName}.${relationshipName}.Id`;
            lookupFields[idFieldName] = true;

            const { nameFields } = referenceToInfo;
            // Include all name fields so UIAPI populates the displayValue. Ex: Account.Owner.FirstName, Account.Owner.LastName. Or Account.custom__r.Name.
            for (let n = 0, nameFieldsLen = nameFields.length; n < nameFieldsLen; n += 1) {
                const nameField = nameFields[n];
                const nameFieldName = `${apiName}.${relationshipName}.${nameField}`;
                lookupFields[nameFieldName] = true;
            }
        }
    }

    return ObjectKeys(lookupFields);
}

export function getRecordUiMissingRecordLookupFields(
    recordUi: RecordUiRepresentation
): { [key: string]: string[] } {
    const { records, objectInfos } = recordUi;
    const recordLookupFields: { [key: string]: string[] } = {};
    const recordIds = ObjectKeys(records);

    for (let i = 0, len = recordIds.length; i < len; i += 1) {
        const recordId = recordIds[i];
        const recordData = records[recordId];
        const { apiName } = recordData;
        const objectInfo = objectInfos[apiName];
        recordLookupFields[recordId] = getMissingRecordLookupFields(recordData, objectInfo);
    }

    return recordLookupFields;
}
