import { IngestPath, Luvio, ResourceIngest, Store } from '@luvio/engine';
import { LuvioSelectionCustomFieldNode } from '@salesforce/lds-graphql-parser';
import {
    createIngest as createSelectionIngest,
    getLuvioFieldNodeSelection,
} from '../type/Selection';

interface DefaultRecordFields {
    id: string;
    WeakEtag: number;
}

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

export const defaultRecordFieldsFragmentName = 'defaultRecordFields';

export const defaultRecordFieldsFragment = `fragment ${defaultRecordFieldsFragmentName} on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }`;

export const createIngest: (ast: LuvioSelectionCustomFieldNode) => ResourceIngest = (
    ast: LuvioSelectionCustomFieldNode
) => {
    return (data: GqlRecord, path: IngestPath, luvio: Luvio, store: Store, timestamp: number) => {
        const { id } = data;
        const key = keyBuilder(id);
        const selections = ast.luvioSelections === undefined ? [] : ast.luvioSelections;
        for (let i = 0, len = selections.length; i < len; i += 1) {
            const sel = getLuvioFieldNodeSelection(selections[i]);
            const { name: propertyName } = sel;
            data[propertyName] = createSelectionIngest(sel)(
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
