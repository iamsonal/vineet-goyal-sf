export type DataType =
    | 'Boolean'
    | 'String'
    | 'Double'
    | 'Date'
    | 'DateTime'
    | 'Int'
    | 'Reference'
    | 'Picklist'
    | 'Currency'
    | 'MultiPicklist'
    | 'Time'
    | 'Phone'
    | 'Url'
    | 'TextArea'
    | 'Email'
    | 'Percent';

export type FieldInfo = ScalarFieldInfo | ReferenceFieldInfo;

interface BaseFieldInfo {
    dataType: string;
    apiName: string;
}

export interface ScalarFieldInfo extends BaseFieldInfo {
    dataType:
        | 'Boolean'
        | 'String'
        | 'Double'
        | 'Date'
        | 'DateTime'
        | 'Int'
        | 'Picklist'
        | 'Currency'
        | 'MultiPicklist'
        | 'Time'
        | 'Phone'
        | 'Url'
        | 'TextArea'
        | 'Email'
        | 'Percent';
}

export interface ReferenceToInfo {
    apiName: string;
}

export interface ReferenceFieldInfo extends BaseFieldInfo {
    dataType: 'Reference';
    referenceToInfos: ReferenceToInfo[];
    relationshipName: string;
}

export interface RelationshipInfo {
    fieldName: string;
    childObjectApiName: string;
    relationshipName: string;
}

export interface ObjectInfo {
    fields: { [name: string]: FieldInfo };
    childRelationships: { [name: string]: RelationshipInfo };
}

export type ObjectInfoMap = { [name: string]: ObjectInfo };
