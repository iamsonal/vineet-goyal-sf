import {
    IngestPath,
    Luvio,
    Reader,
    ReaderFragment,
    ResourceIngest,
    Store,
    StoreLink,
} from '@luvio/engine';
import {
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
} from '@salesforce/lds-graphql-parser';
import {
    RecordRepresentation,
    ingestRecord,
    RecordRepresentationNormalized,
    FieldValueRepresentationNormalized,
    FieldValueRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { GqlConnection } from './connection';
import { getLuvioFieldNodeSelection, resolveLink } from '../type/Selection';

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

interface GqlRecordField {
    value?: string;
    displayValue?: string;
}

export type GqlRecord = DefaultRecordFields & {
    [key: string]: DefaultRecordFields | GqlRecordField;
};

export const CUSTOM_FIELD_NODE_TYPE = 'Record';

function collectObjectFieldSelection(data: GqlRecordField): FieldValueRepresentation {
    return {
        value: data.value as string,
        displayValue: data.displayValue as string,
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
                fieldsBag[name] = collectObjectFieldSelection(data as GqlRecordField);
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
        const recordRep = convertToRecordRepresentation(ast, data);
        return ingestRecord(recordRep, path, luvio, store, timestamp);
    };
};

interface RecordDenormalizationState {
    source: RecordRepresentationNormalized;
    sink: Partial<GqlRecord>;
    parentFieldValue?: FieldValueRepresentationNormalized;
}

const recordProperties: Record<keyof GqlRecord, { propertyName: keyof RecordRepresentation }> = {
    Id: {
        propertyName: 'id',
    },
    ApiName: {
        propertyName: 'apiName',
    },
};

function getNonSpanningField(
    sel: LuvioSelectionObjectFieldNode,
    builder: Reader<any>,
    source: any
) {
    const sink: GqlRecordField = {};
    const { luvioSelections } = sel;
    if (luvioSelections === undefined) {
        throw new Error('Empty selections not supported');
    }
    for (let i = 0, len = luvioSelections.length; i < len; i += 1) {
        const sel = getLuvioFieldNodeSelection(luvioSelections[i]);
        const { kind } = sel;
        const name = sel.name as keyof GqlRecordField;
        builder.enterPath(name);
        if (kind !== 'ScalarFieldSelection') {
            throw new Error(`Unexpected kind "${kind}"`);
        }
        sink[name] = source[name] as any;
        builder.exitPath();
    }

    return sink;
}

function getCustomSelection(
    selection: LuvioSelectionCustomFieldNode,
    builder: Reader<any>,
    options: RecordRepresentationReadOptions
) {
    const { type } = selection;
    switch (type) {
        case 'Record':
            return readRecordRepresentation(selection, builder, options);
    }
}

function getScalarValue(selectionName: string, state: RecordDenormalizationState) {
    if (selectionName === 'DisplayValue') {
        const { parentFieldValue } = state;
        if (parentFieldValue === undefined) {
            throw new Error('Unable to calculate DisplayValue');
        }
        return parentFieldValue.displayValue;
    }

    const assignment = recordProperties[selectionName];
    if (assignment === undefined) {
        throw new Error(
            `Unknown assignment for ScalarFieldSelection at property "${selectionName}"`
        );
    }
    return state.source[assignment.propertyName] as any;
}

function assignSelection(
    selection: LuvioSelectionNode,
    builder: Reader<any>,
    state: RecordDenormalizationState
) {
    const sel = getLuvioFieldNodeSelection(selection);
    const { name: selectionName, kind } = sel;
    const { source, sink } = state;
    const { fields } = source;
    builder.enterPath(selectionName);
    switch (kind) {
        case 'ScalarFieldSelection': {
            sink[selectionName] = getScalarValue(selectionName, state);
            break;
        }
        case 'ObjectFieldSelection': {
            // regular field, not spanning
            const field = fields[selectionName];
            const resolved = resolveLink(builder, field);
            sink[selectionName] = getNonSpanningField(
                sel as LuvioSelectionObjectFieldNode,
                builder,
                resolved
            );
            break;
        }
        case 'CustomFieldSelection': {
            const field = fields[selectionName];
            const resolved = resolveLink(builder, field) as FieldValueRepresentationNormalized;
            const { value } = resolved;
            const resolvedSpanningRecord = resolveLink(
                builder,
                value as StoreLink
            ) as RecordRepresentationNormalized;
            sink[selectionName] = getCustomSelection(
                sel as LuvioSelectionCustomFieldNode,
                builder,
                {
                    source: resolvedSpanningRecord,
                    parentFieldValue: resolved,
                }
            );
        }
    }
    builder.exitPath();
}

interface RecordRepresentationReadOptions {
    source: RecordRepresentationNormalized;
    parentFieldValue: FieldValueRepresentationNormalized | undefined;
}

function readRecordRepresentation(
    ast: LuvioSelectionCustomFieldNode,
    builder: Reader<any>,
    options: RecordRepresentationReadOptions
) {
    const { luvioSelections } = ast;
    if (luvioSelections === undefined) {
        throw new Error('Empty selections not supported');
    }

    const sink = {};
    const state: RecordDenormalizationState = {
        source: options.source,
        sink,
        parentFieldValue: options.parentFieldValue,
    };

    for (let i = 0, len = luvioSelections.length; i < len; i += 1) {
        assignSelection(luvioSelections[i], builder, state);
    }
    return sink;
}

export const createRead: (ast: LuvioSelectionCustomFieldNode) => ReaderFragment['read'] = (
    ast: LuvioSelectionCustomFieldNode
) => {
    return (data: RecordRepresentationNormalized, builder: Reader<any>) => {
        return readRecordRepresentation(ast, builder, {
            source: data,
            parentFieldValue: undefined,
        });
    };
};
