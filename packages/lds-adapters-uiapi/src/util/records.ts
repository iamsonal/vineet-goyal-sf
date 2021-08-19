import { ProxyGraphNode, GraphNode } from '@luvio/engine';
import { FieldRepresentation } from '../generated/types/FieldRepresentation';
import {
    FieldValueRepresentation,
    FieldValueRepresentationNormalized,
} from '../generated/types/FieldValueRepresentation';
import { ObjectInfoRepresentation } from '../generated/types/ObjectInfoRepresentation';
import { RecordInputRepresentation } from '../generated/types/RecordInputRepresentation';
import {
    keyBuilder as recordRepresentationKeyBuilder,
    RecordRepresentation,
    RecordRepresentationNormalized,
} from '../generated/types/RecordRepresentation';
import {
    ArrayPrototypeConcat,
    ArrayPrototypeIncludes,
    ArrayPrototypePush,
    ArrayPrototypeReduce,
    ObjectKeys,
    ObjectPrototypeHasOwnProperty,
    StringPrototypeEndsWith,
    ObjectCreate,
} from './language';
import { FieldId, splitQualifiedFieldApiName } from '../primitives/FieldId';
import getFieldApiName from '../primitives/FieldId/coerce';
import { dedupe } from '../validation/utils';
import { MASTER_RECORD_TYPE_ID } from './layout';
import { UIAPI_SUPPORTED_ENTITY_API_NAMES } from './supported-entities';
import { isSpanningRecord } from '../selectors/record';
import { RecordCreateDefaultRecordRepresentation } from '../generated/types/RecordCreateDefaultRecordRepresentation';
import { ObjectFreeze } from '../generated/adapters/adapter-utils';
import {
    FieldMapRepresentation,
    insertFieldsIntoTrie,
    MAX_RECORD_DEPTH,
    FieldMapRepresentationNormalized,
} from './fields';

type FieldValueRepresentationValue = FieldValueRepresentation['value'];

const CUSTOM_API_NAME_SUFFIX = '__c';
const CUSTOM_EXTERNAL_OBJECT_FIELD_SUFFIX = '__x';

export interface FieldValueRepresentationLinkState {
    fields: string[];
}

export interface ResourceRequestWithConfig {
    configOptionalFields?: string[];
}

export interface RecordLayoutFragment {
    apiName: RecordRepresentation['apiName'];
    recordTypeId: RecordRepresentation['recordTypeId'];
}

/**
 * A trie data structure representing where each node represents a field on a RecordRepresentation.
 */
export interface RecordFieldTrie {
    name: string;
    children: { [name: string]: RecordFieldTrie };
    scalar?: boolean;
    optional?: boolean;
}

export interface TrackedFieldsConfig {
    maxDepth: number;
    onlyFetchLeafNodeId: boolean;
}

export function isGraphNode(node: ProxyGraphNode<unknown>): node is GraphNode<unknown> {
    return node !== null && node.type === 'Node';
}

export function extractTrackedFields(
    node: ProxyGraphNode<RecordRepresentationNormalized, RecordRepresentation>,
    parentFieldName: string,
    fieldsList: string[] = [],
    visitedRecordIds: Record<string, boolean> = {},
    depth: number = 0
): string[] {
    // Filter Error and null nodes
    if (!isGraphNode(node) || depth > MAX_RECORD_DEPTH) {
        return [];
    }
    const recordId = node.data.id;

    // Stop the traversal if the key has already been visited, since the fields for this record
    // have already been gathered at this point.
    if (ObjectPrototypeHasOwnProperty.call(visitedRecordIds, recordId)) {
        return fieldsList;
    }

    // The visitedRecordIds object passed to the spanning record is a copy of the original
    // visitedRecordIds + the current record id, since we want to detect circular references within
    // a given path.
    let spanningVisitedRecordIds = {
        ...visitedRecordIds,
        [recordId]: true,
    };

    const fields = node.object('fields');
    const keys = fields.keys();

    for (let i = 0, len = keys.length; i < len; i += 1) {
        const key = keys[i];
        const fieldValueRep =
            fields.link<
                FieldValueRepresentationNormalized,
                FieldValueRepresentation,
                FieldValueRepresentationLinkState
            >(key);

        const fieldName = `${parentFieldName}.${key}`;
        if (fieldValueRep.isMissing()) {
            ArrayPrototypePush.call(fieldsList, fieldName);
            continue;
        }

        const field = fieldValueRep.follow();

        // Filter Error and null nodes
        if (!isGraphNode(field)) {
            continue;
        }

        if (field.isScalar('value') === false) {
            const spanning = field
                .link<RecordRepresentationNormalized, RecordRepresentation>('value')
                .follow();

            extractTrackedFields(
                spanning,
                fieldName,
                fieldsList,
                spanningVisitedRecordIds,
                depth + 1
            );
        } else {
            const state = fieldValueRep.linkData();
            if (state !== undefined) {
                const { fields } = state;
                for (let s = 0, len = fields.length; s < len; s += 1) {
                    const childFieldName = fields[s];
                    ArrayPrototypePush.call(fieldsList, `${fieldName}.${childFieldName}`);
                }
            } else {
                ArrayPrototypePush.call(fieldsList, fieldName);
            }
        }
    }

    return fieldsList;
}

function addScalarFieldId(current: RecordFieldTrie) {
    let leafNodeIdKey = 'Id';
    if (current.children[leafNodeIdKey] === undefined) {
        current.children = {
            [leafNodeIdKey]: {
                name: leafNodeIdKey,
                children: {},
            },
        };
    }
}

export function extractTrackedFieldsToTrie(
    recordId: string,
    node: ProxyGraphNode<FieldMapRepresentationNormalized, FieldMapRepresentation>,
    root: RecordFieldTrie,
    config: TrackedFieldsConfig,
    visitedRecordIds: Record<string, boolean> = {},
    depth: number = 0
) {
    // Filter Error and null nodes
    if (!isGraphNode(node)) {
        return;
    }

    // Stop the traversal if the key has already been visited, since the fields for this record
    // have already been gathered at this point.
    if (ObjectPrototypeHasOwnProperty.call(visitedRecordIds, recordId)) {
        return;
    }

    // The visitedRecordIds object passed to the spanning record is a copy of the original
    // visitedRecordIds + the current record id, since we want to detect circular references within
    // a given path.
    let spanningVisitedRecordIds = {
        ...visitedRecordIds,
        [recordId]: true,
    };

    const fields = node.object('fields');
    const keys = fields.keys();
    let current = root;
    for (let i = 0, len = keys.length; i < len; i += 1) {
        const key = keys[i] as string;
        const fieldValueRep =
            fields.link<
                FieldValueRepresentationNormalized,
                FieldValueRepresentation,
                FieldValueRepresentationLinkState
            >(key);

        let next: RecordFieldTrie = current.children[key];
        if (next === undefined) {
            next = {
                name: key,
                children: {},
            };
            if (fieldValueRep.isMissing()) {
                current.children[key] = next;
                continue;
            }

            const field = fieldValueRep.follow();
            // Filter Error and null nodes
            if (!isGraphNode(field)) {
                continue;
            }

            const { maxDepth, onlyFetchLeafNodeId } = config;

            if (field.isScalar('value') === false) {
                if (depth + 1 > maxDepth) {
                    if (onlyFetchLeafNodeId === true) {
                        addScalarFieldId(current);
                    }
                    continue;
                }

                const spanningLink =
                    field.link<RecordRepresentationNormalized, RecordRepresentation>('value');

                const spanning = spanningLink.follow();

                // W-8058425, do not include external lookups added by getTrackedFields
                if (isExternalLookupFieldKey(spanning)) {
                    continue;
                }

                extractTrackedFieldsToTrie(
                    spanningLink.data.__ref!,
                    spanning,
                    next,
                    config,
                    spanningVisitedRecordIds,
                    depth + 1
                );
                if (ObjectKeys(next.children).length > 0) {
                    current.children[key] = next;
                } else {
                    continue;
                }
            } else {
                // Skip the field, if its value is null at the max level depth.
                // Ideally, it should only skip relationship field. However,
                // on the client, there is not a reliable way to determine the
                // the field type.
                if (depth === maxDepth) {
                    if (onlyFetchLeafNodeId === true) {
                        addScalarFieldId(current);
                        continue;
                    }
                    if (field.scalar('value') === null) {
                        continue;
                    }
                }

                const state = fieldValueRep.linkData();
                if (state !== undefined) {
                    const { fields } = state;

                    // W-8058425, do not include external lookups added by getTrackedFields
                    if (ArrayPrototypeIncludes.call(fields, 'ExternalId')) {
                        continue;
                    }

                    for (let s = 0, len = fields.length; s < len; s += 1) {
                        const childFieldName = fields[s];
                        next.children[childFieldName] = {
                            name: childFieldName,
                            children: {},
                        };
                    }
                }
            }
            current.children[key] = next;
        }
    }
}

function isExternalLookupFieldKey(
    spanningNode: ProxyGraphNode<RecordRepresentationNormalized, RecordRepresentation>
): boolean {
    // The only way to know if a record is an external lookup is to look into its fields
    // list and find an "ExternalId" field.

    // Filter Error and null nodes
    if (!isGraphNode(spanningNode) || !spanningNode.isScalar('apiName')) {
        return false;
    }

    return StringPrototypeEndsWith.call(
        spanningNode.scalar('apiName'),
        CUSTOM_EXTERNAL_OBJECT_FIELD_SUFFIX
    );
}

export function convertTrieToFields(root: RecordFieldTrie): string[] {
    if (ObjectKeys(root.children).length === 0) {
        return [];
    }

    return convertTrieToFieldsRecursively(root);
}

export function convertTrieToFieldsRecursively(root: RecordFieldTrie): string[] {
    const childKeys = ObjectKeys(root.children);
    if (childKeys.length === 0) {
        if (root.name === '') {
            return [];
        }
        return [root.name];
    }

    return ArrayPrototypeReduce.call(
        childKeys,
        (acc, cur) =>
            ArrayPrototypeConcat.call(
                acc,
                convertTrieToFieldsRecursively(root.children[cur]).map((i) => `${root.name}.${i}`)
            ),
        []
    ) as string[];
}

export const BLANK_RECORD_FIELDS_TRIE = ObjectFreeze({
    name: '',
    children: {},
});

export const convertFieldsToTrie = (
    fields: string[] = [],
    isOptional: boolean = false
): RecordFieldTrie => {
    if (fields.length === 0) {
        return BLANK_RECORD_FIELDS_TRIE;
    }
    const name = getObjectNameFromField(fields[0]);
    const fieldsTrie: RecordFieldTrie = {
        name,
        children: {},
        optional: isOptional,
    };
    insertFieldsIntoTrie(fieldsTrie, fields, isOptional);
    return fieldsTrie;
};

const getObjectNameFromField = (field: string | FieldId): string => {
    const fieldApiName = getFieldApiName(field);
    if (fieldApiName === undefined) {
        return '';
    }
    return splitQualifiedFieldApiName(fieldApiName)[0];
};

// merge all nodes in Trie B into Trie A
function mergeFieldsTries(rootA: RecordFieldTrie, rootB: RecordFieldTrie) {
    const rootAchildren = rootA.children;
    const rootBchildren = rootB.children;
    const childBKeys = ObjectKeys(rootBchildren);
    for (let i = 0, len = childBKeys.length; i < len; i++) {
        const childBKey = childBKeys[i];
        if (rootAchildren[childBKey] === undefined) {
            rootAchildren[childBKey] = rootBchildren[childBKey];
        } else {
            mergeFieldsTries(rootAchildren[childBKey], rootBchildren[childBKey]);
        }
    }
}

export function getTrackedFields(
    key: string,
    graphNode: ProxyGraphNode<FieldMapRepresentationNormalized, FieldMapRepresentation>,
    config: TrackedFieldsConfig,
    fieldsFromConfig?: string[]
): string[] {
    const fieldsList = fieldsFromConfig === undefined ? [] : [...fieldsFromConfig];
    if (!isGraphNode(graphNode)) {
        return fieldsList;
    }

    const name = graphNode.scalar('apiName');
    const root = {
        name,
        children: {},
    };
    extractTrackedFieldsToTrie(key, graphNode, root, config);

    const rootFromConfig = {
        name,
        children: {},
    };
    insertFieldsIntoTrie(rootFromConfig, fieldsList);

    mergeFieldsTries(root, rootFromConfig);

    return convertTrieToFields(root).sort();
}

/**
 * Returns a new object that has a list of fields that has been filtered by
 * edited fields. Only contains fields that have been edited from their original
 * values (excluding Id which is always copied over).
 * @param input The RecordInputRepresentation object to filter.
 * @param original The Record object that contains the original field values.
 * @returns RecordInputRepresentation, see the description
 */
export function createRecordInputFilteredByEditedFields(
    input: RecordInputRepresentation,
    original: RecordRepresentation
): RecordInputRepresentation {
    const filteredRecordInput = getRecordInput();
    // Always copy over any existing id.
    if (original.id) {
        filteredRecordInput.fields.Id = original.id;
    }

    const recordInputFields = input.fields;
    const originalRecordFields = original.fields;
    const recordInputFieldPropertyNames = ObjectKeys(recordInputFields);
    for (let i = 0, len = recordInputFieldPropertyNames.length; i < len; i++) {
        const fieldName = recordInputFieldPropertyNames[i];
        let originalRecordFieldsEntry: FieldValueRepresentation | undefined;
        if (originalRecordFields) {
            originalRecordFieldsEntry = originalRecordFields[fieldName];
        }
        if (
            !originalRecordFieldsEntry ||
            (originalRecordFields &&
                recordInputFields[fieldName] !== originalRecordFieldsEntry.value)
        ) {
            filteredRecordInput.fields[fieldName] = recordInputFields[fieldName];
        }
    }

    return filteredRecordInput;
}

/**
 * Returns an object with its data populated from the given record. All fields
 * with values that aren't nested records will be assigned. This object can be
 * used to create a record.
 * @param record The record that contains the source data.
 * @param objectInfo The ObjectInfo corresponding to the apiName on the record.
 *        If provided, only fields that are createable=true (excluding Id) will
 *        be assigned to the object return value.
 * @returns RecordInputRepresentation See description.
 */
export function generateRecordInputForCreate(
    record: RecordRepresentation,
    objectInfo?: ObjectInfoRepresentation
): RecordInputRepresentation {
    const recordInput = _generateRecordInput(
        record,
        (field) => field.createable === true,
        objectInfo
    );
    recordInput.apiName = record.apiName;
    // fields.Id is not required for CREATE which might have been copied over,
    // so delete fields.Id
    delete recordInput.fields.Id;
    return recordInput;
}

/**
 * Returns an object with its data populated from the given record. All fields
 * with values that aren't nested records will be assigned. This object can be
 * used to update a record.
 * @param record The record that contains the source data.
 * @param objectInfo The ObjectInfo corresponding to the apiName on the record.
 *        If provided, only fields that are updateable=true (excluding Id) will
 *        be assigned to the object return value.
 * @returns RecordInputRepresentation See description.
 */
export function generateRecordInputForUpdate(
    record: RecordRepresentation,
    objectInfo?: ObjectInfoRepresentation
): RecordInputRepresentation {
    const recordInput = _generateRecordInput(
        record,
        (field) => field.updateable === true,
        objectInfo
    );
    if (!record.id) {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error('record must have id for update');
        }
    }
    // Always copy over any existing id.
    recordInput.fields.Id = record.id;
    return recordInput;
}

function isRecordInputFieldValue(
    unknown: unknown
): unknown is RecordInputRepresentation['fields'][number] {
    const type = typeof unknown;
    return unknown === null || type === 'string' || type === 'number' || type === 'boolean';
}

/**
 * Returns an object with its data populated from the given record. All fields
 * with values that aren't nested records will be assigned.
 * @param record The record that contains the source data.
 * @param copyFieldPredicate predicate to determine if a field should be copied.
 *        Required if "objectInfo" parameter is passed.
 * @param objectInfo The ObjectInfo corresponding to the apiName on the record.
 *        If provided, only fields that match the copyFieldPredicate (excluding
 *        Id) will be assigned to the object return value.
 * @returns RecordInputRepresentation
 */
function _generateRecordInput(
    record: RecordRepresentation,
    copyFieldPredicate?: (field: FieldRepresentation) => boolean,
    objectInfo?: ObjectInfoRepresentation
): RecordInputRepresentation {
    const recordInput = getRecordInput();

    const recordFields = record.fields;
    let objectInfoFields: { [key: string]: FieldRepresentation } | undefined;
    if (objectInfo) {
        objectInfoFields = objectInfo.fields;
    }

    const recordFieldPropertyNames = ObjectKeys(recordFields);
    for (let i = 0, len = recordFieldPropertyNames.length; i < len; i++) {
        const fieldName = recordFieldPropertyNames[i];
        const recordFieldsFieldNameEntry = recordFields[fieldName].value;
        if (isRecordInputFieldValue(recordFieldsFieldNameEntry)) {
            if (objectInfoFields && copyFieldPredicate) {
                const objectInfoFieldsFieldNameValue = objectInfoFields[fieldName];
                if (
                    objectInfoFieldsFieldNameValue &&
                    copyFieldPredicate(objectInfoFieldsFieldNameValue)
                ) {
                    recordInput.fields[fieldName] = recordFieldsFieldNameEntry;
                }
            } else {
                recordInput.fields[fieldName] = recordFieldsFieldNameEntry;
            }
        }
    }

    return recordInput;
}

/**
 * Gets a new Record Input.
 */
export function getRecordInput(): RecordInputRepresentation {
    return {
        apiName: undefined,
        fields: {},
    };
}

/**
 * Gets a field's value from a record.
 * @param record The record.
 * @param field The qualified API name of the field to return.
 * @returns The field's value (which may be a record in the case of spanning
 *          fields), or undefined if the field isn't found.
 */
export function getFieldValue(
    record: RecordRepresentation,
    field: FieldId | string
): FieldValueRepresentationValue | undefined {
    const fieldValueRepresentation = getField(record, field);
    if (fieldValueRepresentation === undefined) {
        return undefined;
    }

    if (isFieldValueRepresentation(fieldValueRepresentation)) {
        return fieldValueRepresentation.value;
    }

    return fieldValueRepresentation;
}

/**
 * Gets a field's display value from a record.
 * @param record The record.
 * @param field The qualified API name of the field to return.
 * @returns The field's display value, or undefined if the field isn't found.
 */
export function getFieldDisplayValue(
    record: RecordRepresentation,
    field: FieldId | string
): FieldValueRepresentationValue | undefined {
    const fieldValueRepresentation = getField(record, field);
    if (fieldValueRepresentation === undefined) {
        return undefined;
    }

    if (isFieldValueRepresentation(fieldValueRepresentation)) {
        return fieldValueRepresentation.displayValue;
    }

    return fieldValueRepresentation;
}

function isFieldValueRepresentation(unknown: unknown): unknown is FieldValueRepresentation {
    if (typeof unknown !== 'object' || unknown === null) {
        return false;
    }

    return 'value' in unknown && 'displayValue' in unknown;
}

function getField(
    record: RecordRepresentation,
    field: FieldId | string
): FieldValueRepresentation | RecordRepresentation | undefined {
    const fieldApiName = getFieldApiName(field);
    if (fieldApiName === undefined) {
        return undefined;
    }
    const unqualifiedField = splitQualifiedFieldApiName(fieldApiName)[1];
    const fields = unqualifiedField.split('.');

    let r = record;
    while (r && r.fields) {
        const f = fields.shift() as string;
        const fvr = r.fields[f];
        if (fvr === undefined) {
            return undefined;
        } else if (fields.length > 0) {
            r = fvr.value as RecordRepresentation;
        } else {
            return fvr;
        }
    }
    return r;
}

export function getRecordTypeId(record: RecordRepresentation | RecordLayoutFragment): string {
    return record.recordTypeId === null ? MASTER_RECORD_TYPE_ID : record.recordTypeId;
}

// This function traverses through a record and marks missing
// optional fields as "missing"
export function markMissingOptionalFields(
    record: ProxyGraphNode<FieldMapRepresentationNormalized, FieldMapRepresentation>,
    optionalFields: string[]
): void {
    if (!isGraphNode(record)) {
        return;
    }

    const apiName = record.scalar('apiName');
    for (let a = 0, aLen = optionalFields.length; a < aLen; a++) {
        const parts = optionalFields[a].split('.');
        if (parts[0] === apiName) {
            _markMissingPath(record, parts.slice(1));
        }
    }
}

function markNulledOutPath(
    record: ProxyGraphNode<RecordRepresentationNormalized, RecordRepresentation>,
    path: string[]
) {
    if (!isGraphNode(record)) {
        return;
    }

    const fieldValueRepresentation = record.object('fields');
    const fieldName = path.shift()!;

    if (fieldValueRepresentation.isUndefined(fieldName)) {
        return;
    }

    const link =
        fieldValueRepresentation.link<
            FieldValueRepresentationNormalized,
            FieldValueRepresentation,
            FieldValueRepresentationLinkState
        >(fieldName);
    const resolved = link.follow();

    if (isGraphNode(resolved) && resolved.isScalar('value') && path.length > 0) {
        const linkState = link.linkData();
        const fields = linkState === undefined ? [] : linkState.fields;
        link.writeLinkData({
            fields: dedupe([...fields, path.join('.')]),
        });
    }
}

export function markNulledOutRequiredFields(
    record: ProxyGraphNode<RecordRepresentationNormalized, RecordRepresentation>,
    fields: string[]
): void {
    if (!isGraphNode(record)) {
        return;
    }

    const apiName = record.scalar('apiName');
    for (let a = 0, aLen = fields.length; a < aLen; a++) {
        const parts = fields[a].split('.');
        if (parts[0] === apiName) {
            markNulledOutPath(record, parts.slice(1));
        }
    }
}

function _markMissingPath(
    record: ProxyGraphNode<FieldMapRepresentationNormalized, FieldMapRepresentation>,
    path: string[]
): void {
    // Filter out Error and null nodes
    if (!isGraphNode(record)) {
        return;
    }

    const fieldValueRepresentation = record.object('fields');
    const fieldName = path.shift()!;

    if (fieldValueRepresentation.isUndefined(fieldName) === true) {
        // TODO [W-6900046]: remove cast, make RecordRepresentationNormalized['fields'] accept
        // an undefined/non-present __ref if isMissing is present
        fieldValueRepresentation.write(fieldName, {
            __ref: undefined,
            isMissing: true,
        } as any);
        return;
    }

    const link =
        fieldValueRepresentation.link<FieldValueRepresentationNormalized, FieldValueRepresentation>(
            fieldName
        );

    if (link.isPending()) {
        // TODO [W-6900046]: remove cast, make RecordRepresentationNormalized['fields'] accept
        // an undefined/non-present __ref if isMissing is present
        fieldValueRepresentation.write(fieldName, {
            __ref: undefined,
            isMissing: true,
        } as any);
    } else if (path.length > 0 && link.isMissing() === false) {
        const fieldValue = link.follow();

        // Filter out Error and null nodes
        if (!isGraphNode(fieldValue)) {
            return;
        }

        // if value is not a scalar, follow the link and mark it as missing
        if (fieldValue.isScalar('value') === false) {
            _markMissingPath(
                fieldValue
                    .link<RecordRepresentationNormalized, RecordRepresentation>('value')
                    .follow(),
                path
            );
        }
    }
}

/**
 * Tells you if an objectApiName is supported by UI API or not.
 * Note: Luvio does not currently support all the entities, the list is limited to UI API supported entities
 * @param objectApiName the object API name from a record.
 * @return True if the provided objectApiName is supported in UI API.
 */
export function isSupportedEntity(objectApiName: string): boolean {
    return (
        UIAPI_SUPPORTED_ENTITY_API_NAMES[objectApiName] === true ||
        StringPrototypeEndsWith.call(objectApiName, CUSTOM_API_NAME_SUFFIX)
    );
}

/** Return true if a >= b */
export function isSuperset(a: string[], b: string[]): boolean {
    if (b.length > a.length) {
        return false;
    }

    const aMap: { [key: string]: true } = {};

    // Put all keys from subset into a map
    // so we don't have to use subset.includes which will be slow
    for (let i = 0, len = a.length; i < len; i += 1) {
        aMap[a[i]] = true;
    }

    for (let i = 0, len = b.length; i < len; i += 1) {
        if (aMap[b[i]] === undefined) {
            return false;
        }
    }

    return true;
}

/** return true if a and b start with the same root name and a contains all nodes in b */
export function isSuperRecordFieldTrie(a: RecordFieldTrie, b: RecordFieldTrie): boolean {
    if (a.name !== b.name) {
        return false;
    }

    const childrenA = a.children;
    const childrenB = b.children;
    const childKeysA = ObjectKeys(childrenA);
    const childKeysB = ObjectKeys(childrenB);
    const childKeysBLength = childKeysB.length;
    if (childKeysBLength > childKeysA.length) {
        return false;
    }

    let ret = true;
    for (let i = 0; i < childKeysBLength; i++) {
        const childBKey = childKeysB[i];
        const childA = childrenA[childBKey];
        if (childA === undefined) {
            return false;
        }

        ret = ret && isSuperRecordFieldTrie(childA, childrenB[childBKey]);
    }

    return ret;
}

/**
 * Returns a list of nested record ids from a record
 */
function extractRecordIdsRecursively(
    record: RecordRepresentation | RecordCreateDefaultRecordRepresentation,
    ids: { [key: string]: boolean }
) {
    if (record.id !== null) {
        const key = recordRepresentationKeyBuilder({ recordId: record.id });
        ids[key] = true;
    }

    const fieldNames = ObjectKeys(record.fields);
    for (let i = 0, len = fieldNames.length; i < len; i++) {
        const fieldName = fieldNames[i];
        const { value: fieldValue } = record.fields[fieldName];

        if (isSpanningRecord(fieldValue)) {
            extractRecordIdsRecursively(fieldValue, ids);
        }
    }
}

export function extractRecordIds(
    record: RecordRepresentation | RecordCreateDefaultRecordRepresentation
) {
    const ids: { [key: string]: boolean } = ObjectCreate(null);
    extractRecordIdsRecursively(record, ids);
    return ids;
}
