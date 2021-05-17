import { IngestPath, Luvio, ResourceIngest, Store } from '@luvio/engine';
import { LuvioSelectionCustomFieldNode } from '@salesforce/lds-graphql-parser';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { GqlConnection } from './connection';
import {
    createIngest as selectionCreateIngest,
    getLuvioFieldNodeSelection,
} from '../type/Selection';

interface DefaultRecordFields {
    ApiName: string;
    Id: string;
    WeakEtag: number;
    DisplayValue: string | null;
    RecordTypeId: null | {
        value: string;
    };
    LastModifiedById: {
        value: string;
    };
    LastModifiedDate: {
        value: string;
    };
    SystemModstamp: {
        value: string;
    };
}

export type CustomDataType = GqlRecord | GqlConnection;

export type GqlRecord = DefaultRecordFields & {
    [key: string]:
        | DefaultRecordFields
        | {
              value?: string;
              displayValue?: string;
          };
};

export const CUSTOM_FIELD_NODE_TYPE = 'Record';

function keyBuilder(id: string) {
    return `gql::${CUSTOM_FIELD_NODE_TYPE}::${id}`;
}

function collectObjectFieldSelection<K extends keyof RecordRepresentation['fields']>(
    data: any
): RecordRepresentation['fields'][K] {
    return {
        value: data.value,
        displayValue: data.displayValue,
    };
}

function customTypeIsGqlRecord(
    sel: LuvioSelectionCustomFieldNode,
    _data: CustomDataType
): _data is GqlRecord {
    return sel.type === CUSTOM_FIELD_NODE_TYPE;
}

function formatCustomFieldSelection(sel: LuvioSelectionCustomFieldNode, data: CustomDataType) {
    if (customTypeIsGqlRecord(sel, data)) {
        return {
            displayValue: data.DisplayValue,
            value: convertToRecordRepresentation(sel, data),
        };
    }

    throw new Error(`"${sel.kind}" not implemented for RecordRepresentation conversion`);
}

export function convertToRecordRepresentation(
    ast: LuvioSelectionCustomFieldNode,
    record: GqlRecord
): RecordRepresentation {
    const {
        Id,
        WeakEtag,
        ApiName,
        LastModifiedById,
        LastModifiedDate,
        SystemModstamp,
        RecordTypeId,
    } = record;

    const { luvioSelections } = ast;
    if (luvioSelections === undefined) {
        throw new Error('Undefined selections');
    }

    const fieldsBag: RecordRepresentation['fields'] = {};
    for (let i = 0, len = luvioSelections.length; i < len; i += 1) {
        const sel = getLuvioFieldNodeSelection(luvioSelections[i]);
        const { name } = sel;
        const data = record[name];

        switch (sel.kind) {
            case 'ObjectFieldSelection': {
                fieldsBag[name] = collectObjectFieldSelection(data);
                break;
            }
            case 'CustomFieldSelection': {
                fieldsBag[name] = formatCustomFieldSelection(sel, data as CustomDataType);
                break;
            }
        }
    }

    const rep: RecordRepresentation = {
        apiName: ApiName,
        eTag: '',
        lastModifiedById: LastModifiedById.value,
        lastModifiedDate: LastModifiedDate.value,
        systemModstamp: SystemModstamp.value,
        recordTypeId: RecordTypeId === null ? null : RecordTypeId.value,
        recordTypeInfo: null,
        childRelationships: {},
        id: Id,
        weakEtag: WeakEtag,
        fields: fieldsBag,
    };
    return rep;
}

export const defaultRecordFieldsFragmentName = 'defaultRecordFields';

export const defaultRecordFieldsFragment = `fragment ${defaultRecordFieldsFragmentName} on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }`;

export const createIngest: (ast: LuvioSelectionCustomFieldNode) => ResourceIngest = (
    ast: LuvioSelectionCustomFieldNode
) => {
    return (data: GqlRecord, path: IngestPath, luvio: Luvio, store: Store, timestamp: number) => {
        const { Id } = data;
        const key = keyBuilder(Id);
        const selections = ast.luvioSelections === undefined ? [] : ast.luvioSelections;
        for (let i = 0, len = selections.length; i < len; i += 1) {
            const sel = getLuvioFieldNodeSelection(selections[i]);
            const { name: propertyName } = sel;
            data[propertyName] = selectionCreateIngest(sel)(
                data[propertyName],
                {
                    fullPath: `${key}__${propertyName}`,
                    parent: {
                        data,
                        key,
                        existing: store.records[key],
                    },
                    propertyName,
                },
                luvio,
                store,
                timestamp
            ) as any;
        }

        luvio.storePublish(key, data);

        return {
            __ref: key,
        };
    };
};
