import type { RecordLayoutRepresentation } from '../generated/types/RecordLayoutRepresentation';
import type { ObjectInfoRepresentation } from '../generated/types/ObjectInfoRepresentation';

const FIELD_ID = 'Id';
const FIELD_NAME = 'Name';
const COMPONENT_TYPE_FIELD = 'Field';

function isFieldAReferenceWithRelationshipName(
    objectInfo: ObjectInfoRepresentation,
    fieldApiName: string
): boolean {
    const field = objectInfo.fields[fieldApiName];
    if (field === undefined) {
        return false;
    }

    // eslint-disable-next-line @salesforce/lds/no-invalid-todo
    // TODO - can reference===true and relationshipName===null?
    return field.reference === true && field.relationshipName !== null;
}

function getRelationshipName(objectInfo: ObjectInfoRepresentation, fieldApiName: string): string {
    // eslint-disable-next-line @salesforce/lds/no-invalid-todo
    // TODO RAML - fix typing so isFieldAReferenceWithRelationshipName enables calling this without `relationshipName!`
    return objectInfo.fields[fieldApiName].relationshipName!;
}

export function getNameField(objectInfo: ObjectInfoRepresentation, fieldApiName: string): string {
    // eslint-disable-next-line @salesforce/lds/no-invalid-todo
    // TODO - this logic is adopted from lds222. It searches
    // ObjectInfoRep.ReferenceToInfoRep[].nameFields[]:
    // 1. If any of the arrays are empty returns `Name`
    // 2. If `Name` is found in any array position then returns it
    // 2. Else returns ObjectInfoRep.ReferenceToInfoRep[0].nameFields[0]
    // Rationale for this is unclear and needs clarification.

    const referenceToInfos = objectInfo.fields[fieldApiName].referenceToInfos;
    if (referenceToInfos.length < 1) {
        return FIELD_NAME;
    }
    const firstReferenceNameFields = referenceToInfos[0].nameFields;
    if (firstReferenceNameFields.length < 1) {
        return FIELD_NAME;
    }

    for (let a = 0, alen = referenceToInfos.length; a < alen; a++) {
        const nameFields = referenceToInfos[a].nameFields;
        for (let b = 0, blen = nameFields.length; b < blen; b++) {
            const nameField = nameFields[b];
            if (nameField === FIELD_NAME) {
                return nameField;
            }
        }
    }

    return firstReferenceNameFields[0];
}

export function getQualifiedFieldApiNamesFromLayout(
    layout: RecordLayoutRepresentation,
    objectInfo: ObjectInfoRepresentation
): string[] {
    const qualifiedFieldNames: string[] = [];
    for (let a = 0, alen = layout.sections.length; a < alen; a++) {
        const section = layout.sections[a];
        for (let b = 0, blen = section.layoutRows.length; b < blen; b++) {
            const row = section.layoutRows[b];
            for (let c = 0, clen = row.layoutItems.length; c < clen; c++) {
                const item = row.layoutItems[c];
                for (let d = 0, dlen = item.layoutComponents.length; d < dlen; d++) {
                    const component = item.layoutComponents[d];
                    const { apiName } = component;
                    if (apiName && component.componentType === COMPONENT_TYPE_FIELD) {
                        if (isFieldAReferenceWithRelationshipName(objectInfo, apiName)) {
                            const relationshipFieldApiName = getRelationshipName(
                                objectInfo,
                                apiName
                            );
                            // By default, include the "Id" field on spanning records that are on the layout.
                            qualifiedFieldNames.push(
                                `${objectInfo.apiName}.${relationshipFieldApiName}.${FIELD_ID}`
                            );

                            const nameField = getNameField(objectInfo, apiName);

                            qualifiedFieldNames.push(
                                `${objectInfo.apiName}.${relationshipFieldApiName}.${nameField}`
                            );
                        }
                        qualifiedFieldNames.push(`${objectInfo.apiName}.${component.apiName}`);
                    }
                }
            }
        }
    }

    return qualifiedFieldNames;
}
