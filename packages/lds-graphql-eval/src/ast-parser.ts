import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import {
    LuvioArgumentNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
} from '@salesforce/lds-graphql-parser/dist/ast';

import { recordFilter } from './filter-parser';
import { RelationshipInfo, ReferenceFieldInfo, ObjectInfoMap } from './info-types';

import {
    RecordQuery,
    RootQuery,
    ScalarField,
    ComparisonPredicate,
    RecordQueryField,
    ChildField,
    JsonExtract,
    Predicate,
} from './Predicate';
import {
    errors,
    failure,
    isFailure,
    isSuccess,
    PredicateError,
    Result,
    success,
    values,
} from './Result';

import {
    isCustomFieldNode,
    isOperationDefinition,
    isScalarFieldNode,
    isObjectFieldSelection,
    isDefined,
} from './type-guards';

import {
    combinePredicates,
    comparison,
    getFieldInfo as getFieldInfo,
    getRelationshipInfo,
    referencePredicate,
    stringLiteral,
} from './util';

import { flatMap, flatten } from './util/flatten';

interface ParserInput {
    objectInfoMap: ObjectInfoMap;
    userId: string;
}

function isSpanningField(value: QueryField): value is SpanningField {
    return value.type === 'SpanningField';
}

function luvioSelections(node: { luvioSelections?: LuvioSelectionNode[] }): LuvioSelectionNode[] {
    return node.luvioSelections === undefined ? [] : node.luvioSelections;
}

function named<T extends { name: string }>(name: string): (node: T) => boolean {
    return (node) => node.name === name;
}

interface QueryContainer {
    fields: RecordQueryField[];
    predicates: ComparisonPredicate[];
    joinNames: string[];
}

interface SpanningQuery {
    type: 'spanning';
    fields: RecordQueryField[];
    alias: string;
    apiName: string;
    joinNames: string[];
    predicates: ComparisonPredicate[];
}

interface SpanningField {
    type: 'SpanningField';
    path: string;
    spanning: SpanningQuery;
}

type QueryField = ChildField | ScalarField | SpanningField;

function spanningField(
    node: LuvioSelectionObjectFieldNode,
    fieldInfo: ReferenceFieldInfo,
    parentAlias: string,
    input: ParserInput
): Result<SpanningField, PredicateError[]> {
    const parentQuery = spanningRecordQuery(node, fieldInfo, parentAlias, input);
    if (parentQuery.isSuccess === false) {
        return failure(parentQuery.error);
    }

    const field: SpanningField = {
        type: 'SpanningField',
        path: '',
        spanning: parentQuery.value,
    };

    return success(field);
}

function scalarField(
    node: LuvioSelectionObjectFieldNode,
    names: string[],
    jsonAlias: string
): ScalarField[] {
    const fieldNames = names.concat(node.name);

    return [node]
        .reduce(flatMap(luvioSelections), [])
        .filter(isScalarFieldNode)
        .map((field) => {
            const path = fieldNames.concat(field.name).join('.');
            const extract: JsonExtract = { type: 'JsonExtract', jsonAlias, path };
            return { type: 'ScalarField', extract, path };
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
        return failure([`Node type ${node.kind} is not a valid record field type.`]);
    }

    const fieldInfo = getFieldInfo(parentApiName, node.name, input.objectInfoMap);
    const relationshipInfo = getRelationshipInfo(parentApiName, node.name, input.objectInfoMap);

    if (fieldInfo === undefined && relationshipInfo === undefined) {
        return failure([`Field ${node.name} for type ${parentApiName} not found.`]);
    }

    if (fieldInfo !== undefined) {
        //This is a spanning field
        if (fieldInfo.fieldType === 'Reference') {
            if (!isObjectFieldSelection(node)) {
                return failure([`Node type ${node.kind} is not a valid reference field type.`]);
            }

            if (fieldInfo.relationshipName === node.name) {
                return spanningField(node, fieldInfo, parentAlias, input).map((f) => [f]);
            } else {
                return success(scalarField(node, names, parentAlias));
            }
        }

        //Scalar field
        if (fieldInfo.fieldType === 'Scalar') {
            if (!isObjectFieldSelection(node)) {
                return failure([`Node type ${node.kind} is not a valid scalar field type.`]);
            }

            return success(scalarField(node, names, parentAlias));
        }
    }

    if (relationshipInfo === undefined) {
        return failure([`Field ${node.name} for type ${parentApiName} not found.`]);
    }

    //Field is a connection to a child record type
    if (!isCustomFieldNode(node)) {
        return failure([`Node type ${node.kind} is not a valid child field type.`]);
    }

    const fieldPath = names.concat(node.name);
    const edgePath = fieldPath.concat('edges');

    return childRecordQuery(node, relationshipInfo, parentAlias, input).map((query) => {
        return [{ type: 'ChildRecordField', path: edgePath.join('.'), connection: query }];
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

function queryContainer<T extends RecordQuery>(
    inputFields: Result<QueryField[], PredicateError[]>,
    jsonAlias: string,
    apiName: string,
    additionalPredicates: ComparisonPredicate[]
): Result<QueryContainer, PredicateError[]> {
    if (inputFields.isSuccess === false) {
        return failure(inputFields.error);
    }

    const extract: JsonExtract = { type: 'JsonExtract', jsonAlias, path: 'apiName' };
    const typePredicate = comparison(extract, 'eq', stringLiteral(apiName));
    const spanningFields = inputFields.value.filter(isSpanningField);
    const predicates: ComparisonPredicate[] = spanningFields
        .map((field) => field.spanning.predicates)
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
    parentAlias: string,
    input: ParserInput
): Result<SpanningQuery, PredicateError[]> {
    const { apiName: fieldName, referenceToaApiName: apiName, relationshipName } = fieldInfo;
    const alias = `${parentAlias}.${relationshipName}`;
    const selections = selection.luvioSelections || [];

    const internalFields = recordFields(selections, [], apiName, alias, input);
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

function scopeFilter(
    scopeArg: LuvioArgumentNode | undefined,
    jsonAlias: string,
    apiName: string,
    input: ParserInput
): Result<Predicate | undefined, string[]> {
    if (scopeArg === undefined) {
        return success(undefined);
    }

    const value = scopeArg.value;
    if (value.kind !== 'EnumValue') {
        return failure(['Scope type should be an EnumValueNode.']);
    }

    const fieldInfo = getFieldInfo(apiName, 'OwnerId', input.objectInfoMap);
    const scope = value.value;

    if (scope === 'MINE') {
        if (fieldInfo === undefined) {
            return failure(['Scope MINE requires the entity type to have an OwnerId field.']);
        }

        return success({
            type: 'comparison',
            left: {
                type: 'JsonExtract',
                jsonAlias,
                path: fieldInfo.apiName,
            },
            operator: 'eq',
            right: {
                type: 'StringLiteral',
                value: input.userId,
            },
        });
    }

    return failure([`Scope '${scope} is not supported.`]);
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

    const first: number | undefined = undefined;
    const whereResult = recordFilter(whereArg, alias, apiName, input.objectInfoMap);
    const scopeResult = scopeFilter(scopeArg, alias, apiName, input);

    let additionalPredicates: Predicate[] = [];
    let filterJoins: string[] = [];

    if (whereResult.isSuccess === false) {
        return failure(whereResult.error);
    }

    if (scopeResult.isSuccess === false) {
        return failure(scopeResult.error);
    }

    if (scopeResult.value !== undefined) {
        additionalPredicates.push(scopeResult.value);
    }

    if (whereResult.value !== undefined) {
        const { predicate, joinPredicates, joinNames } = whereResult.value;

        additionalPredicates.push(predicate, ...joinPredicates);
        filterJoins = joinNames;
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
    const internalFields = recordFields(node.luvioSelections || [], [], apiName, alias, input);
    return queryContainer(internalFields, alias, apiName, predicates).map((result) => {
        const { fields } = result;
        //combine the joins and remove duplicates
        const joinNames = [...new Set(result.joinNames.concat(filterJoins))];

        const predicate = combinePredicates(
            [...additionalPredicates, ...result.predicates].filter(isDefined),
            'and'
        );
        const type = 'connection';

        return { joinNames, fields, first, type, apiName, alias, predicate };
    });
}

function rootRecordQuery(
    selection: LuvioSelectionCustomFieldNode,
    input: ParserInput
): Result<RecordQuery, PredicateError[]> {
    const alias = selection.name;
    const apiName = selection.name;

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
function findRecordSelections(document: LuvioDocumentNode): LuvioSelectionCustomFieldNode[] {
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