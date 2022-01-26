import {
    LuvioArgumentNode,
    LuvioListValueNode,
    LuvioObjectValueNode,
    LuvioValueNode,
    StringValueNode,
} from '@luvio/graphql-parser';
import {
    BooleanValueNode,
    EnumValueNode,
    FloatValueNode,
    IntValueNode,
    ListValueNode,
    NullValueNode,
} from 'graphql/language';
import { message, PredicateError } from './Error';
import { DataType, ObjectInfo, ReferenceFieldInfo, ReferenceToInfo } from './info-types';
import {
    BooleanLiteral,
    ComparisonOperator,
    CompoundOperator,
    DateArray,
    DateEnumType,
    DateFunction,
    DateFunctionPredicate,
    DateInput,
    DateRange,
    DateTimeArray,
    DateTimeInput,
    DateTimeRange,
    DoubleLiteral,
    IntLiteral,
    JsonExtract,
    NotPredicate,
    NullComparisonOperator,
    NullValue,
    NumberArray,
    Predicate,
    PredicateContainer,
    PredicateType,
    RelativeDate,
    StringArray,
    StringLiteral,
    ValueType,
} from './Predicate';
import {
    errors,
    failure,
    flattenResults,
    isFailure,
    isSuccess,
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

const NotOperator = 'not';
const { eq, ne, gt, gte, lt, lte, nin, like } = ComparisonOperator;
const inOp = ComparisonOperator.in;

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
                return [failure([message('Parent filter node should be an object.')])];
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
            return failure([message(`Value for ${name} node must be a list.`)]);
        }

        return compoundPredicate(name, value, tableAlias, apiName, input);
    }

    if (name === NotOperator) {
        return fieldsToFilters([value], tableAlias, apiName, input).map((result) => {
            const predicate: NotPredicate = { type: PredicateType.not, child: result.predicate };
            return { ...result, predicate };
        });
    }

    if (!isObjectValueNode(value)) {
        return failure([message('Filter node must be an object or list.')]);
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
        return failure([message(`No reference info found for ${fieldName}`)]);
    }

    const { apiName } = referenceInfo;
    const path = extractPath('ApiName');
    const extract: JsonExtract = { type: ValueType.Extract, jsonAlias, path };
    const typePredicate = comparison(extract, eq, stringLiteral(apiName));

    return fieldsToFilters([fieldNode], jsonAlias, apiName, input).map((container) => {
        const { predicate, joinNames: names, joinPredicates: predicates } = container;
        const joinPredicates = predicates.concat(joinPredicate, typePredicate);
        const joinNames = names.concat(jsonAlias);

        return { predicate, joinNames, joinPredicates };
    });
}

function fieldFilter(
    fieldName: string,
    fieldNode: LuvioObjectValueNode,
    alias: string,
    apiName: string,
    input: { [name: string]: ObjectInfo }
): PredicateResult {
    const fieldInfoResult = getFieldInfo(apiName, fieldName, input);
    if (fieldInfoResult.isSuccess === false) {
        return failure([fieldInfoResult.error]);
    }

    const fieldInfo = fieldInfoResult.value;
    if (fieldInfo === undefined) {
        return failure([message(`Field ${fieldName} for type ${apiName} not found.`)]);
    }

    if (fieldInfo.dataType === 'Reference' && fieldInfo.relationshipName === fieldName) {
        return spanningFilter(fieldInfo, fieldNode, alias, input);
    }

    const extract: JsonExtract = {
        type: ValueType.Extract,
        jsonAlias: alias,
        path: extractPath(fieldName),
    };
    const dateFunction = dateFunctions(fieldNode, extract, fieldInfo.dataType);

    //It's possible for a field to have more than one comparison operator which
    //should combine into compound predicate with 'and'
    const operators = fieldOperators(fieldNode, fieldInfo.dataType);

    if (dateFunction.isSuccess === false) {
        return failure(dateFunction.error);
    }

    if (operators.isSuccess === false) {
        return failure(operators.error);
    }

    const comparisons = operators.value.map(
        (op: ScalarOperators | SetOperators | NullOperator): Predicate => {
            if (op.type === 'NullOperator') {
                return { type: PredicateType.nullComparison, left: extract, operator: op.operator };
            }

            if (op.type === 'DateOperator' && op.value.type === ValueType.DateRange) {
                return dateRangeComparison(op.value, op.operator, extract);
            }

            if (op.type === 'DateTimeOperator' && op.value.type === ValueType.DateTimeRange) {
                return dateRangeComparison(op.value, op.operator, extract);
            }

            return comparison(extract, op.operator, op.value);
        }
    );

    const combined = combinePredicates(
        comparisons.concat(...dateFunction.value),
        CompoundOperator.and
    );

    const container = {
        predicate: combined,
        joinNames: [],
        joinPredicates: [],
    };
    return success(container);
}

export function dateRangeComparison(
    dateRange: DateRange | DateTimeRange,
    operator: ScalarOperatorType,
    compareDate: JsonExtract
): Predicate {
    switch (operator) {
        case eq:
            return {
                type: PredicateType.between,
                compareDate,
                start: dateRange.start,
                end: dateRange.end,
            };
        case ne:
            return {
                type: PredicateType.not,
                child: {
                    type: PredicateType.between,
                    compareDate,
                    start: dateRange.start,
                    end: dateRange.end,
                },
            };
        case lt:
            return comparison(compareDate, lt, dateRange.start);
        case lte:
            return comparison(compareDate, lte, dateRange.end);
        case gt:
            return comparison(compareDate, gt, dateRange.end);
        case gte:
            return comparison(compareDate, gte, dateRange.start);
    }
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
type PicklistOperatorType = ComparisonOperator.eq | ComparisonOperator.ne;

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

type NullOperator = Omit<Operator<NullComparisonOperator, never, 'NullOperator'>, 'value'>;

type IntOperator = Operator<ScalarOperatorType, IntLiteral, 'IntOperator'>;
type DoubleOperator = Operator<ScalarOperatorType, DoubleLiteral, 'DoubleOperator'>;
type BooleanOperator = Operator<ScalarOperatorType, BooleanLiteral, 'BooleanOperator'>;
type DateOperator = Operator<ScalarOperatorType, DateInput, 'DateOperator'>;
type DateTimeOperator = Operator<ScalarOperatorType, DateTimeInput, 'DateTimeOperator'>;
type PicklistOperator = Operator<PicklistOperatorType, StringLiteral, 'PicklistOperator'>;

type StringSetOperator = Operator<SetOperatorType, StringArray, 'StringSetOperator'>;
type PicklistSetOperator = Operator<SetOperatorType, StringArray, 'PicklistSetOperator'>;
type DateSetOperator = Operator<SetOperatorType, DateArray, 'DateSetOperator'>;
type DateTimeSetOperator = Operator<SetOperatorType, DateTimeArray, 'DateTimeSetOperator'>;
type IntSetOperator = Operator<SetOperatorType, NumberArray, 'IntSetOperator'>;
type DoubleSetOperator = Operator<SetOperatorType, NumberArray, 'DoubleSetOperator'>;

type ScalarOperators =
    | StringOperator
    | DateOperator
    | DateTimeOperator
    | IntOperator
    | DoubleOperator
    | BooleanOperator
    | PicklistOperator;

type SetOperators =
    | StringSetOperator
    | DateSetOperator
    | DateTimeSetOperator
    | IntSetOperator
    | DoubleSetOperator
    | PicklistSetOperator;

const dateRegEx = /^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/;
const dateTimeRegEx =
    /^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))T(2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]\.[0-9]{3}Z$/;

function dateFunctions(
    operatorNode: LuvioObjectValueNode,
    extract: JsonExtract,
    dataType: DataType
): Result<DateFunctionPredicate[], PredicateError[]> {
    if (dataType !== 'Date' && dataType !== 'DateTime') {
        return success([]);
    }

    const results = Object.entries(operatorNode.fields).map(
        ([key, valueNode]): Result<DateFunctionPredicate[], PredicateError[]> => {
            if (isFilterFunction(key) === false) {
                return success([]);
            }
            if (!isObjectValueNode(valueNode)) {
                return failure([message('Date function expects an object node.')]);
            }

            const [opKey, opValue] = Object.entries(valueNode.fields)[0];
            const result = operatorWithValue(opKey, opValue, 'Int')
                .flatMap((op): Result<DateFunctionPredicate, PredicateError[]> => {
                    if (op.type !== 'IntOperator') {
                        return failure([message('Date function expects Int values')]);
                    }

                    const predicate: DateFunctionPredicate = {
                        type: PredicateType.dateFunction,
                        operator: op.operator,
                        function: DateFunction.dayOfMonth,
                        value: op.value.value,
                        extract,
                    };
                    return success(predicate);
                })
                .map((r) => [r]);

            return result;
        }
    );

    const fails = results.filter(isFailure).reduce(flatMap(errors), []);
    if (fails.length > 0) {
        return failure(fails);
    }
    const vals = results.filter(isSuccess).reduce(flatMap(values), []);

    return success(vals);
}

function isFilterFunction(name: string): boolean {
    return name === 'DAY_OF_MONTH';
}

function fieldOperators(
    operatorNode: LuvioObjectValueNode,
    dataType: DataType
): Result<(ScalarOperators | SetOperators | NullOperator | PicklistOperator)[], PredicateError[]> {
    const results = Object.entries(operatorNode.fields)
        .filter(([key, _]) => isFilterFunction(key) === false)
        .map(([key, value]) => operatorWithValue(key, value, dataType));

    const _values = results.filter(isSuccess).map(values);
    const fails = results.filter(isFailure).reduce(flatMap(errors), []);

    if (fails.length > 0) {
        return failure(fails);
    }

    return success(_values);
}

function isSetOperatorType(value: string): value is SetOperatorType {
    let values: SetOperatorType[] = [inOp, nin];
    return values.includes(value as SetOperatorType);
}

function isScalarOperatorType(value: string): value is ScalarOperatorType {
    let values: ScalarOperatorType[] = [eq, ne, lt, gt, lte, gte];
    return values.includes(value as ScalarOperatorType);
}

function isBooleanOperatorType(value: string): value is BooleanOperatorType {
    return value === eq || value === ne;
}

function nullOperatorTypeFrom(value: string): NullComparisonOperator | undefined {
    switch (value) {
        case eq:
            return NullComparisonOperator.is;
        case ne:
            return NullComparisonOperator.isNot;
    }
}

function isStringOperatorType(value: string): value is StringOperatorType {
    return isScalarOperatorType(value) || value === like;
}

function isPicklistOperatorType(value: string): value is PicklistOperatorType {
    let values: PicklistOperatorType[] = [eq, ne];
    return values.includes(value as PicklistOperatorType);
}

function listNodeToTypeArray<T extends { kind: ExtractKind<T>; value: U }, U>(
    list: { values: LuvioValueNode[] },
    kind: ExtractKind<T>
): Result<U[], PredicateError> {
    const typeAssert = (node: LuvioValueNode): node is T => is<T>(node, kind);

    const badValue = list.values.filter((n) => !typeAssert(n))[0];
    if (badValue !== undefined) {
        return failure(
            message(`${JSON.stringify(badValue)} is not a valid value in list of ${kind}.`)
        );
    }

    const values = list.values.filter(typeAssert).map((u) => u.value);

    return success(values);
}

function operatorWithValue(
    operator: string,
    value: LuvioValueNode,
    schemaType: DataType
): Result<ScalarOperators | SetOperators | NullOperator, PredicateError[]> {
    if (is<NullValueNode>(value, 'NullValue')) {
        return parseNullValue(operator).mapError((e) => [e]);
    }

    if (schemaType === 'String' || schemaType === 'Reference') {
        if (isStringOperatorType(operator)) {
            return is<StringValueNode>(value, 'StringValue')
                ? success({
                      type: 'StringOperator',
                      operator,
                      value: { type: ValueType.StringLiteral, value: value.value },
                  })
                : failure([message(`Comparison value must be a string.`)]);
        }

        if (isSetOperatorType(operator)) {
            return is<ListValueNode>(value, 'ListValue')
                ? listNodeToTypeArray<StringValueNode, string>(value, 'StringValue')
                      .map((value): StringSetOperator => {
                          return {
                              operator,
                              type: 'StringSetOperator',
                              value: { type: ValueType.StringArray, value },
                          };
                      })
                      .mapError((e) => [e])
                : failure([message(`Comparison value must be a string array.`)]);
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
                : failure([message(`Comparison value must be an int.`)]);
        }

        if (isSetOperatorType(operator)) {
            return is<ListValueNode>(value, 'ListValue')
                ? listNodeToTypeArray<IntValueNode, string>(value, 'IntValue')
                      .map((strings): IntSetOperator => {
                          return {
                              operator,
                              type: 'IntSetOperator',
                              value: {
                                  type: ValueType.NumberArray,
                                  value: strings.map((s) => parseInt(s)),
                              },
                          };
                      })
                      .mapError((e) => [e])
                : failure([message(`Comparison value must be an int array.`)]);
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
                : failure([message(`Comparison value must be a double.`)]);
        }

        if (isSetOperatorType(operator)) {
            return is<ListValueNode>(value, 'ListValue')
                ? listNodeToTypeArray<FloatValueNode, string>(value, 'FloatValue')
                      .map((strings): DoubleSetOperator => {
                          return {
                              operator,
                              type: 'DoubleSetOperator',
                              value: {
                                  type: ValueType.NumberArray,
                                  value: strings.map(parseFloat),
                              },
                          };
                      })
                      .mapError((e) => [e])
                : failure([message(`Comparison value must be a double array.`)]);
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
                : failure([message(`Comparison value must be a boolean.`)]);
        }
    }

    if (schemaType === 'Date') {
        if (isScalarOperatorType(operator)) {
            const result = dateInput(value).mapError((e) => [e]);
            if (result.isSuccess === false) {
                return failure(result.error);
            }

            const { value: input } = result;
            if (input.type === ValueType.NullValue) {
                return parseNullValue(operator).mapError((e) => [e]);
            }

            return success({ type: 'DateOperator', operator, value: input });
        }

        if (isSetOperatorType(operator)) {
            if (is<ListValueNode>(value, 'ListValue')) {
                return flattenResults(value.values.map(dateInput)).map((value) => {
                    return {
                        type: 'DateSetOperator',
                        operator,
                        value: { type: ValueType.DateArray, value },
                    };
                });
            }

            return failure([message('Comparison value must be a date array.')]);
        }
    }

    if (schemaType === 'DateTime') {
        if (isScalarOperatorType(operator)) {
            const result = dateTimeInput(value).mapError((e) => [e]);
            if (result.isSuccess === false) {
                return failure(result.error);
            }

            const { value: input } = result;
            if (input.type === ValueType.NullValue) {
                return parseNullValue(operator).mapError((e) => [e]);
            }

            return success({ type: 'DateTimeOperator', operator, value: input });
        }

        if (isSetOperatorType(operator)) {
            if (is<ListValueNode>(value, 'ListValue')) {
                return flattenResults(value.values.map(dateTimeInput)).map((value) => {
                    return {
                        type: 'DateTimeSetOperator',
                        operator,
                        value: { type: ValueType.DateTimeArray, value },
                    };
                });
            }

            return failure([message('Comparison value must be a date time array.')]);
        }
    }

    if (schemaType === 'Picklist') {
        if (isPicklistOperatorType(operator)) {
            return is<StringValueNode>(value, 'StringValue')
                ? success({
                      type: 'PicklistOperator',
                      operator,
                      value: { type: ValueType.StringLiteral, value: value.value },
                  })
                : failure([message(`Comparison value must be a picklist.`)]);
        }

        if (isSetOperatorType(operator)) {
            return is<ListValueNode>(value, 'ListValue')
                ? listNodeToTypeArray<StringValueNode, string>(value, 'StringValue')
                      .map((value): PicklistSetOperator => {
                          return {
                              operator,
                              type: 'PicklistSetOperator',
                              value: { type: ValueType.StringArray, value },
                          };
                      })
                      .mapError((e) => [e])
                : failure([message(`Comparison value must be a picklist array.`)]);
        }
    }

    return failure([
        message(`Comparison operator ${operator} is not supported for type ${schemaType}.`),
    ]);
}

function dateInput(node: LuvioValueNode): Result<DateInput, PredicateError> {
    return parseDateNode(node, dateRegEx, false, 'YYYY-MM-DD').map((result) => {
        switch (result.type) {
            case ValueType.NullValue:
                return result;
            case ValueType.StringLiteral:
                return { type: ValueType.DateValue, value: result.value };
            case 'range':
                return { type: ValueType.DateRange, start: result.start, end: result.end };
            case 'enum':
                return { type: ValueType.DateEnum, value: result.value };
        }
    });
}

function dateTimeInput(node: LuvioValueNode): Result<DateTimeInput, PredicateError> {
    return parseDateNode(node, dateTimeRegEx, true, 'YYYY-MM-DDTHH:MM:SS.SSSZ').map((result) => {
        switch (result.type) {
            case ValueType.NullValue:
                return result;
            case ValueType.StringLiteral:
                return { type: ValueType.DateTimeValue, value: result.value };
            case 'range':
                return { type: ValueType.DateTimeRange, start: result.start, end: result.end };
            case 'enum':
                return { type: ValueType.DateTimeEnum, value: result.value };
        }
    });
}

function parseNullValue(op: string): Result<NullOperator, PredicateError> {
    const operator = nullOperatorTypeFrom(op);
    if (operator !== undefined) {
        return success({ type: 'NullOperator', operator });
    }

    return failure(message(`Null can not be compared with ${op}`));
}

type DateNodeResult =
    | StringLiteral
    | NullValue
    | { type: 'enum'; value: DateEnumType }
    | { type: 'range'; start: RelativeDate; end: RelativeDate };

function parseDateNode(
    node: LuvioValueNode,
    regex: RegExp,
    hasTime: boolean,
    dateFormat: string
): Result<DateNodeResult, PredicateError> {
    const typeName = hasTime ? 'DateTime' : 'Date';
    if (!isObjectValueNode(node)) {
        return failure(message(`Comparison value must be a ${typeName} input.`));
    }

    const valueField = node.fields['value'];
    if (valueField !== undefined) {
        if (is<StringValueNode>(valueField, 'StringValue')) {
            if (valueField.value.match(regex)) {
                return success({ type: ValueType.StringLiteral, value: valueField.value });
            }

            return failure(message(`${typeName} format must be ${dateFormat}.`));
        }

        if (is<NullValueNode>(valueField, 'NullValue')) {
            return success({ type: ValueType.NullValue });
        }

        return failure(message(`${typeName} input value field must be a string.`));
    }

    const literalField = node.fields['literal'];
    if (literalField !== undefined) {
        if (is<EnumValueNode>(literalField, 'EnumValue')) {
            switch (literalField.value) {
                case 'TODAY':
                    return success({ type: 'enum', value: DateEnumType.today });
                case 'TOMORROW':
                    return success({ type: 'enum', value: DateEnumType.tomorrow });
                default:
                    return failure(message(`Unknown ${typeName} literal ${literalField.value}.`));
            }
        }

        return failure(message(`${typeName} input literal field must be an enum.`));
    }

    const rangeField = node.fields['range'];
    if (rangeField !== undefined) {
        if (is<LuvioObjectValueNode>(rangeField, 'ObjectValue')) {
            const fieldsField = rangeField.fields;
            const last_n_months = fieldsField['last_n_months'];
            if (last_n_months !== undefined) {
                if (is<IntValueNode>(last_n_months, 'IntValue')) {
                    const amount = -parseInt(last_n_months.value);
                    const start: RelativeDate = {
                        type: ValueType.RelativeDate,
                        unit: 'month',
                        amount,
                        offset: 'start',
                        hasTime,
                    };
                    const end: RelativeDate = {
                        type: ValueType.RelativeDate,
                        unit: 'month',
                        amount: -1,
                        offset: 'end',
                        hasTime,
                    };
                    return success({ type: 'range', start, end });
                }
            }
            const next_n_months = fieldsField['next_n_months'];
            if (next_n_months !== undefined) {
                if (is<IntValueNode>(next_n_months, 'IntValue')) {
                    const amount = parseInt(next_n_months.value);
                    const start: RelativeDate = {
                        type: ValueType.RelativeDate,
                        unit: 'month',
                        amount: 1,
                        offset: 'start',
                        hasTime,
                    };
                    const end: RelativeDate = {
                        type: ValueType.RelativeDate,
                        unit: 'month',
                        amount,
                        offset: 'end',
                        hasTime,
                    };
                    return success({ type: 'range', start, end });
                }
            }
            const last_n_days = fieldsField['last_n_days'];
            if (last_n_days !== undefined) {
                if (is<IntValueNode>(last_n_days, 'IntValue')) {
                    const amount = -parseInt(last_n_days.value);
                    const start: RelativeDate = {
                        type: ValueType.RelativeDate,
                        unit: 'day',
                        amount,
                        offset: undefined,
                        hasTime,
                    };
                    const end: RelativeDate = {
                        type: ValueType.RelativeDate,
                        unit: 'day',
                        amount: 0,
                        offset: undefined,
                        hasTime,
                    };
                    return success({ type: 'range', start, end });
                }
            }
            const next_n_days = fieldsField['next_n_days'];
            if (next_n_days !== undefined) {
                if (is<IntValueNode>(next_n_days, 'IntValue')) {
                    const amount = parseInt(next_n_days.value);
                    const start: RelativeDate = {
                        type: ValueType.RelativeDate,
                        unit: 'day',
                        amount: 1,
                        offset: undefined,
                        hasTime,
                    };
                    const end: RelativeDate = {
                        type: ValueType.RelativeDate,
                        unit: 'day',
                        amount,
                        offset: undefined,
                        hasTime,
                    };
                    return success({ type: 'range', start, end });
                }
            }
            return failure(message(`invalid date range name`));
        }
        return failure(message(`${typeName} range must be an object.`));
    }

    return failure(message(`${typeName} input must include a value or literal field.`));
}
