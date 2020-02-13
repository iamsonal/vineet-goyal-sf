/**
 * Represents an sObject from Apex.
 */
export interface ApexSObject {
    [key: string]: null | boolean | number | string | ApexSObject;
}

export interface FieldId {
    objectApiName: string;
    fieldApiName: string;
}
