export enum PredicateType {
    compound = 'compound',
    comparison = 'comparison',
}

export enum CompoundOperator {
    and = 'and',
    or = 'or',
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
}

export interface ComparisonPredicate {
    type: PredicateType.comparison;
    operator: ComparisonOperator;
    left: Expression;
    right: Expression;
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

export interface Identifier {
    type: ValueType.Identifier;
    value: string;
}

export type LiteralValue =
    | StringLiteral
    | DoubleLiteral
    | IntLiteral
    | BooleanLiteral
    | StringArray
    | NumberArray;

export interface StringLiteral {
    type: ValueType.StringLiteral;
    value: string;
}

export interface StringArray {
    type: ValueType.StringArray;
    value: string[];
}

export interface NumberArray {
    type: ValueType.NumberArray;
    value: number[];
}

export interface IntLiteral {
    type: ValueType.IntLiteral;
    value: number;
}

export interface DoubleLiteral {
    type: ValueType.DoubleLiteral;
    value: number;
}

export interface BooleanLiteral {
    type: ValueType.BooleanLiteral;
    value: Boolean;
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
export type Expression = Identifier | LiteralValue | JsonExtract;
export type Predicate = CompoundPredicate | ComparisonPredicate;

export function isCompoundPredicate(predicate: Predicate): predicate is CompoundPredicate {
    return predicate.type === PredicateType.compound;
}

export function isComparisonPredicate(predicate: Predicate): predicate is ComparisonPredicate {
    return predicate.type === PredicateType.comparison;
}
