import {
    LuvioArgumentNode,
    LuvioListValueNode,
    LuvioObjectValueNode,
    LuvioValueNode,
} from '@luvio/graphql-parser';
import { recordFilter } from '../filter-parser';
import { ObjectInfoMap } from '../info-types';
import {
    ComparisonOperator,
    CompoundOperator,
    JsonExtract,
    PredicateContainer,
    PredicateType,
    ValueType,
} from '../Predicate';
import { comparison, combinePredicates, stringLiteral } from '../util';
import infoJson from './mockData/objectInfos.json';
import { Failure, unwrappedError, unwrappedValue } from '../Result';
import { message, PredicateError, MessageError } from '../Error';

const objectInfoMap = infoJson as ObjectInfoMap;
const { eq, ne, gt, gte, like, lt, lte, nin } = ComparisonOperator;

function jsonExtract(object: string, path: string): JsonExtract {
    return { type: ValueType.Extract, jsonAlias: object, path };
}

function where(fields: { [name: string]: LuvioValueNode }): LuvioArgumentNode {
    return {
        kind: 'Argument',
        name: 'where',
        value: {
            kind: 'ObjectValue',
            fields: fields,
        },
    };
}

function objNode(fields: { [name: string]: LuvioValueNode }): LuvioObjectValueNode {
    return {
        kind: 'ObjectValue',
        fields: fields,
    };
}

function listNode(values: LuvioValueNode[]): LuvioListValueNode {
    return { kind: 'ListValue', values };
}

function stringNode(value: string): LuvioValueNode {
    return { kind: 'StringValue', value };
}

function booleanNode(value: boolean): LuvioValueNode {
    return { kind: 'BooleanValue', value };
}

function intNode(value: string): LuvioValueNode {
    return { kind: 'IntValue', value };
}

function doubleNode(value: string): LuvioValueNode {
    return { kind: 'FloatValue', value };
}

const selfIdCompare = comparison(jsonExtract('TimeSheet', 'data.id'), eq, stringLiteral('Adrian'));

const selfTimeSheetCompare = comparison(
    jsonExtract('TimeSheet', 'data.fields.TimeSheetNumber.value'),
    eq,
    stringLiteral('Adrian')
);

describe('filter-parser', () => {
    describe('recordFilter', () => {
        it('returns correct filter for self field', () => {
            let filter = recordFilter(
                where({
                    Id: objNode({ eq: stringNode('Adrian') }),
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            expect(filter.isSuccess).toEqual(true);
            expect(unwrappedValue(filter).joinNames).toEqual([]);
            expect(unwrappedValue(filter).joinPredicates).toEqual([]);
            expect(unwrappedValue(filter).predicate).toEqual(selfIdCompare);
        });

        it('returns AND with two predicates', () => {
            let filter = recordFilter(
                where({
                    and: listNode([
                        objNode({
                            TimeSheetNumber: objNode({ eq: stringNode('Adrian') }),
                        }),
                        objNode({
                            CreatedBy: objNode({
                                Email: objNode({ eq: stringNode('Adrian') }),
                            }),
                        }),
                    ]),
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.predicate).toEqual(
                combinePredicates(
                    [
                        comparison(
                            jsonExtract('TimeSheet', 'data.fields.TimeSheetNumber.value'),
                            eq,
                            stringLiteral('Adrian')
                        ),
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'data.fields.Email.value'),
                            eq,
                            stringLiteral('Adrian')
                        ),
                    ],
                    CompoundOperator.and
                )
            );
            expect(value.joinPredicates).toEqual([
                comparison(
                    jsonExtract('TimeSheet', 'data.fields.CreatedById.value'),
                    eq,
                    jsonExtract('TimeSheet.CreatedBy', 'data.id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'data.apiName'),
                    eq,
                    stringLiteral('User')
                ),
            ]);
            expect(value.joinNames).toEqual(['TimeSheet.CreatedBy']);
        });

        it('returns OR with two predicates', () => {
            let filter = recordFilter(
                where({
                    or: listNode([
                        objNode({
                            TimeSheetNumber: objNode({ eq: stringNode('Adrian') }),
                        }),
                        objNode({
                            CreatedBy: objNode({
                                Email: objNode({ eq: stringNode('Adrian') }),
                            }),
                        }),
                    ]),
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.predicate).toEqual(
                combinePredicates(
                    [
                        comparison(
                            jsonExtract('TimeSheet', 'data.fields.TimeSheetNumber.value'),
                            eq,
                            stringLiteral('Adrian')
                        ),
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'data.fields.Email.value'),
                            eq,
                            stringLiteral('Adrian')
                        ),
                    ],
                    CompoundOperator.or
                )
            );
            expect(value.joinPredicates).toEqual([
                comparison(
                    jsonExtract('TimeSheet', 'data.fields.CreatedById.value'),
                    eq,
                    jsonExtract('TimeSheet.CreatedBy', 'data.id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'data.apiName'),
                    eq,
                    stringLiteral('User')
                ),
            ]);
            expect(value.joinNames).toEqual(['TimeSheet.CreatedBy']);
        });

        it('returns an error for AND with no list value', () => {
            let filter = recordFilter(
                where({
                    and: objNode({ eq: stringNode('Adrian') }),
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            expect(filter.isSuccess).toEqual(false);

            expect(unwrappedError(filter).length).toEqual(1);
            expect(unwrappedError(filter)[0]).toEqual(
                message('Value for and node must be a list.')
            );
        });

        it('returns undefined filter for empty AND', () => {
            let filter = recordFilter(
                where({
                    and: listNode([]),
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            expect(filter.isSuccess).toEqual(true);
            expect(unwrappedValue(filter)).toEqual(undefined);
        });

        it('returns correct filter for two self fields', () => {
            let filter = recordFilter(
                where({
                    Id: objNode({ eq: stringNode('Adrian') }),
                    TimeSheetNumber: objNode({ eq: stringNode('Adrian') }),
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            expect(filter.isSuccess).toEqual(true);
            expect(unwrappedValue(filter).joinNames).toEqual([]);
            expect(unwrappedValue(filter).joinPredicates).toEqual([]);
            expect(unwrappedValue(filter).predicate).toEqual(
                combinePredicates([selfIdCompare, selfTimeSheetCompare], CompoundOperator.and)
            );
        });

        it('returns spanning filter for parent field', () => {
            let filter = recordFilter(
                where({
                    CreatedBy: objNode({
                        CreatedById: objNode({ eq: stringNode('239292') }),
                    }),
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.joinNames).toEqual(['TimeSheet.CreatedBy']);
            expect(value.joinPredicates).toEqual([
                comparison(
                    jsonExtract('TimeSheet', 'data.fields.CreatedById.value'),
                    eq,
                    jsonExtract('TimeSheet.CreatedBy', 'data.id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'data.apiName'),
                    eq,
                    stringLiteral('User')
                ),
            ]);
            expect(value.predicate).toEqual(
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'data.fields.CreatedById.value'),
                    eq,
                    stringLiteral('239292')
                )
            );
        });

        it('returns error for each unknown comparison operator', () => {
            let filter = recordFilter(
                where({
                    CreatedBy: objNode({
                        Email: objNode({
                            foo: stringNode('Adrian'),
                            bar: stringNode('Adrian'),
                        }),
                    }),
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            const errors = unwrappedError(filter);
            expect(filter.isSuccess).toEqual(false);
            expect(errors).toEqual([
                message('Comparison operator foo is not supported for type String.'),
                message('Comparison operator bar is not supported for type String.'),
            ]);
        });

        it('returns ANDed predicates for field with multiple comparators', () => {
            let filter = recordFilter(
                where({
                    CreatedBy: objNode({
                        Email: objNode({
                            eq: stringNode('x'),
                            like: stringNode('y'),
                        }),
                    }),
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.joinNames).toEqual(['TimeSheet.CreatedBy']);
            expect(value.joinPredicates).toEqual([
                comparison(
                    jsonExtract('TimeSheet', 'data.fields.CreatedById.value'),
                    eq,
                    jsonExtract('TimeSheet.CreatedBy', 'data.id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'data.apiName'),
                    eq,
                    stringLiteral('User')
                ),
            ]);
            expect(value.predicate).toEqual(
                combinePredicates(
                    [
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'data.fields.Email.value'),
                            eq,
                            stringLiteral('x')
                        ),
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'data.fields.Email.value'),
                            like,
                            stringLiteral('y')
                        ),
                    ],
                    CompoundOperator.and
                )
            );
        });

        it('returns a flattened AND predicate containing predicates for two fields with multiple comparators', () => {
            let filter = recordFilter(
                where({
                    CreatedBy: objNode({
                        Email: objNode({
                            eq: stringNode('a'),
                            like: stringNode('b'),
                        }),
                        Id: objNode({
                            eq: stringNode('c'),
                            like: stringNode('d'),
                        }),
                    }),
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.joinNames).toEqual(['TimeSheet.CreatedBy']);
            expect(value.joinPredicates).toEqual([
                comparison(
                    jsonExtract('TimeSheet', 'data.fields.CreatedById.value'),
                    eq,
                    jsonExtract('TimeSheet.CreatedBy', 'data.id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'data.apiName'),
                    eq,
                    stringLiteral('User')
                ),
            ]);
            expect(value.predicate).toEqual(
                combinePredicates(
                    [
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'data.fields.Email.value'),
                            eq,
                            stringLiteral('a')
                        ),
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'data.fields.Email.value'),
                            like,
                            stringLiteral('b')
                        ),
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'data.id'),
                            eq,
                            stringLiteral('c')
                        ),
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'data.id'),
                            like,
                            stringLiteral('d')
                        ),
                    ],
                    CompoundOperator.and
                )
            );
        });

        it('removes empty ANDs and ORs', () => {
            let filter = recordFilter(
                where({
                    Id: objNode({
                        eq: stringNode('c'),
                    }),
                    and: listNode([
                        objNode({
                            and: listNode([]),
                        }),
                    ]),
                    or: listNode([
                        objNode({
                            and: listNode([]),
                        }),
                    ]),
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.joinNames).toEqual([]);
            expect(value.joinPredicates).toEqual([]);
            expect(value.predicate).toEqual(
                comparison(jsonExtract('TimeSheet', 'data.id'), eq, stringLiteral('c'))
            );
        });

        it('returns spanning filter for grandparent field', () => {
            let filter = recordFilter(
                where({
                    CreatedBy: objNode({
                        CreatedBy: objNode({
                            Email: objNode({ eq: stringNode('Adrian') }),
                        }),
                    }),
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.joinNames).toEqual([
                'TimeSheet.CreatedBy.CreatedBy',
                'TimeSheet.CreatedBy',
            ]);
            expect(value.joinPredicates).toEqual([
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'data.fields.CreatedById.value'),
                    eq,
                    jsonExtract('TimeSheet.CreatedBy.CreatedBy', 'data.id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy.CreatedBy', 'data.apiName'),
                    eq,
                    stringLiteral('User')
                ),
                comparison(
                    jsonExtract('TimeSheet', 'data.fields.CreatedById.value'),
                    eq,
                    jsonExtract('TimeSheet.CreatedBy', 'data.id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'data.apiName'),
                    eq,
                    stringLiteral('User')
                ),
            ]);
            expect(value.predicate).toEqual(
                comparison(
                    jsonExtract('TimeSheet.CreatedBy.CreatedBy', 'data.fields.Email.value'),
                    eq,
                    stringLiteral('Adrian')
                )
            );
        });

        describe('Field operator values', () => {
            function testOperatorResult(
                field: string,
                value: LuvioValueNode,
                expected: PredicateContainer,
                operator: string = eq
            ) {
                let filter = recordFilter(
                    {
                        kind: 'Argument',
                        name: 'where',
                        value: {
                            kind: 'ObjectValue',
                            fields: {
                                [field]: {
                                    kind: 'ObjectValue',
                                    fields: {
                                        [operator]: value,
                                    },
                                },
                            },
                        },
                    },
                    'TimeSheet',
                    'TimeSheet',
                    objectInfoMap
                );

                expect(filter.isSuccess).toEqual(true);
                expect(unwrappedValue(filter)).toEqual(expected);
            }

            const expectedValue = (op, path, value): PredicateContainer => {
                return {
                    joinNames: [],
                    joinPredicates: [],
                    predicate: {
                        left: {
                            jsonAlias: 'TimeSheet',
                            path,
                            type: ValueType.Extract,
                        },
                        operator: op,
                        right: value,
                        type: PredicateType.comparison,
                    },
                };
            };

            it('returns predicate when double field is paired with an supported operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'TotalDurationInHours',
                        doubleNode('33.5'),
                        expectedValue(op, 'data.fields.TotalDurationInHours.value', {
                            type: 'DoubleLiteral',
                            value: 33.5,
                        }),
                        op
                    );

                [eq, ne, lt, gt, lte, gte].forEach(testWithOperator);
            });

            it('returns predicate when int field is paired with an supported operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'TotalDurationInMinutes',
                        intNode('33.6'),
                        expectedValue(op, 'data.fields.TotalDurationInMinutes.value', {
                            type: 'IntLiteral',
                            value: 33,
                        }),
                        op
                    );

                [eq, ne, lt, gt, lte, gte].forEach(testWithOperator);
            });

            it('returns predicate when string field is paired with an supported operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'TimeSheetNumber',
                        stringNode('33'),
                        expectedValue(op, 'data.fields.TimeSheetNumber.value', {
                            type: ValueType.StringLiteral,
                            value: '33',
                        }),
                        op
                    );

                [eq, ne, lt, gt, lte, gte, like].forEach(testWithOperator);
            });

            it('returns predicate when boolean field is paired with an supported operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'IsDeleted',
                        booleanNode(false),
                        expectedValue(op, 'data.fields.IsDeleted.value', {
                            type: 'BooleanLiteral',
                            value: false,
                        }),
                        op
                    );

                [eq, ne].forEach(testWithOperator);
            });

            it('returns predicate when double field is paired with IN, NIN operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'TotalDurationInHours',
                        listNode([doubleNode('33.5'), doubleNode('34.6')]),
                        expectedValue(op, 'data.fields.TotalDurationInHours.value', {
                            type: 'NumberArray',
                            value: [33.5, 34.6],
                        }),
                        op
                    );

                [ComparisonOperator.in, nin].forEach(testWithOperator);
            });

            it('returns predicate when int field is paired with IN, NIN operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'TotalDurationInMinutes',
                        listNode([intNode('33'), intNode('34')]),
                        expectedValue(op, 'data.fields.TotalDurationInMinutes.value', {
                            type: 'NumberArray',
                            value: [33, 34],
                        }),
                        op
                    );

                [ComparisonOperator.in, nin].forEach(testWithOperator);
            });

            it('returns predicate when string field is paired with IN, NIN operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'TimeSheetNumber',
                        listNode([stringNode('33'), stringNode('34')]),
                        expectedValue(op, 'data.fields.TimeSheetNumber.value', {
                            type: 'StringArray',
                            value: ['33', '34'],
                        }),
                        op
                    );

                [ComparisonOperator.in, nin].forEach(testWithOperator);
            });

            it('returns predicate when picklist field is paired with supported scalar operators', () => {
                const expectedValue = (op, path, value): PredicateContainer => {
                    return {
                        joinNames: [],
                        joinPredicates: [],
                        predicate: {
                            left: {
                                jsonAlias: 'ServiceResource',
                                path,
                                type: ValueType.Extract,
                            },
                            operator: op,
                            right: value,
                            type: PredicateType.comparison,
                        },
                    };
                };

                const testWithOperator = (op) => {
                    const filter = recordFilter(
                        {
                            kind: 'Argument',
                            name: 'where',
                            value: {
                                kind: 'ObjectValue',
                                fields: {
                                    ResourceType: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            [op]: {
                                                kind: 'StringValue',
                                                value: 'T',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        'ServiceResource',
                        'ServiceResource',
                        objectInfoMap
                    );

                    expect(filter.isSuccess).toEqual(true);
                    expect(unwrappedValue(filter)).toEqual(
                        expectedValue(op, 'data.fields.ResourceType.value', {
                            type: 'StringLiteral',
                            value: 'T',
                        })
                    );
                };

                [eq, ne].forEach(testWithOperator);
            });

            it('returns predicate when picklist field is paired with supported IN, NIN operators', () => {
                const expectedValue = (op, path, value): PredicateContainer => {
                    return {
                        joinNames: [],
                        joinPredicates: [],
                        predicate: {
                            left: {
                                jsonAlias: 'ServiceResource',
                                path,
                                type: ValueType.Extract,
                            },
                            operator: op,
                            right: value,
                            type: PredicateType.comparison,
                        },
                    };
                };

                const testWithOperator = (op) => {
                    const filter = recordFilter(
                        {
                            kind: 'Argument',
                            name: 'where',
                            value: {
                                kind: 'ObjectValue',
                                fields: {
                                    ResourceType: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            [op]: listNode([stringNode('T')]),
                                        },
                                    },
                                },
                            },
                        },
                        'ServiceResource',
                        'ServiceResource',
                        objectInfoMap
                    );
                    expect(filter.isSuccess).toEqual(true);
                    expect(unwrappedValue(filter)).toEqual(
                        expectedValue(op, 'data.fields.ResourceType.value', {
                            type: 'StringArray',
                            value: ['T'],
                        })
                    );
                };

                [ComparisonOperator.in, nin].forEach(testWithOperator);
            });

            it('returns predicate when currency field is paired with supported scalar operators', () => {
                const expectedValue = (op, path, value): PredicateContainer => {
                    return {
                        joinNames: [],
                        joinPredicates: [],
                        predicate: {
                            left: {
                                jsonAlias: 'Account',
                                path,
                                type: ValueType.Extract,
                            },
                            operator: op,
                            right: value,
                            type: PredicateType.comparison,
                        },
                    };
                };

                const testWithOperator = (op) => {
                    const filter = recordFilter(
                        {
                            kind: 'Argument',
                            name: 'where',
                            value: {
                                kind: 'ObjectValue',
                                fields: {
                                    AnnualRevenue: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            [op]: {
                                                kind: 'FloatValue',
                                                value: '123.45',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        'Account',
                        'Account',
                        objectInfoMap
                    );

                    expect(filter.isSuccess).toEqual(true);
                    expect(unwrappedValue(filter)).toEqual(
                        expectedValue(op, 'data.fields.AnnualRevenue.value', {
                            type: 'DoubleLiteral',
                            value: 123.45,
                        })
                    );
                };

                [eq, ne, lt, gt, lte, gte].forEach(testWithOperator);
            });

            it('returns predicate when currency field is paired with supported IN, NIN operators', () => {
                const expectedValue = (op, path, value): PredicateContainer => {
                    return {
                        joinNames: [],
                        joinPredicates: [],
                        predicate: {
                            left: {
                                jsonAlias: 'Account',
                                path,
                                type: ValueType.Extract,
                            },
                            operator: op,
                            right: value,
                            type: PredicateType.comparison,
                        },
                    };
                };

                const testWithOperator = (op) => {
                    const filter = recordFilter(
                        {
                            kind: 'Argument',
                            name: 'where',
                            value: {
                                kind: 'ObjectValue',
                                fields: {
                                    AnnualRevenue: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            [op]: listNode([doubleNode('123.45')]),
                                        },
                                    },
                                },
                            },
                        },
                        'Account',
                        'Account',
                        objectInfoMap
                    );
                    expect(filter.isSuccess).toEqual(true);
                    expect(unwrappedValue(filter)).toEqual(
                        expectedValue(op, 'data.fields.AnnualRevenue.value', {
                            type: 'NumberArray',
                            value: [123.45],
                        })
                    );
                };

                [ComparisonOperator.in, nin].forEach(testWithOperator);
            });
        });

        describe('Field operator errors', () => {
            function expectedFieldError(
                field: string,
                value: LuvioValueNode,
                expectedError: string,
                operator: ComparisonOperator = eq
            ) {
                let filter = recordFilter(
                    {
                        kind: 'Argument',
                        name: 'where',
                        value: {
                            kind: 'ObjectValue',
                            fields: {
                                [field]: {
                                    kind: 'ObjectValue',
                                    fields: {
                                        [operator]: value,
                                    },
                                },
                            },
                        },
                    },
                    'TimeSheet',
                    'TimeSheet',
                    objectInfoMap
                );

                expect(filter.isSuccess).toEqual(false);
                expect(unwrappedError(filter).length).toEqual(1);
                expect(unwrappedError(filter)[0]).toEqual(message(expectedError));
            }

            it('returns an error when double field IN or NIN ListValueNode contains a value with type different from field type', () => {
                const expected =
                    '{"kind":"BooleanValue","value":false} is not a valid value in list of FloatValue.';

                expectedFieldError(
                    'TotalDurationInHours',
                    listNode([booleanNode(false)]),
                    expected,
                    ComparisonOperator.in
                );
                expectedFieldError(
                    'TotalDurationInHours',
                    listNode([booleanNode(false)]),
                    expected,
                    nin
                );
            });

            it('returns an error when string field IN ListValueNode contains a value with type different from field type', () => {
                const expected =
                    '{"kind":"BooleanValue","value":false} is not a valid value in list of StringValue.';

                expectedFieldError(
                    'TimeSheetNumber',
                    listNode([booleanNode(false)]),
                    expected,
                    ComparisonOperator.in
                );
                expectedFieldError(
                    'TimeSheetNumber',
                    listNode([booleanNode(false)]),
                    expected,
                    nin
                );
            });

            it('returns an error when int field IN ListValueNode contains a value with type different from field type', () => {
                const expected =
                    '{"kind":"BooleanValue","value":false} is not a valid value in list of IntValue.';

                expectedFieldError(
                    'TotalDurationInMinutes',
                    listNode([booleanNode(false)]),
                    expected,
                    ComparisonOperator.in
                );
                expectedFieldError(
                    'TotalDurationInMinutes',
                    listNode([booleanNode(false)]),
                    expected,
                    nin
                );
            });

            it('returns an error when double field IN is not paired with ListValueNode', () => {
                const expected = 'Comparison value must be a double array.';

                expectedFieldError(
                    'TotalDurationInHours',
                    booleanNode(false),
                    expected,
                    ComparisonOperator.in
                );
            });

            it('returns an error when string field IN is not paired with ListValueNode', () => {
                const expected = 'Comparison value must be a string array.';

                expectedFieldError(
                    'TimeSheetNumber',
                    booleanNode(false),
                    expected,
                    ComparisonOperator.in
                );
            });

            it('returns an error when int field IN is not paired with ListValueNode', () => {
                const expected = 'Comparison value must be an int array.';

                expectedFieldError(
                    'TotalDurationInMinutes',
                    booleanNode(false),
                    expected,
                    ComparisonOperator.in
                );
            });

            it('returns an error when string field is compared to other types', () => {
                const expected = 'Comparison value must be a string.';

                expectedFieldError('TimeSheetNumber', booleanNode(false), expected);
                expectedFieldError('TimeSheetNumber', doubleNode('5.5'), expected);
                expectedFieldError('TimeSheetNumber', intNode('1'), expected);
                expectedFieldError('TimeSheetNumber', listNode([stringNode('1')]), expected);
            });

            it('returns an error when int field is compared to other types', () => {
                const expected = 'Comparison value must be an int.';

                expectedFieldError('TotalDurationInMinutes', booleanNode(false), expected);
                expectedFieldError('TotalDurationInMinutes', doubleNode('5.5'), expected);
                expectedFieldError('TotalDurationInMinutes', stringNode('hi'), expected);
                expectedFieldError('TotalDurationInMinutes', listNode([intNode('1')]), expected);
            });

            it('returns an error when double field is compared to other types', () => {
                const expected = 'Comparison value must be a double.';

                expectedFieldError('TotalDurationInHours', booleanNode(false), expected);
                expectedFieldError('TotalDurationInHours', intNode('1'), expected);
                expectedFieldError('TotalDurationInHours', stringNode('hi'), expected);
                expectedFieldError('TotalDurationInHours', listNode([doubleNode('1')]), expected);
            });

            it('returns an error when boolean field is compared to other types', () => {
                const expected = 'Comparison value must be a boolean.';

                expectedFieldError('IsDeleted', doubleNode('5.5'), expected);
                expectedFieldError('IsDeleted', intNode('1'), expected);
                expectedFieldError('IsDeleted', stringNode('hi'), expected);
                expectedFieldError('IsDeleted', listNode([booleanNode(false)]), expected);
            });

            it('returns an error when boolean field is paired with an unsupported operator', () => {
                const expected = (op) =>
                    `Comparison operator ${op} is not supported for type Boolean.`;
                const testWithOperator = (op) =>
                    expectedFieldError('IsDeleted', booleanNode(false), expected(op), op);

                [ComparisonOperator.in, nin, lt, gt, lte, gte, like].forEach(testWithOperator);
            });

            it('returns an error when string field is paired with an unsupported operator', () => {
                const expected = (op) =>
                    `Comparison operator ${op} is not supported for type String.`;
                const testWithOperator = (op) =>
                    expectedFieldError('TimeSheetNumber', stringNode('x'), expected(op), op);

                ['unknown'].forEach(testWithOperator);
            });

            it('returns an error when int field is paired with an unsupported operator', () => {
                const expected = (op) => `Comparison operator ${op} is not supported for type Int.`;
                const testWithOperator = (op) =>
                    expectedFieldError('TotalDurationInMinutes', intNode('33'), expected(op), op);

                [like].forEach(testWithOperator);
            });

            it('returns an error when double field is paired with an unsupported operator', () => {
                const expected = (op) =>
                    `Comparison operator ${op} is not supported for type Double.`;
                const testWithOperator = (op) =>
                    expectedFieldError('TotalDurationInHours', doubleNode('33'), expected(op), op);

                [like].forEach(testWithOperator);
            });

            it('returns an error for unknown field definitions', () => {
                expectedFieldError(
                    'UnknownField',
                    booleanNode(false),
                    'Field UnknownField for type TimeSheet not found.'
                );
            });

            it('returns error when picklist field is paired with unsupported operators', () => {
                const filter = recordFilter(
                    {
                        kind: 'Argument',
                        name: 'where',
                        value: {
                            kind: 'ObjectValue',
                            fields: {
                                ResourceType: {
                                    kind: 'ObjectValue',
                                    fields: {
                                        [like]: {
                                            kind: 'StringValue',
                                            value: 'T',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    'ServiceResource',
                    'ServiceResource',
                    objectInfoMap
                ) as Failure<PredicateContainer, PredicateError[]>;

                const { message } = filter.error[0] as MessageError;
                expect(filter.isSuccess).toEqual(false);
                expect(message).toEqual(
                    'Comparison operator like is not supported for type Picklist.'
                );
            });

            it('returns error when picklist operator is paired with unsupported values', () => {
                let filter = recordFilter(
                    where({
                        ResourceType: objNode({
                            [nin]: stringNode('foo'),
                        }),
                    }),
                    'ServiceResource',
                    'ServiceResource',
                    objectInfoMap
                ) as Failure<PredicateContainer, PredicateError[]>;

                expect(filter.isSuccess).toEqual(false);
                const { message } = filter.error[0] as MessageError;
                expect(message).toEqual('Comparison value must be a Picklist array.');
            });

            it('returns error when currency operator is paired with unsupported values', () => {
                let filter = recordFilter(
                    where({
                        AnnualRevenue: objNode({
                            [nin]: stringNode('foo'),
                        }),
                    }),
                    'Account',
                    'Account',
                    objectInfoMap
                ) as Failure<PredicateContainer, PredicateError[]>;

                expect(filter.isSuccess).toEqual(false);
                const { message } = filter.error[0] as MessageError;
                expect(message).toEqual('Comparison value must be a Currency array.');
            });
        });

        it('returns undefined filter when "where" does not exist', () => {
            let filter = recordFilter(undefined, '', '', {});
            expect(filter.isSuccess).toEqual(true);
            expect(unwrappedValue(filter)).toEqual(undefined);
        });

        it('returns an error result when "where.value" is not an object', () => {
            let filter = recordFilter(
                { kind: 'Argument', name: 'a', value: { kind: 'StringValue', value: '' } },
                '',
                '',
                {}
            );
            expect(filter.isSuccess).toEqual(false);
            expect(unwrappedError(filter).length).toEqual(1);
            expect(unwrappedError(filter)[0]).toEqual(
                message('Parent filter node should be an object.')
            );
        });

        it('returns an error if field value is not an object or list', () => {
            let filter = recordFilter(
                where({
                    Id: { kind: 'StringValue', value: 'Adrian' },
                }),
                'TimeSheet',
                'TimeSheet',
                objectInfoMap
            );

            expect(filter.isSuccess).toEqual(false);
            expect(unwrappedError(filter)[0]).toEqual(
                message('Filter node must be an object or list.')
            );
        });
    });
});
