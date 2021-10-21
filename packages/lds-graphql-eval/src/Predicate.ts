export enum PredicateType {
    compound = 'compound',
    comparison = 'comparison',
    not = 'not',
    nullComparison = 'nullComparison',
    recordRepresentation = 'recordRepresentation',
    exists = 'exists',
    between = 'between',
    dateFunction = 'dateFunction',
}

export enum DateFunction {
    dayOfMonth = 'DAY_OF_MONTH',
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

export enum DateRangeEnumType {
    last_n_months,
    last_n_days,
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
    DateRange = 'DateRange',
    DateTimeEnum = 'DateTimeEnum',
    DateTimeValue = 'DateTimeValue',
    DateTimeArray = 'DateTimeArray',
    DateTimeRange = 'DateTimeRange',
    RelativeDate = 'RelativeDate',
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
    | RelativeDate
    | NullValue;

interface Value<Type, ValueType> {
    type: Type;
    value: ValueType;
}

export interface NullValue {
    type: ValueType.NullValue;
}

export interface DateRange {
    type: ValueType.DateRange;
    start: RelativeDate;
    end: RelativeDate;
}

export interface DateTimeRange {
    type: ValueType.DateTimeRange;
    start: RelativeDate;
    end: RelativeDate;
}

export interface RelativeDate {
    type: ValueType.RelativeDate;
    unit: 'month' | 'day';
    amount: number;
    offset: 'start' | 'end' | undefined;
    hasTime: boolean;
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
export type DateInput = DateValue | DateEnum | DateRange | NullValue;
export type DateTimeInput = DateTimeValue | DateTimeEnum | DateTimeRange | NullValue;
export type DateArray = Value<ValueType.DateArray, DateInput[]>;
export type DateTimeArray = Value<ValueType.DateTimeArray, DateTimeInput[]>;

export interface ComparisonPredicate {
    type: PredicateType.comparison;
    operator: ComparisonOperator;
    left: JsonExtract;
    right: Expression;
}

export interface BetweenPredicate {
    type: PredicateType.between;
    compareDate: JsonExtract;
    start: RelativeDate;
    end: RelativeDate;
}

export interface NotPredicate {
    type: PredicateType.not;
    child: Predicate;
}

export interface DateFunctionPredicate {
    type: PredicateType.dateFunction;
    extract: JsonExtract;
    function: DateFunction;
    operator: ComparisonOperator;
    value: number;
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

export interface ExistsPredicate {
    type: PredicateType.exists;
    predicate: Predicate;
    joinNames: string[];
    alias: string;
}
export interface PredicateContainer {
    predicate: Predicate;
    joinNames: string[];
    joinPredicates: ComparisonPredicate[];
}

export interface OrderByContainer {
    orderBy: OrderBy;
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

export interface OrderBy {
    extract: JsonExtract;
    asc: boolean;
    nullsFirst: boolean;
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
    orderBy: OrderBy | undefined;
    joinNames: string[];
}

export type RecordQueryField = ChildField | ScalarField;
export type Expression = LiteralValue | JsonExtract;
export type Predicate =
    | CompoundPredicate
    | ComparisonPredicate
    | ExistsPredicate
    | DateFunctionPredicate
    | BetweenPredicate
    | NotPredicate
    | NullComparisonPredicate;

export function isCompoundPredicate(predicate: Predicate): predicate is CompoundPredicate {
    return predicate.type === PredicateType.compound;
}

export function isComparisonPredicate(predicate: Predicate): predicate is ComparisonPredicate {
    return predicate.type === PredicateType.comparison;
}

export function isBetweenPredicate(predicate: Predicate): predicate is BetweenPredicate {
    return predicate.type === PredicateType.between;
}

export function isNullComparisonPredicate(
    predicate: Predicate
): predicate is NullComparisonPredicate {
    return predicate.type === PredicateType.nullComparison;
}

export function isNotPredicate(predicate: Predicate): predicate is NotPredicate {
    return predicate.type === PredicateType.not;
}

export function isExistsPredicate(predicate: Predicate): predicate is ExistsPredicate {
    return predicate.type === PredicateType.exists;
}

export function isDateFunctionPredicate(predicate: Predicate): predicate is DateFunctionPredicate {
    return predicate.type === PredicateType.dateFunction;
}
