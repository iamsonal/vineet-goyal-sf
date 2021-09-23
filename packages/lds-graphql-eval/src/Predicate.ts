export type PredicateType = 'compound' | 'comparison';
export type ComparisonOperator = 'eq' | 'ne' | 'like' | 'lt' | 'gt' | 'lte' | 'gte' | 'in' | 'nin';
export type CompoundOperator = 'and' | 'or';

export interface ComparisonPredicate {
    type: 'comparison';
    operator: ComparisonOperator;
    left: Expression;
    right: Expression;
}

export interface CompoundPredicate {
    type: 'compound';
    operator: CompoundOperator;
    children: Predicate[];
}

export interface PredicateContainer {
    predicate: Predicate;
    joinNames: string[];
    joinPredicates: ComparisonPredicate[];
}

export interface JsonExtract {
    type: 'JsonExtract';
    jsonAlias: string;
    path: string;
}

export interface Identifier {
    type: 'identifier';
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
    type: 'StringLiteral';
    value: string;
}

export interface StringArray {
    type: 'StringArray';
    value: string[];
}

export interface NumberArray {
    type: 'NumberArray';
    value: number[];
}

export interface IntLiteral {
    type: 'IntLiteral';
    value: number;
}

export interface DoubleLiteral {
    type: 'DoubleLiteral';
    value: number;
}

export interface BooleanLiteral {
    type: 'BooleanLiteral';
    value: Boolean;
}

export interface ScalarField {
    type: 'ScalarField';
    path: string;
    extract: JsonExtract;
}

export interface ChildField {
    type: 'ChildRecordField';
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
    return predicate.type === 'compound';
}

export function isComparisonPredicate(predicate: Predicate): predicate is ComparisonPredicate {
    return predicate.type === 'comparison';
}
