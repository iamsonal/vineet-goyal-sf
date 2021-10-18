export enum PredicateType {
    compound = 'compound',
    comparison = 'comparison',
    not = 'not',
    nullComparison = 'nullComparison',
}

export enum CompoundOperator {
    and = 'and',
    or = 'or',
}

export enum NullComparisonOperator {
    is = 'is',
    isNot = 'isNot',
}

export enum ComparisonOperator {
    eq = 'eq',
    ne = 'ne',
    like = 'like',
    lt = 'lt',
    gt = 'gt',
    lte = 'lte',
    gte = 'gte',
    in = 'in',
    nin = 'nin',
}

export enum DateEnumType {
    today,
    tomorrow,
}

export enum FieldType {
    Child = 'ChildField',
    Scalar = 'ScalarField',
    Spanning = 'SpanningField',
}

export enum ValueType {
    Extract = 'JsonExtract',
    BooleanLiteral = 'BooleanLiteral',
    DoubleLiteral = 'DoubleLiteral',
    IntLiteral = 'IntLiteral',
    Identifier = 'Identifier',
    StringLiteral = 'StringLiteral',
    StringArray = 'StringArray',
    NumberArray = 'NumberArray',
    DateEnum = 'DateEnum',
    DateValue = 'DateValue',
    DateArray = 'DateArray',
    DateTimeEnum = 'DateTimeEnum',
    DateTimeValue = 'DateTimeValue',
    DateTimeArray = 'DateTimeArray',
    NullValue = 'NullValue',
}

export type LiteralValue =
    | StringLiteral
    | DoubleLiteral
    | IntLiteral
    | BooleanLiteral
    | StringArray
    | NumberArray
    | DateInput
    | DateTimeInput
    | DateArray
    | DateTimeArray
    | NullValue;

interface Value<Type, ValueType> {
    type: Type;
    value: ValueType;
}

export interface NullValue {
    type: ValueType.NullValue;
}

export type StringLiteral = Value<ValueType.StringLiteral, string>;
export type IntLiteral = Value<ValueType.IntLiteral, number>;
export type DoubleLiteral = Value<ValueType.DoubleLiteral, number>;
export type BooleanLiteral = Value<ValueType.BooleanLiteral, Boolean>;
export type NumberArray = Value<ValueType.NumberArray, number[]>;
export type StringArray = Value<ValueType.StringArray, string[]>;
export type DateEnum = Value<ValueType.DateEnum, DateEnumType>;
export type DateValue = Value<ValueType.DateValue, string>;
export type DateTimeEnum = Value<ValueType.DateTimeEnum, DateEnumType>;
export type DateTimeValue = Value<ValueType.DateTimeValue, string>;
export type DateInput = DateValue | DateEnum | NullValue;
export type DateTimeInput = DateTimeValue | DateTimeEnum | NullValue;
export type DateArray = Value<ValueType.DateArray, DateInput[]>;
export type DateTimeArray = Value<ValueType.DateTimeArray, DateTimeInput[]>;

export interface ComparisonPredicate {
    type: PredicateType.comparison;
    operator: ComparisonOperator;
    left: JsonExtract;
    right: Expression;
}

export interface NotPredicate {
    type: PredicateType.not;
    child: Predicate;
}
export interface NullComparisonPredicate {
    type: PredicateType.nullComparison;
    operator: NullComparisonOperator;
    left: JsonExtract;
}

export interface CompoundPredicate {
    type: PredicateType.compound;
    operator: CompoundOperator;
    children: Predicate[];
}

export interface PredicateContainer {
    predicate: Predicate;
    joinNames: string[];
    joinPredicates: ComparisonPredicate[];
}

export interface JsonExtract {
    type: ValueType.Extract;
    jsonAlias: string;
    path: string;
}
export interface ScalarField {
    type: FieldType.Scalar;
    path: string;
    extract: JsonExtract;
}

export interface ChildField {
    type: FieldType.Child;
    path: string;
    connection: RecordQuery;
}

export interface RootQuery {
    type: 'root';
    connections: RecordQuery[];
}

export interface RecordQuery {
    type: 'connection';
    predicate: Predicate | undefined;
    fields: RecordQueryField[];
    alias: string;
    apiName: string;
    first: number | undefined;
    joinNames: string[];
}

export type RecordQueryField = ChildField | ScalarField;
export type Expression = LiteralValue | JsonExtract;
export type Predicate =
    | CompoundPredicate
    | ComparisonPredicate
    | NotPredicate
    | NullComparisonPredicate;

export function isCompoundPredicate(predicate: Predicate): predicate is CompoundPredicate {
    return predicate.type === PredicateType.compound;
}

export function isComparisonPredicate(predicate: Predicate): predicate is ComparisonPredicate {
    return predicate.type === PredicateType.comparison;
}

export function isNullComparisonPredicate(
    predicate: Predicate
): predicate is NullComparisonPredicate {
    return predicate.type === PredicateType.nullComparison;
}

export function isNotPredicate(predicate: Predicate): predicate is NotPredicate {
    return predicate.type === PredicateType.not;
}
