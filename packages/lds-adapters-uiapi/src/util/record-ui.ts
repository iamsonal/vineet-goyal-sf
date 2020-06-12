import { ObjectKeys } from './language';
import { RecordRepresentation } from '../generated/types/RecordRepresentation';
import { ObjectInfoRepresentation } from '../generated/types/ObjectInfoRepresentation';
import { RecordUiRepresentation } from '../generated/types/RecordUiRepresentation';
import { getNameField } from './layouts';

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

        // Include the Id field. Ex: Opportunity.Account.Id, Opportunity.relation1__r.Id
        const idFieldName = `${apiName}.${relationshipName}.Id`;
        lookupFields[idFieldName] = true;
        const nameField = `${apiName}.${relationshipName}.${getNameField(objectInfo, fieldName)}`;
        lookupFields[nameField] = true;
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
