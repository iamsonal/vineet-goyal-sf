import {
    LuvioArgumentNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
    LuvioDocumentNode,
} from '@luvio/graphql-parser';
import { removeDuplicateFields } from './comparison';
import { message, missingObjectInfo, PredicateError } from './Error';

import { recordFilter } from './filter-parser';
import { RelationshipInfo, ReferenceFieldInfo, ObjectInfoMap, ReferenceToInfo } from './info-types';
import { parseOrderBy } from './orderby-parser';

import {
    RecordQuery,
    RootQuery,
    ScalarField,
    ComparisonPredicate,
    RecordQueryField,
    ChildField,
    JsonExtract,
    Predicate,
    FieldType,
    CompoundOperator,
    ComparisonOperator,
    ValueType,
} from './Predicate';
import { errors, failure, isFailure, isSuccess, Result, success, values } from './Result';
import { scopeFilter } from './scope-parser';

import {
    isCustomFieldNode,
    isOperationDefinition,
    isScalarFieldNode,
    isObjectFieldSelection,
    isDefined,
    isScalarDataType,
    isIdField,
} from './type-guards';

import {
    combinePredicates,
    comparison,
    extractPath,
    getFieldInfo as getFieldInfo,
    getRelationshipInfo,
    referencePredicate,
    stringLiteral,
} from './util';

import { flatMap, flatten } from './util/flatten';

const REFERENCE_NAME_KEY = 'Reference';
const API_NAME_KEY = 'ApiName';

const { Extract } = ValueType;
export interface ParserInput {
    objectInfoMap: ObjectInfoMap;
    userId: string;
}

function isSpanningField(value: QueryField): value is SpanningField {
    return value.type === FieldType.Spanning;
}

function luvioSelections(node: { luvioSelections?: LuvioSelectionNode[] }): LuvioSelectionNode[] {
    return node.luvioSelections === undefined ? [] : node.luvioSelections;
}

function named<T extends { name: string }>(name: string): (node: T) => boolean {
    return (node) => node.name === name;
}

interface QueryContainer {
    fields: RecordQueryField[];
    predicates: Predicate[];
    joinNames: string[];
}

interface SpanningQuery {
    type: 'spanning';
    fields: RecordQueryField[];
    alias: string;
    apiName: string;
    joinNames: string[];
    predicates: Predicate[];
}

interface SpanningField {
    type: FieldType.Spanning;
    path: string;
    spanning: SpanningQuery;
}

type QueryField = ChildField | ScalarField | SpanningField;

function spanningField(
    node: LuvioSelectionObjectFieldNode,
    fieldInfo: ReferenceFieldInfo,
    names: string[],
    parentAlias: string,
    input: ParserInput
): Result<SpanningField, PredicateError[]> {
    const parentQuery = spanningRecordQuery(node, fieldInfo, names, parentAlias, input);
    if (parentQuery.isSuccess === false) {
        return failure(parentQuery.error);
    }

    const field: SpanningField = {
        type: FieldType.Spanning,
        path: '',
        spanning: parentQuery.value,
    };

    return success(field);
}

function idField(jsonAlias: string, names: string[]): ScalarField {
    const outputPath = names.concat('Id').join('.');

    const extract: JsonExtract = {
        type: Extract,
        jsonAlias,
        path: extractPath('Id'),
    };
    return { type: FieldType.Scalar, extract, path: outputPath };
}

function scalarField(
    node: LuvioSelectionObjectFieldNode,
    names: string[],
    jsonAlias: string
): ScalarField[] {
    const outputNames = names.concat(node.name);

    return [node]
        .reduce(flatMap(luvioSelections), [])
        .filter(isScalarFieldNode)
        .map((field) => {
            const outputPath = outputNames.concat(field.name).join('.');
            const path = extractPath(node.name, field.name);

            const extract: JsonExtract = { type: Extract, jsonAlias, path };
            return { type: FieldType.Scalar, extract, path: outputPath };
        });
}

function selectionToQueryField(
    node: LuvioSelectionNode,
    names: string[],
    parentApiName: string,
    parentAlias: string,
    input: ParserInput
): Result<QueryField[], PredicateError[]> {
    if (!isObjectFieldSelection(node) && !isCustomFieldNode(node) && !isScalarFieldNode(node)) {
        return failure([message(`Node type ${node.kind} is not a valid record field type.`)]);
    }

    const fieldInfoResult = getFieldInfo(parentApiName, node.name, input.objectInfoMap);
    const relationshipInfoResult = getRelationshipInfo(
        parentApiName,
        node.name,
        input.objectInfoMap
    );

    if (fieldInfoResult.isSuccess === false) {
        return failure([fieldInfoResult.error]);
    }
    if (relationshipInfoResult.isSuccess === false) {
        return failure([relationshipInfoResult.error]);
    }
    const fieldInfo = fieldInfoResult.value;
    const relationshipInfo = relationshipInfoResult.value;
    if (fieldInfo === undefined && relationshipInfo === undefined) {
        return failure([message(`Field ${node.name} for type ${parentApiName} not found.`)]);
    }

    if (fieldInfo !== undefined) {
        //This is a spanning field
        if (fieldInfo.dataType === REFERENCE_NAME_KEY) {
            if (!isObjectFieldSelection(node) && !isCustomFieldNode(node)) {
                return failure([
                    message(`Node type ${node.kind} is not a valid reference field type.`),
                ]);
            }

            const selection: LuvioSelectionNode = { ...node, kind: 'ObjectFieldSelection' };
            if (fieldInfo.relationshipName === node.name) {
                return spanningField(selection, fieldInfo, names, parentAlias, input).map((f) => [
                    f,
                ]);
            }

            return success(scalarField(selection, names, parentAlias));
        }

        if (isIdField(fieldInfo)) {
            return success([idField(parentAlias, names)]);
        }

        //Scalar field
        if (isScalarDataType(fieldInfo.dataType)) {
            if (!isObjectFieldSelection(node)) {
                return failure([
                    message(`Node type ${node.kind} is not a valid scalar field type.`),
                ]);
            }

            return success(scalarField(node, names, parentAlias));
        }

        // If we've gotten this far, we're looking at a scalar field with a datatype
        // that we haven't otherwise identified
        return failure([
            message(`Field with datatype ${fieldInfo.dataType} is not a valid scalar field type.`),
        ]);
    }

    if (relationshipInfo === undefined) {
        return failure([message(`Relationship ${node.name} for type ${parentApiName} not found.`)]);
    }

    //Field is a connection to a child record type
    if (!isCustomFieldNode(node)) {
        return failure([message(`Node type ${node.kind} is not a valid child field type.`)]);
    }

    const fieldPath = names.concat(node.name);
    const edgePath = fieldPath.concat('edges');

    return childRecordQuery(node, relationshipInfo, parentAlias, input).map((query) => {
        return [{ type: FieldType.Child, path: edgePath.join('.'), connection: query }];
    });
}

function recordFields(
    luvioSelections: LuvioSelectionNode[],
    names: string[],
    parentApiName: string,
    parentAlias: string,
    input: ParserInput
): Result<QueryField[], PredicateError[]> {
    const results = luvioSelections.map((s) =>
        selectionToQueryField(s, names, parentApiName, parentAlias, input)
    );

    const fields = results.filter(isSuccess).reduce(flatMap(values), []);
    const fails = results.filter(isFailure).reduce(flatMap(errors), []);

    if (fails.length > 0) {
        return failure(fails);
    }

    return success(fields);
}

function queryContainer(
    inputFields: Result<QueryField[], PredicateError[]>,
    jsonAlias: string,
    apiName: string,
    additionalPredicates: ComparisonPredicate[]
): Result<QueryContainer, PredicateError[]> {
    if (inputFields.isSuccess === false) {
        return failure(inputFields.error);
    }

    const extract: JsonExtract = {
        type: Extract,
        jsonAlias,
        path: extractPath(API_NAME_KEY),
    };
    const typePredicate = comparison(extract, ComparisonOperator.eq, stringLiteral(apiName, true));
    const spanningFields = inputFields.value.filter(isSpanningField);

    const predicates: Predicate[] = spanningFields
        .map((field): Predicate[] => field.spanning.predicates)
        .reduce(flatten, [])
        .concat(typePredicate)
        .concat(additionalPredicates);

    const joinNames = spanningFields.map((field) => field.spanning.joinNames).reduce(flatten, []);

    const fields = inputFields.value
        .map((field) => (isSpanningField(field) ? field.spanning.fields : [field]))
        .reduce(flatten, []);

    return success({ fields, predicates, joinNames });
}

//A field or fields from a parent record
function spanningRecordQuery(
    selection: LuvioSelectionObjectFieldNode,
    fieldInfo: ReferenceFieldInfo,
    names: string[],
    parentAlias: string,
    input: ParserInput
): Result<SpanningQuery, PredicateError[]> {
    const { apiName: fieldName, referenceToInfos: referenceInfos, relationshipName } = fieldInfo;
    const alias = `${parentAlias}.${relationshipName}`;
    const selections = selection.luvioSelections || [];
    const outPathNames = names.concat(relationshipName);

    const referenceToInfo: ReferenceToInfo | undefined = referenceInfos[0];
    if (referenceToInfo === undefined) {
        return failure([message(`No reference info found for ${fieldName}`)]);
    }

    const { apiName } = referenceToInfo;
    const internalFields = recordFields(selections, outPathNames, apiName, alias, input);
    const joinPredicate = referencePredicate(parentAlias, alias, fieldName);

    return queryContainer(internalFields, alias, apiName, [joinPredicate]).map((result) => {
        const { fields, predicates, joinNames: joins } = result;
        const joinNames = joins.concat(alias);
        return { type: 'spanning', apiName, fields, predicates, alias, joinNames };
    });
}

function childRecordQuery(
    selection: LuvioSelectionCustomFieldNode,
    relationshipInfo: RelationshipInfo,
    parentAlias: string,
    input: ParserInput
): Result<RecordQuery, PredicateError[]> {
    const { relationshipName, childObjectApiName, fieldName } = relationshipInfo;

    const alias = `${parentAlias}.${relationshipName}`;
    const apiName = childObjectApiName;

    //parent predicate
    let additionalPredicates = [referencePredicate(alias, parentAlias, fieldName)];

    return recordQuery(selection, apiName, alias, additionalPredicates, input);
}

function parseFirst(
    arg: LuvioArgumentNode | undefined
): Result<number | undefined, PredicateError> {
    if (arg === undefined) {
        return success(undefined);
    }

    const value = arg.value;
    if (value.kind !== 'IntValue') {
        return failure(message('first type should be an IntValue.'));
    }

    return success(parseInt(value.value));
}

function recordQuery(
    selection: LuvioSelectionCustomFieldNode,
    apiName: string,
    alias: string,
    predicates: ComparisonPredicate[],
    input: ParserInput
): Result<RecordQuery, PredicateError[]> {
    const args = selection.arguments || [];
    const whereArg = args.filter(named('where'))[0];
    const scopeArg = args.filter(named('scope'))[0];
    const orderByArg = args.filter(named('orderBy'))[0];
    const firstArg = args.filter(named('first'))[0];

    const firstResult = parseFirst(firstArg);
    const orderByResult = parseOrderBy(orderByArg, alias, apiName, input.objectInfoMap);
    const whereResult = recordFilter(whereArg, alias, apiName, input.objectInfoMap);
    const scopeResult = scopeFilter(scopeArg, alias, apiName, input);

    let additionalPredicates: Predicate[] = [];
    let filterJoins: string[] = [];
    let orderByJoins: string[] = [];

    if (orderByResult.isSuccess === false) {
        return failure(orderByResult.error);
    }

    if (whereResult.isSuccess === false) {
        return failure(whereResult.error);
    }

    if (scopeResult.isSuccess === false) {
        return failure([scopeResult.error]);
    }

    if (firstResult.isSuccess === false) {
        return failure([firstResult.error]);
    }

    if (scopeResult.value !== undefined) {
        additionalPredicates.push(scopeResult.value);
    }

    if (whereResult.value !== undefined) {
        const { predicate, joinPredicates, joinNames } = whereResult.value;

        additionalPredicates.push(predicate, ...joinPredicates);
        filterJoins = joinNames;
    }

    for (const orderBy of orderByResult.value) {
        const { joinPredicates, joinNames } = orderBy;
        additionalPredicates = additionalPredicates.concat(joinPredicates);
        orderByJoins = orderByJoins.concat(joinNames);
    }

    //make our way down to the field-containing ast node
    const node = [selection]
        .reduce(flatMap(luvioSelections), [])
        .filter(isObjectFieldSelection)
        .filter(named('edges'))
        .reduce(flatMap(luvioSelections), [])
        .filter(isCustomFieldNode)
        .filter(named('node'))[0];

    //look for scalar fields, parent fields or children
    const internalFields = recordFields(
        node.luvioSelections || [],
        ['node'],
        apiName,
        alias,
        input
    );

    const path = extractPath('drafts');
    const extract: JsonExtract = { type: ValueType.Extract, jsonAlias: alias, path };
    const draftsField: ScalarField = { type: FieldType.Scalar, extract, path: 'node._drafts' };

    const idPath = extractPath('Id');
    const idExtract: JsonExtract = { type: ValueType.Extract, jsonAlias: alias, path: idPath };
    const idField: ScalarField = { type: FieldType.Scalar, extract: idExtract, path: 'node.Id' };
    const metadataPath = extractPath('metadata');
    const metadataExtract: JsonExtract = {
        type: ValueType.Extract,
        jsonAlias: alias,
        path: metadataPath,
    };
    const metadataField: ScalarField = {
        type: FieldType.Scalar,
        extract: metadataExtract,
        path: 'node._metadata',
    };
    return queryContainer(internalFields, alias, apiName, predicates).map((result) => {
        const { fields } = result;
        const allFields = removeDuplicateFields(
            fields.concat(...[draftsField, idField, metadataField])
        );

        //combine the joins and remove duplicates
        const joinSet = new Set([...result.joinNames, ...filterJoins, ...orderByJoins]);
        const joinNames = Array.from(joinSet);

        const predicate = combinePredicates(
            [...additionalPredicates, ...result.predicates].filter(isDefined),
            CompoundOperator.and
        );
        const first = firstResult.value;
        const orderBy =
            orderByResult.value === undefined
                ? []
                : orderByResult.value.map((result) => result.orderBy);

        return { joinNames, fields: allFields, first, orderBy, apiName, alias, predicate };
    });
}

function rootRecordQuery(
    selection: LuvioSelectionCustomFieldNode,
    input: ParserInput
): Result<RecordQuery, PredicateError[]> {
    const alias = selection.name;
    const apiName = selection.name;

    if (input.objectInfoMap[alias] === undefined) {
        return failure([missingObjectInfo(apiName)]);
    }

    return recordQuery(selection, alias, apiName, [], input);
}

function rootQuery(
    recordNodes: LuvioSelectionCustomFieldNode[],
    input: ParserInput
): Result<RootQuery, PredicateError[]> {
    const results = recordNodes.map((record) => rootRecordQuery(record, input));
    const connections = results.filter(isSuccess).map(values);
    const fails = results.filter(isFailure).reduce(flatMap(errors), []);

    if (fails.length > 0) {
        return failure(fails);
    }

    return success({ type: 'root', connections });
}

//find top level record queries
export function findRecordSelections(document: LuvioDocumentNode): LuvioSelectionCustomFieldNode[] {
    return document.definitions
        .filter(isOperationDefinition)
        .reduce(flatMap(luvioSelections), [])
        .filter(isObjectFieldSelection)
        .filter(named('uiapi'))
        .reduce(flatMap(luvioSelections), [])
        .filter(isObjectFieldSelection)
        .filter(named('query'))
        .reduce(flatMap(luvioSelections), [])
        .filter(isCustomFieldNode);
}

export function transform(
    document: LuvioDocumentNode,
    input: ParserInput
): Result<RootQuery, PredicateError[]> {
    const recordNodes = findRecordSelections(document);

    return rootQuery(recordNodes, input);
}
