import { unwrappedValue } from '../Result';
import infoJson from './mockData/objectInfos.json';
import { parseAndVisit } from '@luvio/graphql-parser';
import { transform } from '../ast-parser';
import { ComparisonOperator } from '../Predicate';
import { ObjectInfoMap } from '../info-types';
import { sql } from '../ast-to-sql';

const objectInfoMap = infoJson as ObjectInfoMap;
const sqlMappingInput = {
    jsonColumn: 'TABLE_1_1',
    keyColumn: 'TABLE_1_0',
    jsonTable: 'TABLE_1',
};

const { eq, ne, gt, gte, lt, lte, nin } = ComparisonOperator;
const inOp = ComparisonOperator.in;

function makeGraphQL(where: string): string {
    return /* GraphQL */ `
    query {
        uiapi {
            query {
                TimeSheet(where: ${where})
                    @connection {
                    edges {
                        node @resource(type: "Record") {
                            Id
                        }
                    }
                }
            }
        }
    }
`;
}

// * date values work with operators
// * date literals work with operators
// * date null value works with operators
// * date disallows invalid input
// * date set works with literals and values

// * datetime values work with operators
// * datetime literals work with operators
// * datetime null value works with operators
// * datetime disallows invalid input
// * datetime set works with literals and value

function testOperatorResult(source: string, expectedValue: string, expectedBindings: string[]) {
    const graphqlSource = makeGraphQL(source);
    const queryResult = transform(parseAndVisit(graphqlSource), { userId: 'MyId', objectInfoMap });
    const { sql: sqlString, bindings } = sql(unwrappedValue(queryResult), sqlMappingInput);
    expect(sqlString).toEqual(expectedValue);
    expect(bindings).toEqual(expectedBindings);
}

describe('date filter to sql parser', () => {
    describe('Date filter', () => {
        it.each([
            [eq, '='],
            [ne, '!='],
            [gt, '>'],
            [gte, '>='],
            [lt, '<'],
            [lte, '<='],
        ])('returns correct sql for date scalar operator %s', (opEnum, opString) => {
            const source = `{ EndDate: { ${opEnum}: { value: "2017-09-20" } } }`;

            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from "TABLE_1" where TABLE_1_0 like 'UiApi::RecordRepresentation%') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') ${opString} ? ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            return testOperatorResult(source, expected, ["'2017-09-20'"]);
        });

        it.each([
            [eq, 'IS'],
            [ne, 'IS NOT'],
        ])('returns correct sql with null for date scalar operator %s', (opEnum, opString) => {
            const source = `{ EndDate: { ${opEnum}: { value: null } } }`;

            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from "TABLE_1" where TABLE_1_0 like 'UiApi::RecordRepresentation%') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') ${opString} NULL ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            return testOperatorResult(source, expected, []);
        });

        it.each([
            [eq, '='],
            [ne, '!='],
            [gt, '>'],
            [gte, '>='],
            [lt, '<'],
            [lte, '<='],
        ])('returns correct sql for literal TODAY with scalar operator %s', (opEnum, opString) => {
            const source = `{ EndDate: { ${opEnum}: { literal: TODAY } } }`;

            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from "TABLE_1" where TABLE_1_0 like 'UiApi::RecordRepresentation%') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') ${opString} date('now') ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            return testOperatorResult(source, expected, []);
        });

        it.each([
            [eq, '='],
            [ne, '!='],
            [gt, '>'],
            [gte, '>='],
            [lt, '<'],
            [lte, '<='],
        ])(
            'returns correct sql for literal TOMORROW with scalar operator %s',
            (opEnum, opString) => {
                const source = `{ EndDate: { ${opEnum}: { literal: TOMORROW } } }`;

                const expected =
                    `WITH recordsCTE AS (select TABLE_1_1 from "TABLE_1" where TABLE_1_0 like 'UiApi::RecordRepresentation%') ` +
                    `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                    `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                    `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                    `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                    `FROM recordsCTE as 'TimeSheet'  ` +
                    `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') ${opString} date('now', '+1 day') ` +
                    `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

                return testOperatorResult(source, expected, []);
            }
        );
    });

    describe('Date set filter', () => {
        it.each([
            [inOp, 'IN'],
            [nin, 'NOT IN'],
        ])(
            'returns correct sql for DateArray for all date scalar operator %s',
            (opEnum, opString) => {
                const source = `{ EndDate: { ${opEnum}: [{ value: "2017-09-20" }, { literal: TODAY }, { literal: TOMORROW }, {value: null}] } }`;

                const expected =
                    `WITH recordsCTE AS (select TABLE_1_1 from "TABLE_1" where TABLE_1_0 like 'UiApi::RecordRepresentation%') ` +
                    `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                    `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                    `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                    `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                    `FROM recordsCTE as 'TimeSheet'  ` +
                    `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') ${opString} (?, date('now'), date('now', '+1 day'), null) ` +
                    `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

                return testOperatorResult(source, expected, ["'2017-09-20'"]);
            }
        );
    });

    describe('DateTime filter', () => {
        it.each([
            [eq, '='],
            [ne, '!='],
            [gt, '>'],
            [gte, '>='],
            [lt, '<'],
            [lte, '<='],
        ])('returns correct sql for DateTime scalar operator %s', (opEnum, opString) => {
            const source = `{ CreatedDate: { ${opEnum}: { value: "2021-09-17T17:57:01.000Z" } } }`;

            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from "TABLE_1" where TABLE_1_0 like 'UiApi::RecordRepresentation%') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') ${opString} ? ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            return testOperatorResult(source, expected, ["'2021-09-17T17:57:01.000Z'"]);
        });

        it.each([
            [eq, 'IS'],
            [ne, 'IS NOT'],
        ])('returns correct sql with null for datetime scalar operator %s', (opEnum, opString) => {
            const source = `{ CreatedDate: { ${opEnum}: { value: null } } }`;

            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from "TABLE_1" where TABLE_1_0 like 'UiApi::RecordRepresentation%') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') ${opString} NULL ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            return testOperatorResult(source, expected, []);
        });

        it.each([
            [eq, '='],
            [ne, '!='],
            [gt, '>'],
            [gte, '>='],
            [lt, '<'],
            [lte, '<='],
        ])('returns correct sql for literal TODAY with scalar operator %s', (opEnum, opString) => {
            const source = `{ CreatedDate: { ${opEnum}: { literal: TODAY } } }`;

            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from "TABLE_1" where TABLE_1_0 like 'UiApi::RecordRepresentation%') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') ${opString} datetime('now') ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            return testOperatorResult(source, expected, []);
        });

        it.each([
            [eq, '='],
            [ne, '!='],
            [gt, '>'],
            [gte, '>='],
            [lt, '<'],
            [lte, '<='],
        ])(
            'returns correct sql for literal TOMORROW with scalar operator %s',
            (opEnum, opString) => {
                const source = `{ CreatedDate: { ${opEnum}: { literal: TOMORROW } } }`;

                const expected =
                    `WITH recordsCTE AS (select TABLE_1_1 from "TABLE_1" where TABLE_1_0 like 'UiApi::RecordRepresentation%') ` +
                    `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                    `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                    `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                    `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                    `FROM recordsCTE as 'TimeSheet'  ` +
                    `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') ${opString} datetime('now', '+1 day') ` +
                    `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

                return testOperatorResult(source, expected, []);
            }
        );
    });

    describe('DateTime set filter', () => {
        it.each([
            [inOp, 'IN'],
            [nin, 'NOT IN'],
        ])(
            'returns correct sql for DateArray for all date scalar operator %s',
            (opEnum, opString) => {
                const source = `{ CreatedDate: { ${opEnum}: [{ value: "2013-10-07T08:23:19.120Z" }, { value: "2014-10-07T08:23:19.120Z" }, { literal: TODAY }, { literal: TOMORROW }, {value: null}] } }`;

                const expected =
                    `WITH recordsCTE AS (select TABLE_1_1 from "TABLE_1" where TABLE_1_0 like 'UiApi::RecordRepresentation%') ` +
                    `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                    `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                    `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                    `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                    `FROM recordsCTE as 'TimeSheet'  ` +
                    `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') ${opString} (?, ?, datetime('now'), datetime('now', '+1 day'), null) ` +
                    `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

                return testOperatorResult(source, expected, [
                    "'2013-10-07T08:23:19.120Z'",
                    "'2014-10-07T08:23:19.120Z'",
                ]);
            }
        );
    });

    describe('date functions', () => {
        it('returns correct sql for DAY_OF_MONTH', () => {
            const source = `{ CreatedDate: { DAY_OF_MONTH: {eq: 7}} }`;

            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from "TABLE_1" where TABLE_1_0 like 'UiApi::RecordRepresentation%') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( strftime('%d', json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value')) = ? ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            return testOperatorResult(source, expected, ["'07'"]);
        });
    });
});
