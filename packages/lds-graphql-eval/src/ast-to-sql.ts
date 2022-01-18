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
    OrderBy,
    isExistsPredicate,
    ExistsPredicate,
    isDateFunctionPredicate,
    DateFunctionPredicate,
    DateFunction,
    isBetweenPredicate,
    BetweenPredicate,
    RelativeDate,
} from './Predicate';

export interface SqlMappingInput {
    jsonColumn: string;
    keyColumn: string;
    jsonTable: string;
}

const recordPrefix = '$.data.uiapi.query';
const recordSuffix = 'edges';
const pathPrefix = '$';
const recordsCTE = 'recordsCTE';

function cteSql(mappingInput: SqlMappingInput): string {
    return (
        `WITH ${recordsCTE} AS ` +
        `(select ${mappingInput.jsonColumn} from ${mappingInput.jsonTable} where ${mappingInput.keyColumn} like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\')`
    );
}

export function sql(rootQuery: RootQuery, mappingInput: SqlMappingInput): string {
    const fields = rootQuery.connections
        .map(
            (connection) =>
                `'${recordPrefix}.${connection.alias}.${recordSuffix}', (${recordQueryToSql(
                    connection,
                    mappingInput
                )})`
        )
        .join(', ');

    return `${cteSql(mappingInput)} SELECT json_set('{}', ${fields} ) as json`;
}

function fieldToSql(field: RecordQueryField, mappingInput: SqlMappingInput): string {
    const { path } = field;

    if (field.type === FieldType.Child) {
        return `'${pathPrefix}.${path}', (${recordQueryToSql(field.connection, mappingInput)})`;
    }

    return `'${pathPrefix}.${path}', (${expressionToSql(field.extract)})`;
}

function recordQueryToSql(recordQuery: RecordQuery, input: SqlMappingInput): string {
    const { predicate, first, orderBy, fields: recordFields, joinNames, alias: name } = recordQuery;

    const fieldsSql = recordFields.map((f) => fieldToSql(f, input)).join(', ');
    const select = selectSql(predicate, name, first, orderBy, joinNames, input);

    return `SELECT json_group_array(json_set('{}', ${fieldsSql} )) ` + `FROM ${select}`;
}

function selectSql(
    predicate: Predicate | undefined,
    name: string,
    first: number | undefined,
    orderBy: OrderBy[] | undefined,
    joinNames: string[],
    mappingInput: SqlMappingInput
) {
    const joinString = joinNamesToSql(joinNames);
    const columns = columnsSql(joinNames.concat(name), mappingInput);
    const predicateString =
        predicate !== undefined ? `WHERE ${predicateToSql(predicate, mappingInput)}` : '';
    const limitString = first !== undefined ? `LIMIT ${first}` : '';

    return (
        `(SELECT ${columns} FROM ${recordsCTE} as '${name}' ` +
        `${joinString} ${predicateString} ${orderbyToSql(orderBy)}${limitString})`
    );
}

function orderbyToSql(orderBy: OrderBy[] = []): string {
    if (orderBy.length === 0) {
        return '';
    }
    const clauses = orderBy
        .map((clause) => {
            const extract = expressionToSql(clause.extract);
            const order = clause.asc ? 'ASC' : 'DESC';
            const nullsOrder = clause.nullsFirst ? 'DESC' : 'ASC';

            //As of fall 2021 most devices don't have NULLS FIRST|LAST support which was added to sqlite in 2019,
            //so we use a CASE expression and sort by an "is null" column and then by the actual column order.
            return `CASE WHEN ${extract} IS NULL THEN 1 ELSE 0 END ${nullsOrder}, ${extract} ${order} `;
        })
        .join(', ');

    return `ORDER BY ${clauses}`;
}

function columnsSql(names: string[], mappingInput: SqlMappingInput) {
    return names.map((name) => `'${name}'.${mappingInput.jsonColumn} as '${name}.JSON'`).join(', ');
}

function joinNamesToSql(names: string[]): string {
    return names.map(joinToSql).join(' ');
}

function joinToSql(name: string) {
    return `join ${recordsCTE} as '${name}'`;
}

function predicateToSql(predicate: Predicate, mappingInput: SqlMappingInput): string {
    if (isCompoundPredicate(predicate)) {
        return compoundPredicateToSql(predicate, mappingInput);
    }

    if (isComparisonPredicate(predicate)) {
        return comparisonPredicateToSql(predicate);
    }

    if (isNullComparisonPredicate(predicate)) {
        return nullComparisonPredicateToSql(predicate);
    }

    if (isExistsPredicate(predicate)) {
        return existsPredicateToSql(predicate, mappingInput);
    }

    if (isDateFunctionPredicate(predicate)) {
        return dateFunctionPredicateToSql(predicate);
    }

    if (isBetweenPredicate(predicate)) {
        return betweenPredicateToSql(predicate);
    }

    return notPredicateToSql(predicate, mappingInput);
}

function compoundPredicateToSql(
    predicate: CompoundPredicate,
    mappingInput: SqlMappingInput
): string {
    const operatorString = compoundOperatorToSql(predicate.operator);
    const compoundStatement = predicate.children
        .map((child) => predicateToSql(child, mappingInput))
        .join(` ${operatorString} `);

    return `( ${compoundStatement} )`;
}

function dateFunctionPredicateToSql(predicate: DateFunctionPredicate): string {
    const operator = comparisonOperatorToSql(predicate.operator);
    const extract = expressionToSql(predicate.extract);
    switch (predicate.function) {
        case DateFunction.dayOfMonth: {
            const day = String(predicate.value).padStart(2, '0');
            return `strftime('%d', ${extract}) ${operator} '${day}'`;
        }
    }
}

function existsPredicateToSql(exists: ExistsPredicate, mappingInput: SqlMappingInput): string {
    const { predicate, joinNames, alias } = exists;
    const select = selectSql(predicate, alias, undefined, undefined, joinNames, mappingInput);
    return `EXISTS ${select}`;
}

function comparisonPredicateToSql(predicate: ComparisonPredicate): string {
    const operator = comparisonOperatorToSql(predicate.operator);
    const left = expressionToSql(predicate.left);
    const right = expressionToSql(predicate.right);

    return `${left} ${operator} ${right}`;
}

function betweenPredicateToSql(predicate: BetweenPredicate): string {
    const start = expressionToSql(predicate.start);
    const end = expressionToSql(predicate.end);
    const compareDate = expressionToSql(predicate.compareDate);

    return `${compareDate} BETWEEN ${start} AND ${end}`;
}

function notPredicateToSql(predicate: NotPredicate, mappingInput: SqlMappingInput): string {
    const innerSql = predicateToSql(predicate.child, mappingInput);

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
        case ValueType.DateRange:
        case ValueType.DateTimeRange:
            return ``;
        case ValueType.RelativeDate:
            return relativeDateToSql(expression);
        case ValueType.DateValue:
        case ValueType.DateTimeValue:
        case ValueType.StringLiteral:
            return `'${expression.value}'`;
    }
}

function relativeDateToSql(expression: RelativeDate): string {
    const funcName = expression.hasTime ? 'datetime' : 'date';
    switch (expression.unit) {
        case 'month':
            if (expression.offset === 'end') {
                return `${funcName}('now', 'start of month', '${
                    expression.amount + 1
                } months', '-1 day')`;
            }
            return `${funcName}('now', 'start of month', '${expression.amount} months')`;
        case 'day':
            return `${funcName}('now', '${expression.amount} days')`;
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
