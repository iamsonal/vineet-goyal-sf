import {
    LuvioArgumentNode,
    LuvioListValueNode,
    LuvioObjectValueNode,
    LuvioValueNode,
    StringValueNode,
} from '@salesforce/lds-graphql-parser';
import { BooleanValueNode, FloatValueNode, IntValueNode, ListValueNode } from 'graphql/language';
import { DataType, ObjectInfo, ReferenceFieldInfo, ReferenceToInfo } from './info-types';
import {
    BooleanLiteral,
    ComparisonOperator,
    ComparisonPredicate,
    CompoundOperator,
    DoubleLiteral,
    IntLiteral,
    JsonExtract,
    NumberArray,
    PredicateContainer,
    StringArray,
    StringLiteral,
    ValueType,
} from './Predicate';
import {
    errors,
    failure,
    isFailure,
    isSuccess,
    PredicateError,
    PredicateResult,
    Result,
    success,
    values,
} from './Result';
import {
    ExtractKind,
    is,
    isCompoundOperator,
    isListValueNode,
    isObjectValueNode,
} from './type-guards';
import {
    combinePredicates,
    comparison,
    extractPath,
    getFieldInfo,
    isEmptyPredicate,
    referencePredicate,
    stringLiteral,
} from './util';
import { flatMap, flatten } from './util/flatten';

function fieldsToFilters(
    fieldValues: LuvioValueNode[],
    joinAlias: string,
    apiName: string,
    input: { [name: string]: ObjectInfo },
    compoundOperator: CompoundOperator = CompoundOperator.and
): PredicateResult {
    const results = fieldValues
        .map((value): PredicateResult[] => {
            if (!isObjectValueNode(value)) {
                return [failure(['Parent filter node should be an object.'])];
            }

            return Object.entries(value.fields).map(([key, value]) =>
                filter(key, value, joinAlias, apiName, input)
            );
        })
        .reduce(flatten, []);

    const failures = results.filter(isFailure).reduce(flatMap(errors), []);
    if (failures.length > 0) {
        return failure(failures);
    }

    const containers = results.filter(isSuccess).map(values);
    const aliases = containers.map((c) => c.joinNames).reduce(flatten, []);

    const joinNames = [...new Set(aliases)];

    const predicates = containers.map((c) => c.predicate);
    const joinPredicates = containers.reduce(
        flatMap((c) => c.joinPredicates),
        []
    );

    const predicate = combinePredicates(predicates, compoundOperator);

    return success({ predicate, joinNames, joinPredicates });
}

//{where: {Field: ... | and: ... | or: ... | not: ...}}
export function recordFilter(
    where: LuvioArgumentNode | undefined,
    joinAlias: string,
    apiName: string,
    input: { [name: string]: ObjectInfo }
): Result<PredicateContainer | undefined, PredicateError[]> {
    if (where === undefined) {
        return success(undefined);
    }

    return fieldsToFilters([where.value], joinAlias, apiName, input).map((result) =>
        isEmptyPredicate(result.predicate) ? undefined : result
    );
}

function filter<T extends LuvioValueNode>(
    name: string,
    value: T,
    tableAlias: string,
    apiName: string,
    input: { [name: string]: ObjectInfo }
): PredicateResult {
    if (isCompoundOperator(name)) {
        if (!isListValueNode(value)) {
            return failure([`Value for ${name} node must be a list.`]);
        }

        return compoundPredicate(name, value, tableAlias, apiName, input);
    }

    if (!isObjectValueNode(value)) {
        return failure(['Filter node must be an object or list.']);
    }

    return fieldFilter(name, value, tableAlias, apiName, input);
}

function compoundPredicate(
    operator: CompoundOperator,
    list: LuvioListValueNode,
    joinAlias: string,
    apiName: string,
    input: { [name: string]: ObjectInfo }
): PredicateResult {
    return fieldsToFilters(list.values, joinAlias, apiName, input, operator);
}

function spanningFilter(
    fieldInfo: ReferenceFieldInfo,
    fieldNode: LuvioObjectValueNode,
    alias: string,
    input: { [name: string]: ObjectInfo }
): PredicateResult {
    const { apiName: fieldName, referenceToInfos, relationshipName } = fieldInfo;

    const referenceInfo: ReferenceToInfo | undefined = referenceToInfos[0];
    const jsonAlias = `${alias}.${relationshipName}`;
    const joinPredicate = referencePredicate(alias, jsonAlias, fieldName);

    if (referenceInfo === undefined) {
        return failure([`No reference info found for ${fieldName}`]);
    }

    const { apiName } = referenceInfo;
    const path = extractPath('ApiName');
    const extract: JsonExtract = { type: ValueType.Extract, jsonAlias, path };
    const typePredicate = comparison(extract, ComparisonOperator.eq, stringLiteral(apiName));

    return fieldsToFilters([fieldNode], jsonAlias, apiName, input).map((container) => {
        const { predicate, joinNames: names, joinPredicates: predicates } = container;
        const joinPredicates = predicates.concat(joinPredicate, typePredicate);
        const joinNames = names.concat(jsonAlias);

        return { predicate, joinNames, joinPredicates };
    });
}

//{fieldName: {op: ....}}
function fieldFilter(
    fieldName: string,
    fieldNode: LuvioObjectValueNode,
    alias: string,
    apiName: string,
    input: { [name: string]: ObjectInfo }
): PredicateResult {
    const fieldInfo = getFieldInfo(apiName, fieldName, input);

    if (fieldInfo === undefined) {
        return failure([`Field ${fieldName} for type ${apiName} not found.`]);
    }

    if (fieldInfo.dataType === 'Reference' && fieldInfo.relationshipName === fieldName) {
        return spanningFilter(fieldInfo, fieldNode, alias, input);
    }

    //It's possible for a field to have more than one comparison operator which
    //should combine into compound predicate with 'and'
    const operators = fieldOperators(fieldNode, fieldInfo.dataType);

    if (operators.isSuccess === false) {
        return failure(operators.error);
    }

    const comparisons = operators.value.map(
        (op: ScalarOperators | SetOperators): ComparisonPredicate =>
            comparison(
                { type: ValueType.Extract, jsonAlias: alias, path: extractPath(fieldName) },
                op.operator,
                op.value
            )
    );

    const container = {
        predicate: combinePredicates(comparisons, CompoundOperator.and),
        joinNames: [],
        joinPredicates: [],
    };
    return success(container);
}

type ScalarOperatorType =
    | ComparisonOperator.eq
    | ComparisonOperator.ne
    | ComparisonOperator.lt
    | ComparisonOperator.gt
    | ComparisonOperator.lte
    | ComparisonOperator.gte;
type SetOperatorType = ComparisonOperator.in | ComparisonOperator.nin;
type StringOperatorType = ScalarOperatorType | ComparisonOperator.like;
type BooleanOperatorType = ComparisonOperator.eq | ComparisonOperator.ne;

interface Operator<Operator, ValueType, OperatorType> {
    operator: Operator;
    value: ValueType;
    type: OperatorType;
}

type StringOperator = Operator<
    ScalarOperatorType | ComparisonOperator.like,
    StringLiteral,
    'StringOperator'
>;
type IntOperator = Operator<ScalarOperatorType, IntLiteral, 'IntOperator'>;
type DoubleOperator = Operator<ScalarOperatorType, DoubleLiteral, 'DoubleOperator'>;
type BooleanOperator = Operator<ScalarOperatorType, BooleanLiteral, 'BooleanOperator'>;
type DateOperator = Operator<ScalarOperatorType, StringLiteral, 'DateOperator'>;

type StringSetOperator = Operator<SetOperatorType, StringArray, 'StringSetOperator'>;
type IntSetOperator = Operator<SetOperatorType, NumberArray, 'IntSetOperator'>;
type DoubleSetOperator = Operator<SetOperatorType, NumberArray, 'DoubleSetOperator'>;

type ScalarOperators =
    | StringOperator
    | IntOperator
    | DoubleOperator
    | BooleanOperator
    | DateOperator;
type SetOperators = StringSetOperator | IntSetOperator | DoubleSetOperator;

function fieldOperators(
    operatorNode: LuvioObjectValueNode,
    dataType: DataType
): Result<(ScalarOperators | SetOperators)[], PredicateError[]> {
    const results = Object.entries(operatorNode.fields).map(([key, value]) =>
        operatorWithValue(key, value, dataType)
    );

    const _values = results.filter(isSuccess).map(values);
    const fails = results.filter(isFailure).map(errors);

    if (fails.length > 0) {
        return failure(fails);
    }

    return success(_values);
}

function isSetOperatorType(value: string): value is SetOperatorType {
    let values: SetOperatorType[] = [ComparisonOperator.in, ComparisonOperator.nin];
    return values.includes(value as SetOperatorType);
}

function isScalarOperatorType(value: string): value is ScalarOperatorType {
    let values: ScalarOperatorType[] = [
        ComparisonOperator.eq,
        ComparisonOperator.ne,
        ComparisonOperator.lt,
        ComparisonOperator.gt,
        ComparisonOperator.lte,
        ComparisonOperator.gte,
    ];
    return values.includes(value as ScalarOperatorType);
}

function isBooleanOperatorType(value: string): value is BooleanOperatorType {
    return value === ComparisonOperator.eq || value === ComparisonOperator.ne;
}

function isStringOperatorType(value: string): value is StringOperatorType {
    return isScalarOperatorType(value) || value === ComparisonOperator.like;
}

function listNodeToTypeArray<T extends { kind: ExtractKind<T>; value: U }, U>(
    list: { values: LuvioValueNode[] },
    kind: ExtractKind<T>
): Result<U[], PredicateError> {
    const typeAssert = (node: LuvioValueNode): node is T => is<T>(node, kind);

    const badValue = list.values.filter((n) => !typeAssert(n))[0];
    if (badValue !== undefined) {
        return failure(`${JSON.stringify(badValue)} is not a valid value in list of ${kind}.`);
    }

    const values = list.values.filter(typeAssert).map((u) => u.value);

    return success(values);
}

function operatorWithValue(
    operator: string,
    value: LuvioValueNode,
    schemaType: DataType
): Result<ScalarOperators | SetOperators, PredicateError> {
    if (schemaType === 'String' || schemaType === 'Reference') {
        if (isStringOperatorType(operator)) {
            return is<StringValueNode>(value, 'StringValue')
                ? success({
                      type: 'StringOperator',
                      operator,
                      value: { type: ValueType.StringLiteral, value: value.value },
                  })
                : failure<ScalarOperators, PredicateError>(`Comparison value must be a string.`);
        }

        if (isSetOperatorType(operator)) {
            return is<ListValueNode>(value, 'ListValue')
                ? listNodeToTypeArray<StringValueNode, string>(value, 'StringValue').map(
                      (value) => {
                          return {
                              operator,
                              type: 'StringSetOperator',
                              value: { type: ValueType.StringArray, value },
                          };
                      }
                  )
                : failure<StringSetOperator, PredicateError>(
                      `Comparison value must be a string array.`
                  );
        }
    }

    if (schemaType === 'Int') {
        if (isScalarOperatorType(operator)) {
            return is<IntValueNode>(value, 'IntValue')
                ? success({
                      type: 'IntOperator',
                      operator,
                      value: { type: ValueType.IntLiteral, value: parseInt(value.value) },
                  })
                : failure<ScalarOperators, PredicateError>(`Comparison value must be an int.`);
        }

        if (isSetOperatorType(operator)) {
            return is<ListValueNode>(value, 'ListValue')
                ? listNodeToTypeArray<IntValueNode, string>(value, 'IntValue').map((strings) => {
                      return {
                          operator,
                          type: 'IntSetOperator',
                          value: {
                              type: ValueType.NumberArray,
                              value: strings.map((s) => parseInt(s)),
                          },
                      };
                  })
                : failure<IntSetOperator, PredicateError>(`Comparison value must be an int array.`);
        }
    }

    if (schemaType === 'Double') {
        if (isScalarOperatorType(operator)) {
            return is<FloatValueNode>(value, 'FloatValue')
                ? success({
                      type: 'DoubleOperator',
                      operator,
                      value: { type: ValueType.DoubleLiteral, value: parseFloat(value.value) },
                  })
                : failure<ScalarOperators, PredicateError>(`Comparison value must be a double.`);
        }

        if (isSetOperatorType(operator)) {
            return is<ListValueNode>(value, 'ListValue')
                ? listNodeToTypeArray<FloatValueNode, string>(value, 'FloatValue').map(
                      (strings) => {
                          return {
                              operator,
                              type: 'DoubleSetOperator',
                              value: {
                                  type: ValueType.NumberArray,
                                  value: strings.map(parseFloat),
                              },
                          };
                      }
                  )
                : failure<DoubleSetOperator, PredicateError>(
                      `Comparison value must be a double array.`
                  );
        }
    }

    if (schemaType === 'Boolean') {
        if (isBooleanOperatorType(operator)) {
            return is<BooleanValueNode>(value, 'BooleanValue')
                ? success({
                      type: 'BooleanOperator',
                      operator,
                      value: { type: ValueType.BooleanLiteral, value: value.value },
                  })
                : failure<ScalarOperators, PredicateError>(`Comparison value must be a boolean.`);
        }
    }

    return failure(`Comparison operator ${operator} is not supported for type ${schemaType}.`);
}
