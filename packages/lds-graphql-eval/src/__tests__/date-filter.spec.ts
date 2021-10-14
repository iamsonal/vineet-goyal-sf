import { recordFilter } from '../filter-parser';
import { unwrappedError, unwrappedValue } from '../Result';
import infoJson from './mockData/objectInfos.json';
const infoMap = infoJson as ObjectInfoMap;

import * as parser from '@salesforce/lds-graphql-parser';
import { findRecordSelections } from '../ast-parser';
import { LuvioArgumentNode, LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import {
    ComparisonOperator,
    DateArray,
    DateEnum,
    DateEnumType,
    DateInput,
    DateTimeArray,
    DateTimeEnum,
    DateTimeInput,
    DateValue,
    NullComparisonOperator,
    NullComparisonPredicate,
    PredicateType,
    ValueType,
} from '../Predicate';

const { eq, ne, gt, gte, lt, lte, nin } = ComparisonOperator;
const inOp = ComparisonOperator.in;

function findWhereArg(document: LuvioDocumentNode): LuvioArgumentNode | undefined {
    return findRecordSelections(document).flatMap((selection) => {
        const args = selection.arguments || [];
        return args.filter((node) => node.name === 'where');
    })[0];
}

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

function testOperatorResult(
    source: string,
    expectedValue: DateInput | DateTimeInput | DateArray | DateTimeArray
) {
    const graphqlSource = makeGraphQL(source);
    const where = findWhereArg(parser.default(graphqlSource));
    const filter = recordFilter(where, 'TimeSheet', 'TimeSheet', infoMap);

    expect(filter.isSuccess).toEqual(true);
    expect(unwrappedValue(filter).joinNames).toEqual([]);
    expect(unwrappedValue(filter).joinPredicates).toEqual([]);
    expect(unwrappedValue(filter).predicate['right']).toEqual(expectedValue);
}

function testExpectedError(source: string, expectedError: any) {
    const graphqlSource = makeGraphQL(source);
    const where = findWhereArg(parser.default(graphqlSource));
    const filter = recordFilter(where, 'TimeSheet', 'TimeSheet', infoMap);

    expect(filter.isSuccess).toEqual(false);
    expect(unwrappedError(filter)).toEqual(expectedError);
}

describe('date filter parser', () => {
    describe('Date format regex', () => {
        it.each([eq, ne, gt, gte, lt, lte])(
            'does not allow datetime in place of date for scalar operator %s',
            (op) => {
                const source = `{ EndDate: { ${op}: { value: "2021-09-17T17:57:01.000Z" } } }`;

                return testExpectedError(source, ['Date format must be YYYY-MM-DD.']);
            }
        );

        it.each([eq, ne, gt, gte, lt, lte])(
            'does not allow date in place of datetime for scalar operator %s',
            (op) => {
                const source = `{ CreatedDate: { ${op}: { value: "2021-09-17" } } }`;

                return testExpectedError(source, [
                    'DateTime format must be YYYY-MM-DDTHH:MM:SS.SSSZ.',
                ]);
            }
        );
    });

    describe('Date filter', () => {
        it.each([eq, ne, gt, gte, lt, lte])(
            'returns Date Value for date scalar operator %s',
            (op) => {
                const expected: DateValue = {
                    type: ValueType.DateValue,
                    value: '2017-09-20',
                };

                const source = `{ EndDate: { ${op}: { value: "2017-09-20" } } }`;
                return testOperatorResult(source, expected);
            }
        );

        it('returns NullComparisonPredicate IS for null date value', () => {
            const graphqlSource = makeGraphQL(`{ EndDate: { eq: { value: null } } }`);
            const where = findWhereArg(parser.default(graphqlSource));
            const filter = recordFilter(where, 'TimeSheet', 'TimeSheet', infoMap);
            const expected: NullComparisonPredicate = {
                type: PredicateType.nullComparison,
                operator: NullComparisonOperator.is,
                left: {
                    jsonAlias: 'TimeSheet',
                    path: 'data.fields.EndDate.value',
                    type: ValueType.Extract,
                },
            };

            expect(filter.isSuccess).toEqual(true);
            expect(unwrappedValue(filter).joinNames).toEqual([]);
            expect(unwrappedValue(filter).joinPredicates).toEqual([]);
            expect(unwrappedValue(filter).predicate).toEqual(expected);
        });

        it('returns NullComparisonPredicate IS NOT for null date value', () => {
            const graphqlSource = makeGraphQL(`{ EndDate: { ne: { value: null } } }`);
            const where = findWhereArg(parser.default(graphqlSource));
            const filter = recordFilter(where, 'TimeSheet', 'TimeSheet', infoMap);
            const expected: NullComparisonPredicate = {
                type: PredicateType.nullComparison,
                operator: NullComparisonOperator.isNot,
                left: {
                    jsonAlias: 'TimeSheet',
                    path: 'data.fields.EndDate.value',
                    type: ValueType.Extract,
                },
            };

            expect(filter.isSuccess).toEqual(true);
            expect(unwrappedValue(filter).joinNames).toEqual([]);
            expect(unwrappedValue(filter).joinPredicates).toEqual([]);
            expect(unwrappedValue(filter).predicate).toEqual(expected);
        });

        it.each([gt, gte, lt, lte])('returns error when null value is compared with %s', (op) => {
            const source = `{ EndDate: { ${op}: { value: null } } }`;
            return testExpectedError(source, [`Null can not be compared with ${op}`]);
        });

        it.each([eq, ne, gt, gte, lt, lte])(
            'returns DateEnum for TODAY when compared with date scalar operator %s',
            (op) => {
                const expected: DateEnum = { type: ValueType.DateEnum, value: DateEnumType.today };

                const source = `{ EndDate: { ${op}: { literal: TODAY } } }`;
                return testOperatorResult(source, expected);
            }
        );

        it.each([eq, ne, gt, gte, lt, lte])(
            'returns DateEnum for TOMORROW when compared with date scalar operator %s',
            (op) => {
                const expected: DateEnum = {
                    type: ValueType.DateEnum,
                    value: DateEnumType.tomorrow,
                };

                const source = `{ EndDate: { ${op}: { literal: TOMORROW } } }`;
                return testOperatorResult(source, expected);
            }
        );

        it.each([eq, ne, gt, gte, lt, lte])(
            'returns error for unknown date enum when compared with %s',
            (op) => {
                const source = `{ EndDate: { ${op}: { literal: UNKNOWN } } }`;
                return testExpectedError(source, [`Unknown Date literal UNKNOWN.`]);
            }
        );

        it.each([eq, ne, gt, gte, lt, lte])(
            'returns error for bad date format when compared with %s',
            (op) => {
                const source = `{ EndDate: { ${op}: { value: "93oaxld-3" } } }`;
                return testExpectedError(source, [`Date format must be YYYY-MM-DD.`]);
            }
        );
    });

    describe('Date set filter', () => {
        it.each([inOp, nin])('returns returns Date Array for date scalar operator %s', (op) => {
            const expected: DateArray = {
                type: ValueType.DateArray,
                value: [
                    {
                        type: ValueType.DateValue,
                        value: '2017-09-20',
                    },
                    {
                        type: ValueType.DateEnum,
                        value: DateEnumType.today,
                    },
                    {
                        type: ValueType.DateEnum,
                        value: DateEnumType.tomorrow,
                    },
                    {
                        type: ValueType.NullValue,
                    },
                ],
            };

            const source = `{ EndDate: { ${op}: [{ value: "2017-09-20" }, { literal: TODAY }, { literal: TOMORROW }, {value: null}] } }`;
            return testOperatorResult(source, expected);
        });

        it.each([inOp, nin])('returns error for unknown date enum when compared with %s', (op) => {
            const source = `{ EndDate: { ${op}: [{ literal: BETWIXT }] } }`;
            return testExpectedError(source, [`Unknown Date literal BETWIXT.`]);
        });

        it.each([inOp, nin])('returns error for bad date format when compared with %s', (op) => {
            const source = `{ EndDate: { ${op}: [{  value: "93oaxld-3" }] } }`;
            return testExpectedError(source, [`Date format must be YYYY-MM-DD.`]);
        });
    });

    describe('DateTime filter', () => {
        it.each([eq, ne, gt, gte, lt, lte])(
            'returns DateTimeInput for all date time scalar operator %s',
            (op) => {
                const expected: DateTimeInput = {
                    type: ValueType.DateTimeValue,
                    value: '2021-09-17T17:57:01.000Z',
                };

                const source = `{ CreatedDate: { ${op}: { value: "2021-09-17T17:57:01.000Z" } } }`;
                return testOperatorResult(source, expected);
            }
        );

        it('returns NullComparisonPredicate IS for null date time value', () => {
            const graphqlSource = makeGraphQL(`{ CreatedDate: { eq: { value: null } } }`);
            const where = findWhereArg(parser.default(graphqlSource));
            const filter = recordFilter(where, 'TimeSheet', 'TimeSheet', infoMap);
            const expected: NullComparisonPredicate = {
                type: PredicateType.nullComparison,
                operator: NullComparisonOperator.is,
                left: {
                    jsonAlias: 'TimeSheet',
                    path: 'data.fields.CreatedDate.value',
                    type: ValueType.Extract,
                },
            };

            expect(filter.isSuccess).toEqual(true);
            expect(unwrappedValue(filter).joinNames).toEqual([]);
            expect(unwrappedValue(filter).joinPredicates).toEqual([]);
            expect(unwrappedValue(filter).predicate).toEqual(expected);
        });

        it('returns NullComparisonPredicate IS NOT for null date time value', () => {
            const graphqlSource = makeGraphQL(`{ CreatedDate: { ne: { value: null } } }`);
            const where = findWhereArg(parser.default(graphqlSource));
            const filter = recordFilter(where, 'TimeSheet', 'TimeSheet', infoMap);
            const expected: NullComparisonPredicate = {
                type: PredicateType.nullComparison,
                operator: NullComparisonOperator.isNot,
                left: {
                    jsonAlias: 'TimeSheet',
                    path: 'data.fields.CreatedDate.value',
                    type: ValueType.Extract,
                },
            };

            expect(filter.isSuccess).toEqual(true);
            expect(unwrappedValue(filter).joinNames).toEqual([]);
            expect(unwrappedValue(filter).joinPredicates).toEqual([]);
            expect(unwrappedValue(filter).predicate).toEqual(expected);
        });

        it.each([gt, gte, lt, lte])('returns error when null value is compared with %s', (op) => {
            const source = `{ CreatedDate: { ${op}: { value: null } } }`;
            return testExpectedError(source, [`Null can not be compared with ${op}`]);
        });

        it.each([eq, ne, gt, gte, lt, lte])(
            'returns DateTimeEnum for TODAY when compared to scalar operator %s',
            (op) => {
                const expected: DateTimeEnum = {
                    type: ValueType.DateTimeEnum,
                    value: DateEnumType.today,
                };

                const source = `{ CreatedDate: { ${op}: { literal: TODAY } } }`;
                return testOperatorResult(source, expected);
            }
        );

        it.each([eq, ne, gt, gte, lt, lte])(
            'returns DateTimeEnum for TOMORROW when compared to scalar operator %s',
            (op) => {
                const expected: DateTimeEnum = {
                    type: ValueType.DateTimeEnum,
                    value: DateEnumType.tomorrow,
                };

                const source = `{ CreatedDate: { ${op}: { literal: TOMORROW } } }`;
                return testOperatorResult(source, expected);
            }
        );

        it.each([eq, ne, gt, gte, lt, lte])(
            'returns error when unknown datetime enum is compared with %s',
            (op) => {
                const source = `{ CreatedDate: { ${op}: { literal: UNKNOWN } } }`;
                return testExpectedError(source, [`Unknown DateTime literal UNKNOWN.`]);
            }
        );

        it.each([eq, ne, gt, gte, lt, lte])(
            'returns error for bad date format when compared with %s',
            (op) => {
                const source = `{ CreatedDate: { ${op}: { value: "93oaxld-3" } } }`;
                return testExpectedError(source, [
                    `DateTime format must be YYYY-MM-DDTHH:MM:SS.SSSZ.`,
                ]);
            }
        );
    });

    describe('DateTime set filter', () => {
        it.each([inOp, nin])('returns DateTimeArray for date time scalar operator %s', (op) => {
            const expected: DateTimeArray = {
                type: ValueType.DateTimeArray,
                value: [
                    {
                        type: ValueType.DateTimeValue,
                        value: '2013-10-07T08:23:19.120Z',
                    },
                    {
                        type: ValueType.DateTimeEnum,
                        value: DateEnumType.today,
                    },
                    {
                        type: ValueType.DateTimeEnum,
                        value: DateEnumType.tomorrow,
                    },
                    {
                        type: ValueType.NullValue,
                    },
                ],
            };

            const source = `{ CreatedDate: { ${op}: [{ value: "2013-10-07T08:23:19.120Z" }, { literal: TODAY }, { literal: TOMORROW }, {value: null}] } }`;
            return testOperatorResult(source, expected);
        });

        it.each([inOp, nin])(
            'returns error for unknown date time enum when compared with set %s',
            (op) => {
                const source = `{ CreatedDate: { ${op}: [{ literal: BETWIXT }] } }`;
                return testExpectedError(source, [`Unknown DateTime literal BETWIXT.`]);
            }
        );

        it.each([inOp, nin])(
            'returns error for bad date time format when compared with set %s',
            (op) => {
                const source = `{ CreatedDate: { ${op}: [{  value: "93oaxld-3" }] } }`;
                return testExpectedError(source, [
                    `DateTime format must be YYYY-MM-DDTHH:MM:SS.SSSZ.`,
                ]);
            }
        );
    });
});
