export type DataType =
    | 'Boolean'
    | 'String'
    | 'Double'
    | 'Int'
    | 'Id'
    | 'Time'
    | 'Date'
    | 'DateTime';

export type FieldInfo = ScalarFieldInfo | ReferenceFieldInfo;

interface BaseFieldInfo {
    fieldType: string;
    apiName: string;
}

export interface ScalarFieldInfo extends BaseFieldInfo {
    fieldType: 'Scalar';
    dataType: DataType;
}

export interface ReferenceFieldInfo extends BaseFieldInfo {
    fieldType: 'Reference';
    referenceToaApiName: string;
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
