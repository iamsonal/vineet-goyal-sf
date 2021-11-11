import { unwrappedValue } from '../Result';
import infoJson from './mockData/objectInfos.json';
import * as parser from '@salesforce/lds-graphql-parser';
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

const { eq, gt, gte, lt, lte } = ComparisonOperator;

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

function testOperatorResult(source: string, expectedValue: string) {
    const graphqlSource = makeGraphQL(source);
    const result = transform(parser.default(graphqlSource), { userId: 'MyId', objectInfoMap });
    expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expectedValue);
}

describe('date range to sql parser', () => {
    describe('Date range last_n_months', () => {
        it.each([
            [
                eq,
                `BETWEEN date('now', 'start of month', '-4 months') AND date('now', 'start of month', '0 months', '-1 day')`,
            ],
            [gt, `> date('now', 'start of month', '0 months', '-1 day')`],
            [gte, `>= date('now', 'start of month', '-4 months')`],
            [lt, `< date('now', 'start of month', '-4 months')`],
            [lte, `<= date('now', 'start of month', '0 months', '-1 day')`],
        ])('returns correct sql for last_n_months range scalar operator %s', (op, expectedComp) => {
            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') ${expectedComp} ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            const source = `{ EndDate: { ${op}: { range: { last_n_months: 4 } } } }`;
            return testOperatorResult(source, expected);
        });

        it('returns correct sql for last_n_months range scalar operator ne', () => {
            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( NOT (json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') BETWEEN date('now', 'start of month', '-4 months') ` +
                `AND date('now', 'start of month', '0 months', '-1 day')) ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            const source = `{ EndDate: { ne: { range: { last_n_months: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Date range next_n_months', () => {
        it.each([
            [
                eq,
                `BETWEEN date('now', 'start of month', '1 months') AND date('now', 'start of month', '5 months', '-1 day')`,
            ],
            [gt, `> date('now', 'start of month', '5 months', '-1 day')`],
            [gte, `>= date('now', 'start of month', '1 months')`],
            [lt, `< date('now', 'start of month', '1 months')`],
            [lte, `<= date('now', 'start of month', '5 months', '-1 day')`],
        ])('returns correct sql for next_n_month range scalar operator %s', (op, expectedComp) => {
            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') ${expectedComp} ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            const source = `{ EndDate: { ${op}: { range: { next_n_months: 4 } } } }`;
            return testOperatorResult(source, expected);
        });

        it('returns correct sql for next_n_months range scalar operator ne', () => {
            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( NOT (json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') BETWEEN date('now', 'start of month', '1 months') ` +
                `AND date('now', 'start of month', '5 months', '-1 day')) ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            const source = `{ EndDate: { ne: { range: { next_n_months: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Date range last_n_days', () => {
        it.each([
            [eq, `BETWEEN date('now', '-4 days') AND date('now', '0 days')`],
            [gt, `> date('now', '0 days')`],
            [gte, `>= date('now', '-4 days')`],
            [lt, `< date('now', '-4 days')`],
            [lte, `<= date('now', '0 days')`],
        ])(
            'returns correct sql for all last_n_days range scalar operator %s',
            (op, expectedComp) => {
                const expected =
                    `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                    `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                    `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                    `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                    `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                    `FROM recordsCTE as 'TimeSheet'  ` +
                    `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') ${expectedComp} ` +
                    `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

                const source = `{ EndDate: { ${op}: { range: { last_n_days: 4 } } } }`;
                return testOperatorResult(source, expected);
            }
        );

        it('returns correct sql for last_n_days range scalar operator ne', () => {
            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( NOT (json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') BETWEEN date('now', '-4 days') ` +
                `AND date('now', '0 days')) ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            const source = `{ EndDate: { ne: { range: { last_n_days: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Date range next_n_days', () => {
        it.each([
            [eq, `BETWEEN date('now', '1 days') AND date('now', '4 days')`],
            [gt, `> date('now', '4 days')`],
            [gte, `>= date('now', '1 days')`],
            [lt, `< date('now', '1 days')`],
            [lte, `<= date('now', '4 days')`],
        ])(
            'returns correct sql for all next_n_days range scalar operator %s',
            (op, expectedComp) => {
                const expected =
                    `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                    `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                    `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                    `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                    `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                    `FROM recordsCTE as 'TimeSheet'  ` +
                    `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') ${expectedComp} ` +
                    `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

                const source = `{ EndDate: { ${op}: { range: { next_n_days: 4 } } } }`;
                return testOperatorResult(source, expected);
            }
        );

        it('returns correct sql for next_n_days range scalar operator ne', () => {
            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( NOT (json_extract("TimeSheet.JSON", '$.data.fields.EndDate.value') BETWEEN date('now', '1 days') ` +
                `AND date('now', '4 days')) ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            const source = `{ EndDate: { ne: { range: { next_n_days: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Datetime range last_n_months', () => {
        it.each([
            [
                eq,
                `BETWEEN datetime('now', 'start of month', '-4 months') AND datetime('now', 'start of month', '0 months', '-1 day')`,
            ],
            [gt, `> datetime('now', 'start of month', '0 months', '-1 day')`],
            [gte, `>= datetime('now', 'start of month', '-4 months')`],
            [lt, `< datetime('now', 'start of month', '-4 months')`],
            [lte, `<= datetime('now', 'start of month', '0 months', '-1 day')`],
        ])(
            'returns correct sql for all last_n_months datetime range scalar operator %s',
            (op, expectedComp) => {
                const expected =
                    `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                    `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                    `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                    `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                    `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                    `FROM recordsCTE as 'TimeSheet'  ` +
                    `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') ${expectedComp} ` +
                    `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

                const source = `{ CreatedDate: { ${op}: { range: { last_n_months: 4 } } } }`;
                return testOperatorResult(source, expected);
            }
        );

        it('returns correct sql for last_n_months range scalar operator ne', () => {
            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( NOT (json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') BETWEEN datetime('now', 'start of month', '-4 months') ` +
                `AND datetime('now', 'start of month', '0 months', '-1 day')) ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            const source = `{ CreatedDate: { ne: { range: { last_n_months: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Datetime range next_n_months', () => {
        it.each([
            [
                eq,
                `BETWEEN datetime('now', 'start of month', '1 months') AND datetime('now', 'start of month', '5 months', '-1 day')`,
            ],
            [gt, `> datetime('now', 'start of month', '5 months', '-1 day')`],
            [gte, `>= datetime('now', 'start of month', '1 months')`],
            [lt, `< datetime('now', 'start of month', '1 months')`],
            [lte, `<= datetime('now', 'start of month', '5 months', '-1 day')`],
        ])(
            'returns correct sql for all next_n_month range scalar operator %s',
            (op, expectedComp) => {
                const expected =
                    `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                    `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                    `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                    `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                    `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                    `FROM recordsCTE as 'TimeSheet'  ` +
                    `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') ${expectedComp} ` +
                    `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

                const source = `{ CreatedDate: { ${op}: { range: { next_n_months: 4 } } } }`;
                return testOperatorResult(source, expected);
            }
        );

        it('returns correct sql for next_n_months range scalar operator ne', () => {
            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( NOT (json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') BETWEEN datetime('now', 'start of month', '1 months') ` +
                `AND datetime('now', 'start of month', '5 months', '-1 day')) ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            const source = `{ CreatedDate: { ne: { range: { next_n_months: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Datetime range last_n_days', () => {
        it.each([
            [eq, `BETWEEN datetime('now', '-4 days') AND datetime('now', '0 days')`],
            [gt, `> datetime('now', '0 days')`],
            [gte, `>= datetime('now', '-4 days')`],
            [lt, `< datetime('now', '-4 days')`],
            [lte, `<= datetime('now', '0 days')`],
        ])(
            'returns correct sql for all last_n_days range scalar operator %s',
            (op, expectedComp) => {
                const expected =
                    `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                    `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                    `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                    `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                    `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                    `FROM recordsCTE as 'TimeSheet'  ` +
                    `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') ${expectedComp} ` +
                    `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

                const source = `{ CreatedDate: { ${op}: { range: { last_n_days: 4 } } } }`;
                return testOperatorResult(source, expected);
            }
        );

        it('returns correct sql for last_n_days range scalar operator ne', () => {
            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( NOT (json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') BETWEEN datetime('now', '-4 days') ` +
                `AND datetime('now', '0 days')) ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            const source = `{ CreatedDate: { ne: { range: { last_n_days: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Datetime range next_n_days', () => {
        it.each([
            [eq, `BETWEEN datetime('now', '1 days') AND datetime('now', '4 days')`],
            [gt, `> datetime('now', '4 days')`],
            [gte, `>= datetime('now', '1 days')`],
            [lt, `< datetime('now', '1 days')`],
            [lte, `<= datetime('now', '4 days')`],
        ])(
            'returns correct sql for all next_n_days range scalar operator %s',
            (op, expectedComp) => {
                const expected =
                    `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                    `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                    `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                    `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                    `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                    `FROM recordsCTE as 'TimeSheet'  ` +
                    `WHERE ( json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') ${expectedComp} ` +
                    `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

                const source = `{ CreatedDate: { ${op}: { range: { next_n_days: 4 } } } }`;
                return testOperatorResult(source, expected);
            }
        );

        it('returns correct sql for next_n_days range scalar operator ne', () => {
            const expected =
                `WITH recordsCTE AS (select TABLE_1_1 from TABLE_1 where TABLE_1_0 like 'UiApi\\%3A\\%3ARecordRepresentation%' ESCAPE '\\') ` +
                `SELECT json_set('{}', '$.data.uiapi.query.TimeSheet.edges', ` +
                `(SELECT json_group_array(json_set('{}', '$.node.Id', (json_extract("TimeSheet.JSON", '$.data.id')), '$.node._drafts', (json_extract("TimeSheet.JSON", '$.data.drafts')), ` +
                `'$.node._metadata', (json_extract("TimeSheet.JSON", '$.metadata')) )) ` +
                `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
                `FROM recordsCTE as 'TimeSheet'  ` +
                `WHERE ( NOT (json_extract("TimeSheet.JSON", '$.data.fields.CreatedDate.value') BETWEEN datetime('now', '1 days') ` +
                `AND datetime('now', '4 days')) ` +
                `AND json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ) )) ) as json`;

            const source = `{ CreatedDate: { ne: { range: { next_n_days: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });
});
