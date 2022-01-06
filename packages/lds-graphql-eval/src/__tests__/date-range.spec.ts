import { recordFilter } from '../filter-parser';
import { unwrappedValue } from '../Result';
import infoJson from './mockData/objectInfos.json';
// eslint-disable-next-line no-undef
const infoMap = infoJson as ObjectInfoMap;

import { parseAndVisit } from '@luvio/graphql-parser';
import { findRecordSelections } from '../ast-parser';
import { LuvioArgumentNode, LuvioDocumentNode } from '@luvio/graphql-parser';
import {
    BetweenPredicate,
    ComparisonOperator,
    ComparisonPredicate,
    NotPredicate,
    PredicateType,
    ValueType,
} from '../Predicate';

const { eq, ne, gt, gte, lt, lte } = ComparisonOperator;

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
    expectedValue: any //DateInput | DateTimeInput | DateArray | DateTimeArray
) {
    const graphqlSource = makeGraphQL(source);
    const where = findWhereArg(parseAndVisit(graphqlSource));
    const filter = recordFilter(where, 'TimeSheet', 'TimeSheet', infoMap);

    expect(filter.isSuccess).toEqual(true);
    expect(unwrappedValue(filter).joinNames).toEqual([]);
    expect(unwrappedValue(filter).joinPredicates).toEqual([]);
    expect(unwrappedValue(filter).predicate).toEqual(expectedValue);
}

describe('date range parser', () => {
    describe('Date range last_n_months', () => {
        it('date equal date range last_n_months', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ EndDate: { ${opEnum}: { range: { last_n_months: 4 } } } }`;

                const expected: BetweenPredicate = {
                    type: PredicateType.between,
                    compareDate: {
                        type: ValueType.Extract,
                        jsonAlias: 'TimeSheet',
                        path: 'data.fields.EndDate.value',
                    },
                    start: {
                        type: ValueType.RelativeDate,
                        unit: 'month',
                        amount: -4,
                        offset: 'start',
                        hasTime: false,
                    },
                    end: {
                        type: ValueType.RelativeDate,
                        unit: 'month',
                        amount: -1,
                        offset: 'end',
                        hasTime: false,
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(eq);
        });

        it('date not equal date range last_n_months', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ EndDate: { ${opEnum}: { range: { last_n_months: 4 } } } }`;

                const expected: NotPredicate = {
                    type: PredicateType.not,
                    child: {
                        type: PredicateType.between,
                        compareDate: {
                            type: ValueType.Extract,
                            jsonAlias: 'TimeSheet',
                            path: 'data.fields.EndDate.value',
                        },
                        start: {
                            type: ValueType.RelativeDate,
                            unit: 'month',
                            amount: -4,
                            offset: 'start',
                            hasTime: false,
                        },
                        end: {
                            type: ValueType.RelativeDate,
                            unit: 'month',
                            amount: -1,
                            offset: 'end',
                            hasTime: false,
                        },
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(ne);
        });

        it.each<[ComparisonOperator, number, 'start' | 'end']>([
            [gt, -1, 'end'],
            [gte, -4, 'start'],
            [lt, -4, 'start'],
            [lte, -1, 'end'],
        ])('date %s date range last_n_months', (op, amount, offset) => {
            const expected: ComparisonPredicate = {
                type: PredicateType.comparison,
                left: {
                    type: ValueType.Extract,
                    jsonAlias: 'TimeSheet',
                    path: 'data.fields.EndDate.value',
                },
                right: {
                    type: ValueType.RelativeDate,
                    unit: 'month',
                    amount,
                    offset,
                    hasTime: false,
                },
                operator: op,
            };

            const source = `{ EndDate: { ${op}: { range: { last_n_months: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Date range next_n_months', () => {
        it('date equal date range next_n_months', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ EndDate: { ${opEnum}: { range: { next_n_months: 4 } } } }`;

                const expected: BetweenPredicate = {
                    type: PredicateType.between,
                    compareDate: {
                        type: ValueType.Extract,
                        jsonAlias: 'TimeSheet',
                        path: 'data.fields.EndDate.value',
                    },
                    start: {
                        type: ValueType.RelativeDate,
                        unit: 'month',
                        amount: 1,
                        offset: 'start',
                        hasTime: false,
                    },
                    end: {
                        type: ValueType.RelativeDate,
                        unit: 'month',
                        amount: 4,
                        offset: 'end',
                        hasTime: false,
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(eq);
        });

        it('date not equal date range next_n_months', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ EndDate: { ${opEnum}: { range: { next_n_months: 4 } } } }`;

                const expected: NotPredicate = {
                    type: PredicateType.not,
                    child: {
                        type: PredicateType.between,
                        compareDate: {
                            type: ValueType.Extract,
                            jsonAlias: 'TimeSheet',
                            path: 'data.fields.EndDate.value',
                        },
                        start: {
                            type: ValueType.RelativeDate,
                            unit: 'month',
                            amount: 1,
                            offset: 'start',
                            hasTime: false,
                        },
                        end: {
                            type: ValueType.RelativeDate,
                            unit: 'month',
                            amount: 4,
                            offset: 'end',
                            hasTime: false,
                        },
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(ne);
        });

        it.each<[ComparisonOperator, number, 'start' | 'end']>([
            [gt, 4, 'end'],
            [gte, 1, 'start'],
            [lt, 1, 'start'],
            [lte, 4, 'end'],
        ])('date %s date range next_n_months', (op, amount, offset) => {
            const expected: ComparisonPredicate = {
                type: PredicateType.comparison,
                left: {
                    type: ValueType.Extract,
                    jsonAlias: 'TimeSheet',
                    path: 'data.fields.EndDate.value',
                },
                right: {
                    type: ValueType.RelativeDate,
                    unit: 'month',
                    amount,
                    offset,
                    hasTime: false,
                },
                operator: op,
            };

            const source = `{ EndDate: { ${op}: { range: { next_n_months: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Date range last_n_days', () => {
        it('date equal date range last_n_days', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ EndDate: { ${opEnum}: { range: { last_n_days: 4 } } } }`;

                const expected: BetweenPredicate = {
                    type: PredicateType.between,
                    compareDate: {
                        type: ValueType.Extract,
                        jsonAlias: 'TimeSheet',
                        path: 'data.fields.EndDate.value',
                    },
                    start: {
                        type: ValueType.RelativeDate,
                        unit: 'day',
                        amount: -4,
                        offset: undefined,
                        hasTime: false,
                    },
                    end: {
                        type: ValueType.RelativeDate,
                        unit: 'day',
                        amount: 0,
                        offset: undefined,
                        hasTime: false,
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(eq);
        });

        it('date not equal date range last_n_days', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ EndDate: { ${opEnum}: { range: { last_n_days: 4 } } } }`;

                const expected: NotPredicate = {
                    type: PredicateType.not,
                    child: {
                        type: PredicateType.between,
                        compareDate: {
                            type: ValueType.Extract,
                            jsonAlias: 'TimeSheet',
                            path: 'data.fields.EndDate.value',
                        },
                        start: {
                            type: ValueType.RelativeDate,
                            unit: 'day',
                            amount: -4,
                            offset: undefined,
                            hasTime: false,
                        },
                        end: {
                            type: ValueType.RelativeDate,
                            unit: 'day',
                            amount: 0,
                            offset: undefined,
                            hasTime: false,
                        },
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(ne);
        });

        it.each<[ComparisonOperator, number, 'start' | 'end']>([
            [gt, 0, 'end'],
            [gte, -4, 'start'],
            [lt, -4, 'start'],
            [lte, 0, 'end'],
        ])('date %s date range last_n_days', (op, amount) => {
            const expected: ComparisonPredicate = {
                type: PredicateType.comparison,
                left: {
                    type: ValueType.Extract,
                    jsonAlias: 'TimeSheet',
                    path: 'data.fields.EndDate.value',
                },
                right: {
                    type: ValueType.RelativeDate,
                    unit: 'day',
                    amount,
                    offset: undefined,
                    hasTime: false,
                },
                operator: op,
            };

            const source = `{ EndDate: { ${op}: { range: { last_n_days: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Date range next_n_days', () => {
        it('date equal date range next_n_days', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ EndDate: { ${opEnum}: { range: { next_n_days: 4 } } } }`;

                const expected: BetweenPredicate = {
                    type: PredicateType.between,
                    compareDate: {
                        type: ValueType.Extract,
                        jsonAlias: 'TimeSheet',
                        path: 'data.fields.EndDate.value',
                    },
                    start: {
                        type: ValueType.RelativeDate,
                        unit: 'day',
                        amount: 1,
                        offset: undefined,
                        hasTime: false,
                    },
                    end: {
                        type: ValueType.RelativeDate,
                        unit: 'day',
                        amount: 4,
                        offset: undefined,
                        hasTime: false,
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(eq);
        });

        it('date not equal date range next_n_days', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ EndDate: { ${opEnum}: { range: { next_n_days: 4 } } } }`;

                const expected: NotPredicate = {
                    type: PredicateType.not,
                    child: {
                        type: PredicateType.between,
                        compareDate: {
                            type: ValueType.Extract,
                            jsonAlias: 'TimeSheet',
                            path: 'data.fields.EndDate.value',
                        },
                        start: {
                            type: ValueType.RelativeDate,
                            unit: 'day',
                            amount: 1,
                            offset: undefined,
                            hasTime: false,
                        },
                        end: {
                            type: ValueType.RelativeDate,
                            unit: 'day',
                            amount: 4,
                            offset: undefined,
                            hasTime: false,
                        },
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(ne);
        });

        it.each<[ComparisonOperator, number, 'start' | 'end']>([
            [gt, 4, 'end'],
            [gte, 1, 'start'],
            [lt, 1, 'start'],
            [lte, 4, 'end'],
        ])('date %s date range next_n_days', (op, amount) => {
            const expected: ComparisonPredicate = {
                type: PredicateType.comparison,
                left: {
                    type: ValueType.Extract,
                    jsonAlias: 'TimeSheet',
                    path: 'data.fields.EndDate.value',
                },
                right: {
                    type: ValueType.RelativeDate,
                    unit: 'day',
                    amount,
                    offset: undefined,
                    hasTime: false,
                },
                operator: op,
            };

            const source = `{ EndDate: { ${op}: { range: { next_n_days: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Datetime range last_n_months', () => {
        it('datetime equal date range', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ CreatedDate: { ${opEnum}: { range: { last_n_months: 4 } } } }`;

                const expected: BetweenPredicate = {
                    type: PredicateType.between,
                    compareDate: {
                        type: ValueType.Extract,
                        jsonAlias: 'TimeSheet',
                        path: 'data.fields.CreatedDate.value',
                    },
                    start: {
                        type: ValueType.RelativeDate,
                        unit: 'month',
                        amount: -4,
                        offset: 'start',
                        hasTime: true,
                    },
                    end: {
                        type: ValueType.RelativeDate,
                        unit: 'month',
                        amount: -1,
                        offset: 'end',
                        hasTime: true,
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(eq);
        });

        it('datetime not equal date range', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ CreatedDate: { ${opEnum}: { range: { last_n_months: 4 } } } }`;

                const expected: NotPredicate = {
                    type: PredicateType.not,
                    child: {
                        type: PredicateType.between,
                        compareDate: {
                            type: ValueType.Extract,
                            jsonAlias: 'TimeSheet',
                            path: 'data.fields.CreatedDate.value',
                        },
                        start: {
                            type: ValueType.RelativeDate,
                            unit: 'month',
                            amount: -4,
                            offset: 'start',
                            hasTime: true,
                        },
                        end: {
                            type: ValueType.RelativeDate,
                            unit: 'month',
                            amount: -1,
                            offset: 'end',
                            hasTime: true,
                        },
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(ne);
        });

        it.each<[ComparisonOperator, number, 'start' | 'end']>([
            [gt, -1, 'end'],
            [gte, -4, 'start'],
            [lt, -4, 'start'],
            [lte, -1, 'end'],
        ])('datetime %s date range last_n_months', (op, amount, offset) => {
            const expected: ComparisonPredicate = {
                type: PredicateType.comparison,
                left: {
                    type: ValueType.Extract,
                    jsonAlias: 'TimeSheet',
                    path: 'data.fields.CreatedDate.value',
                },
                right: {
                    type: ValueType.RelativeDate,
                    unit: 'month',
                    amount,
                    offset,
                    hasTime: true,
                },
                operator: op,
            };

            const source = `{ CreatedDate: { ${op}: { range: { last_n_months: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Datetime range next_n_months', () => {
        it('datetime equal date range next_n_months', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ CreatedDate: { ${opEnum}: { range: { next_n_months: 4 } } } }`;

                const expected: BetweenPredicate = {
                    type: PredicateType.between,
                    compareDate: {
                        type: ValueType.Extract,
                        jsonAlias: 'TimeSheet',
                        path: 'data.fields.CreatedDate.value',
                    },
                    start: {
                        type: ValueType.RelativeDate,
                        unit: 'month',
                        amount: 1,
                        offset: 'start',
                        hasTime: true,
                    },
                    end: {
                        type: ValueType.RelativeDate,
                        unit: 'month',
                        amount: 4,
                        offset: 'end',
                        hasTime: true,
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(eq);
        });

        it('datetime not equal date range next_n_months', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ CreatedDate: { ${opEnum}: { range: { next_n_months: 4 } } } }`;

                const expected: NotPredicate = {
                    type: PredicateType.not,
                    child: {
                        type: PredicateType.between,
                        compareDate: {
                            type: ValueType.Extract,
                            jsonAlias: 'TimeSheet',
                            path: 'data.fields.CreatedDate.value',
                        },
                        start: {
                            type: ValueType.RelativeDate,
                            unit: 'month',
                            amount: 1,
                            offset: 'start',
                            hasTime: true,
                        },
                        end: {
                            type: ValueType.RelativeDate,
                            unit: 'month',
                            amount: 4,
                            offset: 'end',
                            hasTime: true,
                        },
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(ne);
        });

        it.each<[ComparisonOperator, number, 'start' | 'end']>([
            [gt, 4, 'end'],
            [gte, 1, 'start'],
            [lt, 1, 'start'],
            [lte, 4, 'end'],
        ])('datetime %s date range next_n_months', (op, amount, offset) => {
            const expected: ComparisonPredicate = {
                type: PredicateType.comparison,
                left: {
                    type: ValueType.Extract,
                    jsonAlias: 'TimeSheet',
                    path: 'data.fields.CreatedDate.value',
                },
                right: {
                    type: ValueType.RelativeDate,
                    unit: 'month',
                    amount,
                    offset,
                    hasTime: true,
                },
                operator: op,
            };

            const source = `{ CreatedDate: { ${op}: { range: { next_n_months: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Datetime range last_n_days', () => {
        it('datetime equal date range last_n_days', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ CreatedDate: { ${opEnum}: { range: { last_n_days: 4 } } } }`;

                const expected: BetweenPredicate = {
                    type: PredicateType.between,
                    compareDate: {
                        type: ValueType.Extract,
                        jsonAlias: 'TimeSheet',
                        path: 'data.fields.CreatedDate.value',
                    },
                    start: {
                        type: ValueType.RelativeDate,
                        unit: 'day',
                        amount: -4,
                        offset: undefined,
                        hasTime: true,
                    },
                    end: {
                        type: ValueType.RelativeDate,
                        unit: 'day',
                        amount: 0,
                        offset: undefined,
                        hasTime: true,
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(eq);
        });

        it('datetime not equal date range last_n_days', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ CreatedDate: { ${opEnum}: { range: { last_n_days: 4 } } } }`;

                const expected: NotPredicate = {
                    type: PredicateType.not,
                    child: {
                        type: PredicateType.between,
                        compareDate: {
                            type: ValueType.Extract,
                            jsonAlias: 'TimeSheet',
                            path: 'data.fields.CreatedDate.value',
                        },
                        start: {
                            type: ValueType.RelativeDate,
                            unit: 'day',
                            amount: -4,
                            offset: undefined,
                            hasTime: true,
                        },
                        end: {
                            type: ValueType.RelativeDate,
                            unit: 'day',
                            amount: 0,
                            offset: undefined,
                            hasTime: true,
                        },
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(ne);
        });

        it.each<[ComparisonOperator, number, 'start' | 'end']>([
            [gt, 0, 'end'],
            [gte, -4, 'start'],
            [lt, -4, 'start'],
            [lte, 0, 'end'],
        ])('datetime %s date range last_n_days', (op, amount) => {
            const expected: ComparisonPredicate = {
                type: PredicateType.comparison,
                left: {
                    type: ValueType.Extract,
                    jsonAlias: 'TimeSheet',
                    path: 'data.fields.CreatedDate.value',
                },
                right: {
                    type: ValueType.RelativeDate,
                    unit: 'day',
                    amount,
                    offset: undefined,
                    hasTime: true,
                },
                operator: op,
            };

            const source = `{ CreatedDate: { ${op}: { range: { last_n_days: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });

    describe('Datetime range next_n_days', () => {
        it('datetime equal date range next_n_days', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ CreatedDate: { ${opEnum}: { range: { next_n_days: 4 } } } }`;

                const expected: BetweenPredicate = {
                    type: PredicateType.between,
                    compareDate: {
                        type: ValueType.Extract,
                        jsonAlias: 'TimeSheet',
                        path: 'data.fields.CreatedDate.value',
                    },
                    start: {
                        type: ValueType.RelativeDate,
                        unit: 'day',
                        amount: 1,
                        offset: undefined,
                        hasTime: true,
                    },
                    end: {
                        type: ValueType.RelativeDate,
                        unit: 'day',
                        amount: 4,
                        offset: undefined,
                        hasTime: true,
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(eq);
        });

        it('datetime not equal date range next_n_days', () => {
            const testWithOperator = (opEnum) => {
                const source = `{ CreatedDate: { ${opEnum}: { range: { next_n_days: 4 } } } }`;

                const expected: NotPredicate = {
                    type: PredicateType.not,
                    child: {
                        type: PredicateType.between,
                        compareDate: {
                            type: ValueType.Extract,
                            jsonAlias: 'TimeSheet',
                            path: 'data.fields.CreatedDate.value',
                        },
                        start: {
                            type: ValueType.RelativeDate,
                            unit: 'day',
                            amount: 1,
                            offset: undefined,
                            hasTime: true,
                        },
                        end: {
                            type: ValueType.RelativeDate,
                            unit: 'day',
                            amount: 4,
                            offset: undefined,
                            hasTime: true,
                        },
                    },
                };

                return testOperatorResult(source, expected);
            };

            testWithOperator(ne);
        });

        it.each<[ComparisonOperator, number, 'start' | 'end']>([
            [gt, 4, 'end'],
            [gte, 1, 'start'],
            [lt, 1, 'start'],
            [lte, 4, 'end'],
        ])('datetime %s date range next_n_days', (op, amount) => {
            const expected: ComparisonPredicate = {
                type: PredicateType.comparison,
                left: {
                    type: ValueType.Extract,
                    jsonAlias: 'TimeSheet',
                    path: 'data.fields.CreatedDate.value',
                },
                right: {
                    type: ValueType.RelativeDate,
                    unit: 'day',
                    amount,
                    offset: undefined,
                    hasTime: true,
                },
                operator: op,
            };

            const source = `{ CreatedDate: { ${op}: { range: { next_n_days: 4 } } } }`;
            return testOperatorResult(source, expected);
        });
    });
});
