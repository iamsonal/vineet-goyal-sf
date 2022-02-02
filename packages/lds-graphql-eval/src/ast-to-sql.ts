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
    StringLiteral,
    MultiPicklistSet,
} from './Predicate';
import { flatten } from './util/flatten';

interface SqlAndBindings {
    sql: string;
    bindings: string[];
}
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

export function sql(rootQuery: RootQuery, mappingInput: SqlMappingInput): SqlAndBindings {
    const fields = rootQuery.connections.map((connection) => {
        const { sql: recordQuerySql, bindings } = recordQueryToSql(connection, mappingInput);
        return {
            sql: `'${recordPrefix}.${connection.alias}.${recordSuffix}', (${recordQuerySql})`,
            bindings,
        };
    });

    const fieldSql = fields.map((v) => v.sql).join(`, `);
    const bindings = fields.map((v) => v.bindings).reduce(flatten);

    return { sql: `${cteSql(mappingInput)} SELECT json_set('{}', ${fieldSql} ) as json`, bindings };
}

function fieldToSql(field: RecordQueryField, mappingInput: SqlMappingInput): SqlAndBindings {
    const { path } = field;

    if (field.type === FieldType.Child) {
        const { sql, bindings } = recordQueryToSql(field.connection, mappingInput);
        return { sql: `'${pathPrefix}.${path}', (${sql})`, bindings };
    }

    const { sql, bindings } = expressionToSql(field.extract);
    return { sql: `'${pathPrefix}.${path}', (${sql})`, bindings };
}

function recordQueryToSql(recordQuery: RecordQuery, input: SqlMappingInput): SqlAndBindings {
    const { predicate, first, orderBy, fields: recordFields, joinNames, alias: name } = recordQuery;

    // const fieldsSql = recordFields.map((f) => fieldToSql(f, input)).join(', ');
    const fields = recordFields.map((f) => fieldToSql(f, input));
    const fieldsSql = fields.map((v) => v.sql).join(`, `);
    const fieldBindings = fields.map((v) => v.bindings).reduce(flatten);

    const { sql: select, bindings: selectBindings } = selectSql(
        predicate,
        name,
        first,
        orderBy,
        joinNames,
        input
    );

    const bindings = fieldBindings.concat(selectBindings);
    return {
        sql: `SELECT json_group_array(json_set('{}', ${fieldsSql} )) ` + `FROM ${select}`,
        bindings,
    };
}

function selectSql(
    predicate: Predicate | undefined,
    name: string,
    first: number | undefined,
    orderBy: OrderBy[] | undefined,
    joinNames: string[],
    mappingInput: SqlMappingInput
): SqlAndBindings {
    const joinString = joinNamesToSql(joinNames);
    const columns = columnsSql(joinNames.concat(name), mappingInput);
    let predicateString: string = '';
    let predicateBindings: string[] = [];

    if (predicate !== undefined) {
        const { sql: predicateSql, bindings } = predicateToSql(predicate, mappingInput);
        predicateBindings = bindings;
        predicateString = `WHERE ${predicateSql}`;
    }

    const limitString = first !== undefined ? `LIMIT ${first}` : '';
    const { sql: orderBySql, bindings: orderByBindings } = orderbyToSql(orderBy);

    const sql =
        `(SELECT ${columns} FROM ${recordsCTE} as '${name}' ` +
        `${joinString} ${predicateString} ${orderBySql}${limitString})`;

    const bindings = predicateBindings.concat(orderByBindings);
    return { sql, bindings };
}

function orderbyToSql(orderBy: OrderBy[] = []): SqlAndBindings {
    if (orderBy.length === 0) {
        return { sql: '', bindings: [] };
    }
    const clauses = orderBy.map((clause) => {
        const { sql: extractSql, bindings } = expressionToSql(clause.extract);
        const order = clause.asc ? 'ASC' : 'DESC';
        const nullsOrder = clause.nullsFirst ? 'DESC' : 'ASC';

        //As of fall 2021 most devices don't have NULLS FIRST|LAST support which was added to sqlite in 2019,
        //so we use a CASE expression and sort by an "is null" column and then by the actual column order.
        return {
            sql: `CASE WHEN ${extractSql} IS NULL THEN 1 ELSE 0 END ${nullsOrder}, ${extractSql} ${order} `,
            bindings,
        };
    });
    // .join(', ');

    const clausesSql = clauses.map((v) => v.sql).join(`, `);
    const bindings = clauses.map((v) => v.bindings).reduce(flatten);

    return { sql: `ORDER BY ${clausesSql}`, bindings };
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

function predicateToSql(predicate: Predicate, mappingInput: SqlMappingInput): SqlAndBindings {
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
): SqlAndBindings {
    const operatorString = compoundOperatorToSql(predicate.operator);
    const results = predicate.children.map((child) => predicateToSql(child, mappingInput));

    const statementSql = results.map((v) => v.sql).join(` ${operatorString} `);
    const bindings = results.map((v) => v.bindings).reduce(flatten);

    return { sql: `( ${statementSql} )`, bindings };
}

function dateFunctionPredicateToSql(predicate: DateFunctionPredicate): SqlAndBindings {
    const operator = comparisonOperatorToSql(predicate.operator);
    const { sql: extract, bindings: extractBindings } = expressionToSql(predicate.extract);

    switch (predicate.function) {
        case DateFunction.dayOfMonth: {
            const day = String(predicate.value).padStart(2, '0');
            const bindings = extractBindings.concat(`'${day}'`);
            return { sql: `strftime('%d', ${extract}) ${operator} ?`, bindings };
        }
    }
}

function existsPredicateToSql(
    exists: ExistsPredicate,
    mappingInput: SqlMappingInput
): SqlAndBindings {
    const { predicate, joinNames, alias } = exists;
    const { sql: select, bindings } = selectSql(
        predicate,
        alias,
        undefined,
        undefined,
        joinNames,
        mappingInput
    );

    return { sql: `EXISTS ${select}`, bindings };
}

function comparisonPredicateToSql(predicate: ComparisonPredicate): SqlAndBindings {
    const operator = comparisonOperatorToSql(predicate.operator);
    const { sql: left, bindings: leftBindings } = expressionToSql(predicate.left);
    const { sql: right, bindings: rightBindings } = expressionToSql(predicate.right);

    const bindings = leftBindings.concat(rightBindings);
    return { sql: `${left} ${operator} ${right}`, bindings };
}

function betweenPredicateToSql(predicate: BetweenPredicate): SqlAndBindings {
    const { sql: compareDateSql, bindings: compareBindings } = expressionToSql(
        predicate.compareDate
    );
    const { sql: startSql, bindings: startBindings } = expressionToSql(predicate.start);
    const { sql: endSql, bindings: endBindings } = expressionToSql(predicate.end);

    const bindings = compareBindings.concat(startBindings).concat(endBindings);
    return { sql: `${compareDateSql} BETWEEN ${startSql} AND ${endSql}`, bindings };
}

function notPredicateToSql(predicate: NotPredicate, mappingInput: SqlMappingInput): SqlAndBindings {
    const { sql, bindings } = predicateToSql(predicate.child, mappingInput);

    return { sql: `NOT (${sql})`, bindings };
}

function nullComparisonPredicateToSql(predicate: NullComparisonPredicate): SqlAndBindings {
    const operator: string = predicate.operator === NullComparisonOperator.is ? 'IS' : 'IS NOT';
    const { sql: leftSql, bindings } = expressionToSql(predicate.left);

    return { sql: `${leftSql} ${operator} NULL`, bindings };
}

function expressionToSql(expression: Expression): SqlAndBindings {
    switch (expression.type) {
        case ValueType.Extract:
            return {
                sql: `json_extract("${expression.jsonAlias}.JSON", '${pathPrefix}.${expression.path}')`,
                bindings: [],
            };
        case ValueType.BooleanLiteral:
        case ValueType.DoubleLiteral:
        case ValueType.IntLiteral:
            //bind
            return { sql: '?', bindings: [String(expression.value)] };
        case ValueType.StringArray:
            //bind
            return expressionArrayToSql(expression.value, (e) => ({
                sql: '?',
                bindings: [`'${e}'`],
            }));
        case ValueType.NumberArray:
            //bind
            return expressionArrayToSql(expression.value, (e) => ({
                sql: '?',
                bindings: [`${e}`],
            }));
        case ValueType.NullValue:
            return { sql: 'null', bindings: [] };

        case ValueType.DateEnum:
            return { sql: dateEnumToSql(expression.value), bindings: [] };
        case ValueType.DateTimeEnum:
            return { sql: dateTimeEnumToSql(expression.value), bindings: [] };

        case ValueType.DateTimeArray:
            return expressionArrayToSql(expression.value, expressionToSql);
        case ValueType.DateArray:
            return expressionArrayToSql(expression.value, expressionToSql);

        case ValueType.DateRange:
        case ValueType.DateTimeRange:
            //not used
            return { sql: '', bindings: [] };
        case ValueType.RelativeDate:
            return relativeDateToSql(expression);
        case ValueType.DateValue:
        case ValueType.DateTimeValue:
            return { sql: '?', bindings: [`'${expression.value}'`] };
        case ValueType.StringLiteral:
            //bind
            return stringLiteralToSql(expression);
        case ValueType.MultiPicklistSet:
            return multiPicklistToSql(expression);
    }
}

function stringLiteralToSql(string: StringLiteral): SqlAndBindings {
    const { safe, value } = string;
    if (safe === true) {
        return { sql: `'${value}'`, bindings: [] };
    }

    return { sql: '?', bindings: [`'${value}'`] };
}

function expressionArrayToSql<T>(
    expressions: T[],
    toSql: (t: T) => SqlAndBindings
): SqlAndBindings {
    const results: SqlAndBindings[] = expressions.map(toSql);
    const sql = `(${results.map((v) => v.sql).join(', ')})`;
    const bindings = results.map((v) => v.bindings).reduce(flatten);

    return { sql, bindings };
}

function multiPicklistToSql({ value }: MultiPicklistSet): SqlAndBindings {
    // Individual multipicklist terms that delimited by semicolon are stored server-side
    // as lexically sorted strings and treated like logical ANDs. We can approximate this
    // behavior in SQL with wildcarded `LIKE` SQL operators.  Terms with no delimiter can
    // be treated as string literals.  Multiple terms are logically OR'd together to
    // match the behavior described in SOQL documentation (https://sfdc.co/c9j0r)
    const sql = '?';
    const binding = value.includes(';') ? `'%${value.split(';').join('%')}%'` : `'%${value}%'`;

    return { sql, bindings: [binding] };
}

function relativeDateToSql(expression: RelativeDate): SqlAndBindings {
    const funcName = expression.hasTime ? 'datetime' : 'date';
    switch (expression.unit) {
        case 'month':
            if (expression.offset === 'end') {
                return {
                    sql: `${funcName}('now', 'start of month', ?, '-1 day')`,
                    bindings: [`'${expression.amount + 1} months'`],
                };
            }
            return {
                sql: `${funcName}('now', 'start of month', ?)`,
                bindings: [`'${expression.amount} months'`],
            };
        case 'day':
            return { sql: `${funcName}('now', ?)`, bindings: [`'${expression.amount} days'`] };
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
        case ComparisonOperator.includes:
            return 'LIKE';
        case ComparisonOperator.excludes:
            return 'NOT LIKE';
    }
}

export function objectInfoSql(mappingInput: SqlMappingInput): string {
    return `WITH objectInfoCTE AS (select ${mappingInput.jsonColumn} from ${mappingInput.jsonTable} where ${mappingInput.keyColumn} like 'UiApi\\%3A\\%3AObjectInfo%' ESCAPE '\\')
    select json_group_object( json_extract(${mappingInput.jsonColumn}, '$.data.apiName'), 
        json_object(
            'fields',
            (select json_group_object( key,  value )
            from (
                select json_extract(value, '$.apiName') as key, json_object('dataType', json_extract(value, '$.dataType'), 'apiName', json_extract(value, '$.apiName'), 'referenceToInfos', json_extract(value, '$.referenceToInfos'),  'relationshipName', json_extract(value, '$.relationshipName')) as value
                from  json_each(json_extract(${mappingInput.jsonColumn}, '$.data.fields'))
            )),
            'childRelationships',
            (select json_group_array( value )
            from (
                select json_object('fieldName', json_extract(value, '$.fieldName'), 'childObjectApiName', json_extract(value, '$.childObjectApiName'),  'relationshipName', json_extract(value, '$.relationshipName')) as value
                from  json_each(json_extract(${mappingInput.jsonColumn}, '$.data.childRelationships'))
            ))
        )
    )  from (select ${mappingInput.jsonColumn} FROM objectInfoCTE)`;
}

export function indicesSql(mappingInput: SqlMappingInput): string[] {
    return [
        `create index if not exists service_appointment_id on ${mappingInput.jsonTable}(json_extract(${mappingInput.jsonColumn}, '$.data.fields.ServiceAppointmentId.value')) where json_extract(${mappingInput.jsonColumn}, '$.data.apiName') = 'AssignedResource'`,
        `create index if not exists apiname on ${mappingInput.jsonTable}(json_extract(${mappingInput.jsonColumn}, '$.data.apiName')) where json_extract(${mappingInput.jsonColumn}, '$.data.apiName') is not null`,
        `create index if not exists record_id on ${mappingInput.jsonTable}(json_extract(${mappingInput.jsonColumn}, '$.data.id')) where json_extract(${mappingInput.jsonColumn}, '$.data.id') is not null`,
        `create index if not exists service_resource_id on ${mappingInput.jsonTable}(json_extract(${mappingInput.jsonColumn}, '$.data.fields.ServiceResourceId.value')) where json_extract(${mappingInput.jsonColumn}, '$.data.apiName') = 'AssignedResource'`,
        `create index if not exists related_record_id on ${mappingInput.jsonTable}(json_extract(${mappingInput.jsonColumn}, '$.data.fields.RelatedRecordId.value')) where json_extract(${mappingInput.jsonColumn}, '$.data.apiName') = 'ServiceResource'`,
    ];
}

export const tableAttrs = `select json_group_object(key, value) from  (select path as key, columnName as value from soup_index_map  where soupName = 'DEFAULT'  union select 'LdsSoupTable' as key, 'TABLE_' || id as value from soup_attrs where soupName = 'DEFAULT')`;
