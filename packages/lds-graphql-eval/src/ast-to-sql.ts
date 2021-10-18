import {
    Expression,
    Predicate,
    CompoundPredicate,
    ComparisonOperator,
    ComparisonPredicate,
    isCompoundPredicate,
    RecordQuery,
    RootQuery,
    RecordQueryField,
    FieldType,
    ValueType,
    DateEnumType,
    CompoundOperator,
    isComparisonPredicate,
    NullComparisonPredicate,
    NullComparisonOperator,
    isNullComparisonPredicate,
    NotPredicate,
} from './Predicate';

export interface SqlMappingInput {
    jsonColumn: string;
    keyColumn: string;
    jsonTable: string;
}

const recordPrefix = '$.data.uiapi.query';
const recordSuffix = 'edges';
const pathPrefix = '$';

export function sql(rootQuery: RootQuery, mappingInput: SqlMappingInput): string {
    const fields = rootQuery.connections
        .map(
            (conn) =>
                `'${recordPrefix}.${conn.alias}.${recordSuffix}', (${recordQueryToSql(
                    conn,
                    mappingInput
                )})`
        )
        .join(', ');

    return `SELECT json_set('{}', ${fields} ) as json`;
}

function fieldToSql(field: RecordQueryField, mappingInput: SqlMappingInput): string {
    const { path } = field;

    if (field.type === FieldType.Child) {
        return `'${pathPrefix}.${path}', (${recordQueryToSql(field.connection, mappingInput)})`;
    }

    return `'${pathPrefix}.${path}', (${expressionToSql(field.extract)})`;
}

function recordQueryToSql(recordQuery: RecordQuery, mappingInput: SqlMappingInput): string {
    const { predicate, first, fields: recordFields, joinNames, alias: name } = recordQuery;

    const predicateString = predicate !== undefined ? `WHERE ${predicateToSql(predicate)}` : '';
    const limitString = first !== undefined ? `LIMIT ${first}` : '';

    const fieldsSql = recordFields.map((f) => fieldToSql(f, mappingInput)).join(', ');
    const joinString = joinNamesToSql(joinNames, mappingInput);
    const columns = columnsSql(joinNames.concat(name), mappingInput);

    return (
        `SELECT json_group_array(json_set('{}', ${fieldsSql} )) ` +
        `FROM (SELECT ${columns} FROM (select * from ${mappingInput.jsonTable} ` +
        `where ${mappingInput.keyColumn} like 'UiApi%3A%3ARecordRepresentation%') as '${name}' ${joinString} ${predicateString} ${limitString})`
    );
}

function columnsSql(names: string[], mappingInput: SqlMappingInput) {
    return names.map((name) => `'${name}'.${mappingInput.jsonColumn} as '${name}.JSON'`).join(', ');
}

function joinNamesToSql(names: string[], mappingInput: SqlMappingInput): string {
    return names.map((name) => joinToSql(name, mappingInput)).join(' ');
}

function joinToSql(name: string, mappingInput: SqlMappingInput) {
    return `join ${mappingInput.jsonTable} as '${name}'`;
}

function predicateToSql(predicate: Predicate): string {
    if (isCompoundPredicate(predicate)) {
        return compoundPredicateToSql(predicate);
    }

    if (isComparisonPredicate(predicate)) {
        return comparisonPredicateToSql(predicate);
    }

    if (isNullComparisonPredicate(predicate)) {
        return nullComparisonPredicateToSql(predicate);
    }

    return notPredicateToSql(predicate);
}

function compoundPredicateToSql(predicate: CompoundPredicate): string {
    const operatorString = compoundOperatorToSql(predicate.operator);
    const compoundStatement = predicate.children.map(predicateToSql).join(` ${operatorString} `);

    return `( ${compoundStatement} )`;
}

function comparisonPredicateToSql(predicate: ComparisonPredicate): string {
    const operator = comparisonOperatorToSql(predicate.operator);
    const left = expressionToSql(predicate.left);
    const right = expressionToSql(predicate.right);

    return `${left} ${operator} ${right}`;
}

function notPredicateToSql(predicate: NotPredicate): string {
    const innerSql = predicateToSql(predicate.child);

    return `NOT (${innerSql})`;
}

function nullComparisonPredicateToSql(predicate: NullComparisonPredicate): string {
    const operator = predicate.operator === NullComparisonOperator.is ? 'IS' : 'IS NOT';
    const left = expressionToSql(predicate.left);

    return `${left} ${operator} NULL`;
}

function expressionToSql(expression: Expression): string {
    switch (expression.type) {
        case ValueType.Extract:
            return `json_extract("${expression.jsonAlias}.JSON", '${pathPrefix}.${expression.path}')`;
        case ValueType.BooleanLiteral:
        case ValueType.DoubleLiteral:
        case ValueType.IntLiteral:
            return String(expression.value);
        case ValueType.StringArray:
            return `(${expression.value.map((e) => `'${e}'`).join(', ')})`;
        case ValueType.NumberArray:
            return `(${expression.value.map((e) => e).join(', ')})`;
        case ValueType.NullValue:
            return 'null';

        case ValueType.DateEnum:
            return dateEnumToSql(expression.value);
        case ValueType.DateTimeEnum:
            return dateTimeEnumToSql(expression.value);

        case ValueType.DateTimeArray:
            return `(${expression.value.map((e) => expressionToSql(e)).join(', ')})`;
        case ValueType.DateArray:
            return `(${expression.value.map((e) => expressionToSql(e)).join(', ')})`;

        case ValueType.DateValue:
        case ValueType.DateTimeValue:
        case ValueType.StringLiteral:
            return `'${expression.value}'`;
    }
}

function dateTimeEnumToSql(dateEnum: DateEnumType): string {
    switch (dateEnum) {
        case DateEnumType.today:
            return `datetime('now')`;
        case DateEnumType.tomorrow:
            return `datetime('now', '+1 day')`;
    }
}

function dateEnumToSql(dateEnum: DateEnumType): string {
    switch (dateEnum) {
        case DateEnumType.today:
            return `date('now')`;
        case DateEnumType.tomorrow:
            return `date('now', '+1 day')`;
    }
}

function compoundOperatorToSql(operator: CompoundOperator): string {
    switch (operator) {
        case CompoundOperator.and:
            return 'AND';
        case CompoundOperator.or:
            return 'OR';
    }
}

function comparisonOperatorToSql(operator: ComparisonOperator): string {
    switch (operator) {
        case ComparisonOperator.eq:
            return '=';
        case ComparisonOperator.ne:
            return '!=';
        case ComparisonOperator.gt:
            return '>';
        case ComparisonOperator.gte:
            return '>=';
        case ComparisonOperator.lt:
            return '<';
        case ComparisonOperator.lte:
            return '<=';
        case ComparisonOperator.like:
            return 'like';
        case ComparisonOperator.in:
            return 'IN';
        case ComparisonOperator.nin:
            return 'NOT IN';
    }
}
