import { unwrappedValue } from '../Result';
import infoJson from './mockData/objectInfos.json';
import { parseAndVisit } from '@luvio/graphql-parser';
import { transform } from '../ast-parser';
import { ObjectInfoMap } from '../info-types';
import { sql } from '../ast-to-sql';

const objectInfoMap = infoJson as ObjectInfoMap;
const sqlMappingInput = {
    jsonColumn: 'TABLE_1_1',
    keyColumn: 'TABLE_1_0',
    jsonTable: 'TABLE_1',
};

export function makeOrderByGraphQL(orderBy: string | undefined): string {
    const arg = orderBy === undefined ? '' : `(orderBy: ${orderBy})`;

    return /* GraphQL */ `
    query {
        uiapi {
            query {
                TimeSheet${arg}
                    @connection {
                    edges {
                        node @resource(type: "Record") {
                            TimeSheetNumber {
                                value
                            }
                        }
                    }
                }
            }
        }
    }
`;
}

function testOperatorResult(
    orderBy: string | undefined,
    expectedValue: string,
    expectedBindings: string[]
) {
    const graphqlSource = makeOrderByGraphQL(orderBy);
    const result = transform(parseAndVisit(graphqlSource), { userId: 'MyId', objectInfoMap });
    const sqlResult = sql(unwrappedValue(result), sqlMappingInput);
    expect(sqlResult.sql).toEqual(expectedValue);
    expect(sqlResult.bindings).toEqual(expectedBindings);
}

const Ascending = 'ASC';
const Descending = 'DESC';
const NullsLast = Ascending;
const NullsFirst = Descending;

describe('order by sql', () => {
    it.each([
        ['empty order by', '{TimeSheetNumber: {}}', NullsLast, Ascending],
        ['empty order by', '{TimeSheetNumber: {order: ASC}}', NullsLast, Ascending],
        ['empty order by', '{TimeSheetNumber: {order: ASC, nulls: LAST}}', NullsLast, Ascending],
        ['empty order by', '{TimeSheetNumber: {nulls: LAST}}', NullsLast, Ascending],
        ['empty order by', '{TimeSheetNumber: {order: ASC, nulls: FIRST}}', NullsFirst, Ascending],
        ['empty order by', '{TimeSheetNumber: {nulls: FIRST}}', NullsFirst, Ascending],
        ['empty order by', '{TimeSheetNumber: {order: DESC}}', NullsLast, Descending],
        [
            'empty order by',
            '{TimeSheetNumber: {order: DESC, nulls: FIRST}}',
            NullsFirst,
            Descending,
        ],
        ['empty order by', '{TimeSheetNumber: {order: DESC, nulls: LAST}}', NullsLast, Descending],
    ])('returns correct sql %s', (_, source, nullsOrder, order) => {
        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
            `(SELECT json_group_array(json_set('{}', '$.node.TimeSheetNumber.value', (json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.value')), ` +
            `'$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), ` +
            `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
            `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
            `FROM recordsCTE as 'TimeSheet'  ` +
            `WHERE json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ` +
            `ORDER BY CASE WHEN json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.value') IS NULL THEN 1 ELSE 0 END ${nullsOrder}, json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.value') ${order} ` +
            `)) ) as json`;

        return testOperatorResult(source, expected, []);
    });
});

describe('multiple order by', () => {
    it('should return the correct sql with 2 order by predicates', () => {
        const multiOrderByQuery = /* GraphQL */ `
            query multiOrderBy {
                uiapi {
                    query {
                        Account(orderBy: { Name: { order: ASC }, CreatedDate: { order: DESC } })
                            @connection {
                            edges {
                                node @resource(type: "Record") {
                                    Name {
                                        value
                                    }
                                    CreatedDate {
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        const result = transform(parseAndVisit(multiOrderByQuery), {
            userId: 'MyId',
            objectInfoMap,
        });

        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.Account.edges', (SELECT json_group_array(json_set('{}', '$.node.Name.value', ` +
            `(json_extract("Account.JSON", '$.data.fields.Name.value')), '$.node.CreatedDate.value', (json_extract("Account.JSON", '$.data.fields.CreatedDate.value')), ` +
            `'$.node._drafts', (json_extract("Account.JSON", '$.data.drafts')), '$.node.Id', (json_extract("Account.JSON", '$.data.id')), '$.node._metadata', ` +
            `(json_extract("Account.JSON", '$.metadata')) )) FROM (SELECT 'Account'.TABLE_1_1 as 'Account.JSON' FROM recordsCTE as 'Account'  ` +
            `WHERE json_extract("Account.JSON", '$.data.apiName') = 'Account' ORDER BY CASE WHEN json_extract("Account.JSON", '$.data.fields.Name.value') ` +
            `IS NULL THEN 1 ELSE 0 END ASC, json_extract("Account.JSON", '$.data.fields.Name.value') ASC , CASE WHEN json_extract("Account.JSON", ` +
            `'$.data.fields.CreatedDate.value') IS NULL THEN 1 ELSE 0 END ASC, json_extract("Account.JSON", '$.data.fields.CreatedDate.value') DESC )) ) as json`;

        const sqlResult = sql(unwrappedValue(result), sqlMappingInput);
        expect(sqlResult.sql).toEqual(expected);
        expect(sqlResult.bindings).toEqual([]);
    });

    it('should return the correct sql with multiple order by predicates with null orders specified', () => {
        const multiOrderByQuery = /* GraphQL */ `
            query multiOrderBy {
                uiapi {
                    query {
                        Account(
                            orderBy: {
                                Name: { order: ASC, nulls: FIRST }
                                CreatedDate: { order: DESC, nulls: LAST }
                            }
                        ) @connection {
                            edges {
                                node @resource(type: "Record") {
                                    Name {
                                        value
                                    }
                                    CreatedDate {
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        const result = transform(parseAndVisit(multiOrderByQuery), {
            userId: 'MyId',
            objectInfoMap,
        });

        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.Account.edges', (SELECT json_group_array(json_set('{}', '$.node.Name.value', ` +
            `(json_extract("Account.JSON", '$.data.fields.Name.value')), '$.node.CreatedDate.value', (json_extract("Account.JSON", '$.data.fields.CreatedDate.value')), ` +
            `'$.node._drafts', (json_extract("Account.JSON", '$.data.drafts')), '$.node.Id', (json_extract("Account.JSON", '$.data.id')), '$.node._metadata', ` +
            `(json_extract("Account.JSON", '$.metadata')) )) FROM (SELECT 'Account'.TABLE_1_1 as 'Account.JSON' FROM recordsCTE as 'Account'  ` +
            `WHERE json_extract("Account.JSON", '$.data.apiName') = 'Account' ORDER BY CASE WHEN json_extract("Account.JSON", '$.data.fields.Name.value') ` +
            `IS NULL THEN 1 ELSE 0 END DESC, json_extract("Account.JSON", '$.data.fields.Name.value') ASC , CASE WHEN json_extract("Account.JSON", ` +
            `'$.data.fields.CreatedDate.value') IS NULL THEN 1 ELSE 0 END ASC, json_extract("Account.JSON", '$.data.fields.CreatedDate.value') DESC )) ) as json`;

        const sqlResult = sql(unwrappedValue(result), sqlMappingInput);
        expect(sqlResult.sql).toEqual(expected);
        expect(sqlResult.bindings).toEqual([]);
    });

    it('should return the correct sql with duplicate order by predicates', () => {
        const multiOrderByQuery = /* GraphQL */ `
            query multiOrderBy {
                uiapi {
                    query {
                        Account(
                            orderBy: {
                                # Last one wins (Name: ASC)
                                Name: { order: DESC }
                                CreatedDate: { order: DESC }
                                Name: { order: ASC }
                            }
                        ) @connection {
                            edges {
                                node @resource(type: "Record") {
                                    Name {
                                        value
                                    }
                                    CreatedDate {
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        const result = transform(parseAndVisit(multiOrderByQuery), {
            userId: 'MyId',
            objectInfoMap,
        });

        const expected =
            `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
            `SELECT json_set('{}', '$.data.uiapi.query.Account.edges', (SELECT json_group_array(json_set('{}', '$.node.Name.value', ` +
            `(json_extract("Account.JSON", '$.data.fields.Name.value')), '$.node.CreatedDate.value', (json_extract("Account.JSON", '$.data.fields.CreatedDate.value')), ` +
            `'$.node._drafts', (json_extract("Account.JSON", '$.data.drafts')), '$.node.Id', (json_extract("Account.JSON", '$.data.id')), '$.node._metadata', ` +
            `(json_extract("Account.JSON", '$.metadata')) )) FROM (SELECT 'Account'.TABLE_1_1 as 'Account.JSON' FROM recordsCTE as 'Account'  ` +
            `WHERE json_extract("Account.JSON", '$.data.apiName') = 'Account' ORDER BY CASE WHEN json_extract("Account.JSON", '$.data.fields.Name.value') ` +
            `IS NULL THEN 1 ELSE 0 END ASC, json_extract("Account.JSON", '$.data.fields.Name.value') ASC , CASE WHEN json_extract("Account.JSON", ` +
            `'$.data.fields.CreatedDate.value') IS NULL THEN 1 ELSE 0 END ASC, json_extract("Account.JSON", '$.data.fields.CreatedDate.value') DESC )) ) as json`;

        const sqlResult = sql(unwrappedValue(result), sqlMappingInput);
        expect(sqlResult.sql).toEqual(expected);
        expect(sqlResult.bindings).toEqual([]);
    });
});
