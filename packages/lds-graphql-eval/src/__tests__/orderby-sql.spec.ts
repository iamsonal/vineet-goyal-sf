import { unwrappedValue } from '../Result';
import infoJson from './mockData/objectInfos.json';
import * as parser from '@salesforce/lds-graphql-parser';
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

function testOperatorResult(orderBy: string | undefined, expectedValue: string) {
    const graphqlSource = makeOrderByGraphQL(orderBy);
    const result = transform(parser.default(graphqlSource), { userId: 'MyId', objectInfoMap });
    expect(sql(unwrappedValue(result), sqlMappingInput)).toEqual(expectedValue);
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
            `(SELECT json_group_array(json_set('{}', '$.node.TimeSheetNumber.value', (json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.value')) )) ` +
            `FROM (SELECT 'TimeSheet'.TABLE_1_1 as 'TimeSheet.JSON' ` +
            `FROM recordsCTE as 'TimeSheet'  ` +
            `WHERE json_extract("TimeSheet.JSON", '$.data.apiName') = 'TimeSheet' ` +
            `ORDER BY CASE WHEN json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.value') IS NULL THEN 1 ELSE 0 END ${nullsOrder}, json_extract("TimeSheet.JSON", '$.data.fields.TimeSheetNumber.value') ${order} ` +
            `)) ) as json`;

        return testOperatorResult(source, expected);
    });
});
