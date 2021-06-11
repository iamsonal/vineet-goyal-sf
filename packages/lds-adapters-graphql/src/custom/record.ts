import { IngestPath, Luvio, Reader, ReaderFragment, ResourceIngest, Store } from '@luvio/engine';
import {
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
} from '@salesforce/lds-graphql-parser';
import {
    RecordRepresentation,
    createIngestRecordWithFields,
    RecordRepresentationNormalized,
    FieldValueRepresentationNormalized,
    FieldValueRepresentation,
    keyBuilderRecord,
} from '@salesforce/lds-adapters-uiapi';
import {
    createRead as createConnectionRead,
    createIngest as createConnectionIngest,
    GqlConnection,
    CUSTOM_FIELD_NODE_TYPE as CUSTOM_FIELD_NODE_TYPE_CONNECTION,
} from './connection';
import {
    getLuvioFieldNodeSelection,
    resolveLink,
    propertyLookup,
    PropertyLookupResultState,
    resolveKey,
} from '../type/Selection';

type RecordFieldTrie = Parameters<typeof createIngestRecordWithFields>[0];

type GqlScalarField = string | number | boolean;

interface GqlRecordFieldValue {
    value?: string | null;
    displayValue?: GqlScalarField | null;
}

interface GqlRecordStringFieldValue {
    value: string;
    displayValue?: string | null;
}

interface DefaultRecordFields {
    ApiName: string;
    Id: string;
    WeakEtag: number;
    DisplayValue: string | null;
    RecordTypeId: GqlRecordStringFieldValue | null;
    LastModifiedById: GqlRecordStringFieldValue;
    LastModifiedDate: GqlRecordStringFieldValue;
    SystemModstamp: GqlRecordStringFieldValue;
}

type SpanningGqlRecord = GqlRecord | null;

export type CustomDataType = GqlRecord | GqlConnection;
export interface GqlRecord extends DefaultRecordFields {
    [key: string]: GqlScalarField | GqlRecordFieldValue | CustomDataType | null;
}

export const CUSTOM_FIELD_NODE_TYPE = 'Record';

export const RECORD_DEFAULT_FIELD_VALUES = ['value', 'displayValue'];

function collectObjectFieldSelection(data: GqlRecordFieldValue): FieldValueRepresentation {
    return {
        value: data.value as GqlScalarField,
        displayValue: data.displayValue as string,
    };
}

function childTypeIsChildRelationships(
    sel: LuvioSelectionCustomFieldNode,
    _data: CustomDataType | SpanningGqlRecord
): _data is GqlConnection {
    return sel.type === CUSTOM_FIELD_NODE_TYPE_CONNECTION;
}

function childTypeIsSpanningGqlRecord(
    sel: LuvioSelectionCustomFieldNode,
    _data: CustomDataType | SpanningGqlRecord
): _data is SpanningGqlRecord {
    return sel.type === CUSTOM_FIELD_NODE_TYPE;
}

function convertAstToTrie(ast: LuvioSelectionCustomFieldNode): RecordFieldTrie {
    const selections = ast.luvioSelections === undefined ? [] : ast.luvioSelections;
    const children: RecordFieldTrie['children'] = {};
    const trie: RecordFieldTrie = {
        name: ast.name,
        children,
    };

    for (let i = 0, len = selections.length; i < len; i += 1) {
        const sel = getLuvioFieldNodeSelection(selections[i]);
        const { name: selName, kind } = sel;

        switch (kind) {
            case 'ObjectFieldSelection': {
                children[selName] = {
                    name: selName,
                    children: {},
                };
                break;
            }
            case 'CustomFieldSelection': {
                children[selName] = convertAstToTrie(sel as LuvioSelectionCustomFieldNode);
                break;
            }
        }
    }

    return trie;
}

function formatSpanningCustomFieldSelection(
    sel: LuvioSelectionCustomFieldNode,
    data: GqlRecord
): { value: FieldValueRepresentation; trie: RecordFieldTrie } {
    if (data === null) {
        return {
            value: {
                displayValue: null,
                value: null,
            },
            trie: convertAstToTrie(sel),
        };
    }
    const { recordRepresentation, fieldsTrie } = convertToRecordRepresentation(sel, data);
    return {
        trie: fieldsTrie,
        value: {
            displayValue: data.DisplayValue,
            value: recordRepresentation,
        },
    };
}

interface RecordRepresentationConversionResult {
    recordRepresentation: RecordRepresentation;
    childRelationships: Record<
        string,
        {
            ast: LuvioSelectionCustomFieldNode;
            data: GqlConnection;
        }
    >;
    fieldsTrie: RecordFieldTrie;
}

export function convertToRecordRepresentation(
    ast: LuvioSelectionCustomFieldNode,
    record: GqlRecord
): RecordRepresentationConversionResult {
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

    const trieChildren: RecordFieldTrie['children'] = {};
    const trie: RecordRepresentationConversionResult['fieldsTrie'] = {
        name: ApiName,
        children: trieChildren,
    };

    const childRelationships: RecordRepresentationConversionResult['childRelationships'] = {};
    const fieldsBag: RecordRepresentation['fields'] = {};
    for (let i = 0, len = luvioSelections.length; i < len; i += 1) {
        const sel = getLuvioFieldNodeSelection(luvioSelections[i]);
        const { name: fieldName, alias } = sel;
        const propertyName = alias === undefined ? fieldName : alias;
        const data = record[propertyName];

        switch (sel.kind) {
            case 'ObjectFieldSelection': {
                trieChildren[fieldName] = {
                    name: fieldName,
                    children: {},
                };
                fieldsBag[fieldName] = collectObjectFieldSelection(data as GqlRecordFieldValue);
                break;
            }
            case 'CustomFieldSelection': {
                if (childTypeIsSpanningGqlRecord(sel, data as CustomDataType)) {
                    const { value, trie } = formatSpanningCustomFieldSelection(
                        sel,
                        data as GqlRecord
                    );
                    trieChildren[fieldName] = trie;
                    fieldsBag[fieldName] = value;
                } else if (childTypeIsChildRelationships(sel, data as CustomDataType)) {
                    childRelationships[fieldName] = {
                        ast: sel,
                        data: data as GqlConnection,
                    };
                }
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

    return {
        recordRepresentation: rep,
        fieldsTrie: trie,
        childRelationships,
    };
}

export const defaultRecordFieldsFragmentName = 'defaultRecordFields';

export const defaultRecordFieldsFragment = `fragment ${defaultRecordFieldsFragmentName} on Record { __typename, ApiName, WeakEtag, Id, DisplayValue, SystemModstamp { value } LastModifiedById { value } LastModifiedDate { value } RecordTypeId(fallback: true) { value } }`;

function getChildRelationshipsKey(recordKey: string, propertyName: string) {
    return `${recordKey}__childRelationships__${propertyName}`;
}

export const createIngest: (ast: LuvioSelectionCustomFieldNode) => ResourceIngest = (
    ast: LuvioSelectionCustomFieldNode
) => {
    return (data: GqlRecord, path: IngestPath, luvio: Luvio, store: Store, timestamp: number) => {
        const { recordRepresentation, fieldsTrie, childRelationships } =
            convertToRecordRepresentation(ast, data);
        const ingestRecord = createIngestRecordWithFields(fieldsTrie, {
            name: recordRepresentation.apiName,
            children: {},
        });

        const recordIngest = ingestRecord(recordRepresentation, path, luvio, store, timestamp);
        const recordKey = recordIngest.__ref as string;
        const childRelationshipKeys = Object.keys(childRelationships);
        for (let i = 0, len = childRelationshipKeys.length; i < len; i += 1) {
            const propertyName = childRelationshipKeys[i];
            const childRelationship = childRelationships[propertyName];
            const { ast: childRelationshipAst, data: childRelationshipData } = childRelationship;
            const fullPath = getChildRelationshipsKey(recordKey, propertyName);
            createConnectionIngest(childRelationshipAst, fullPath)(
                childRelationshipData,
                {
                    parent: {
                        data,
                        key: recordKey,
                        existing: undefined,
                    },
                    fullPath: fullPath,
                    state: path.state,
                    propertyName: propertyName,
                },
                luvio,
                store,
                timestamp
            );
        }

        return recordIngest;
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
    const sink: GqlRecordFieldValue = {};
    const { luvioSelections } = sel;
    if (luvioSelections === undefined) {
        throw new Error('Empty selections not supported');
    }
    for (let i = 0, len = luvioSelections.length; i < len; i += 1) {
        const sel = getLuvioFieldNodeSelection(luvioSelections[i]);
        const { kind } = sel;
        const name = sel.name as keyof GqlRecordFieldValue;
        builder.enterPath(name);
        if (kind !== 'ScalarFieldSelection') {
            throw new Error(`Unexpected kind "${kind}"`);
        }
        builder.assignScalar(name, sink, source[name]);
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

function assignConnectionSelection(
    builder: Reader<any>,
    sink: any,
    sel: LuvioSelectionCustomFieldNode,
    recordKey: string,
    propertyName: string
) {
    const key = getChildRelationshipsKey(recordKey, propertyName);
    const resolved = resolveKey(builder, key);
    if (resolved === undefined) {
        return;
    }
    const data = createConnectionRead(sel as LuvioSelectionCustomFieldNode)(
        resolved.value,
        builder
    );
    builder.assignNonScalar(sink, propertyName, data);
}

function assignSelection(
    selection: LuvioSelectionNode,
    builder: Reader<any>,
    state: RecordDenormalizationState
) {
    const sel = getLuvioFieldNodeSelection(selection);
    const { name: selectionName, kind, alias } = sel;
    const propertyName = alias === undefined ? selectionName : alias;
    const { source, sink } = state;
    const { fields } = source;
    builder.enterPath(selectionName);
    switch (kind) {
        case 'ScalarFieldSelection': {
            builder.assignScalar(propertyName, sink, getScalarValue(selectionName, state));
            break;
        }
        case 'ObjectFieldSelection': {
            // regular field, not spanning
            const field = propertyLookup(builder, selectionName, fields);

            if (field.state === PropertyLookupResultState.Missing) {
                break;
            }

            const resolved = resolveLink(builder, field.value);
            if (resolved === undefined) {
                break;
            }
            const data = getNonSpanningField(
                sel as LuvioSelectionObjectFieldNode,
                builder,
                resolved.value
            );
            builder.assignNonScalar(sink, propertyName, data);
            break;
        }
        case 'CustomFieldSelection': {
            if ((sel as LuvioSelectionCustomFieldNode).type === 'Connection') {
                const recordKey = keyBuilderRecord({
                    recordId: state.source.id,
                });
                assignConnectionSelection(
                    builder,
                    sink,
                    sel as LuvioSelectionCustomFieldNode,
                    recordKey,
                    propertyName
                );
            } else {
                const field = fields[selectionName];

                const resolvedParentFieldValue = resolveLink<FieldValueRepresentationNormalized>(
                    builder,
                    field
                );
                if (resolvedParentFieldValue === undefined) {
                    break;
                }
                const { value: spanningFieldResult } = resolvedParentFieldValue;
                const { value: spanningFieldValue } = spanningFieldResult;
                if (spanningFieldValue === null || typeof spanningFieldValue !== 'object') {
                    sink[propertyName] = null;
                    break;
                }

                const resolvedSpanningRecordValue = resolveLink<RecordRepresentationNormalized>(
                    builder,
                    spanningFieldValue
                );
                if (resolvedSpanningRecordValue === undefined) {
                    break;
                }
                const data = getCustomSelection(sel as LuvioSelectionCustomFieldNode, builder, {
                    source: resolvedSpanningRecordValue.value,
                    parentFieldValue: spanningFieldResult,
                });
                builder.assignNonScalar(sink, propertyName, data);
            }
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
