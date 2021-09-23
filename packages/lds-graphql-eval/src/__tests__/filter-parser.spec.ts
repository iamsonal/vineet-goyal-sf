import {
    LuvioArgumentNode,
    LuvioListValueNode,
    LuvioObjectValueNode,
    LuvioValueNode,
} from '@salesforce/lds-graphql-parser';
import { recordFilter } from '../filter-parser';
import { ObjectInfoMap } from '../info-types';
import { JsonExtract, PredicateContainer } from '../Predicate';
import { comparison, combinePredicates, stringLiteral } from '../util';
import infoJson from './mockData/objectInfos.json';
import { unwrappedError, unwrappedValue } from '../Result';

const infoMap = infoJson as ObjectInfoMap;

function jsonExtract(object: string, path: string): JsonExtract {
    return { type: 'JsonExtract', jsonAlias: object, path };
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

const selfIdCompare = comparison(jsonExtract('TimeSheet', 'Id'), 'eq', stringLiteral('Adrian'));
const selfTimeSheetCompare = comparison(
    jsonExtract('TimeSheet', 'TimeSheetNumber'),
    'eq',
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
                infoMap
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
                infoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.predicate).toEqual(
                combinePredicates(
                    [
                        comparison(
                            jsonExtract('TimeSheet', 'TimeSheetNumber'),
                            'eq',
                            stringLiteral('Adrian')
                        ),
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'Email'),
                            'eq',
                            stringLiteral('Adrian')
                        ),
                    ],
                    'and'
                )
            );
            expect(value.joinPredicates).toEqual([
                comparison(
                    jsonExtract('TimeSheet', 'CreatedById'),
                    'eq',
                    jsonExtract('TimeSheet.CreatedBy', 'id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'apiName'),
                    'eq',
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
                infoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.predicate).toEqual(
                combinePredicates(
                    [
                        comparison(
                            jsonExtract('TimeSheet', 'TimeSheetNumber'),
                            'eq',
                            stringLiteral('Adrian')
                        ),
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'Email'),
                            'eq',
                            stringLiteral('Adrian')
                        ),
                    ],
                    'or'
                )
            );
            expect(value.joinPredicates).toEqual([
                comparison(
                    jsonExtract('TimeSheet', 'CreatedById'),
                    'eq',
                    jsonExtract('TimeSheet.CreatedBy', 'id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'apiName'),
                    'eq',
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
                infoMap
            );

            expect(filter.isSuccess).toEqual(false);

            expect(unwrappedError(filter).length).toEqual(1);
            expect(unwrappedError(filter)[0]).toEqual('Value for and node must be a list.');
        });

        it('returns undefined filter for empty AND', () => {
            let filter = recordFilter(
                where({
                    and: listNode([]),
                }),
                'TimeSheet',
                'TimeSheet',
                infoMap
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
                infoMap
            );

            expect(filter.isSuccess).toEqual(true);
            expect(unwrappedValue(filter).joinNames).toEqual([]);
            expect(unwrappedValue(filter).joinPredicates).toEqual([]);
            expect(unwrappedValue(filter).predicate).toEqual(
                combinePredicates([selfIdCompare, selfTimeSheetCompare], 'and')
            );
        });

        it('returns spanning filter for parent field', () => {
            let filter = recordFilter(
                where({
                    CreatedBy: objNode({
                        Email: objNode({ eq: stringNode('Adrian') }),
                    }),
                }),
                'TimeSheet',
                'TimeSheet',
                infoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.joinNames).toEqual(['TimeSheet.CreatedBy']);
            expect(value.joinPredicates).toEqual([
                comparison(
                    jsonExtract('TimeSheet', 'CreatedById'),
                    'eq',
                    jsonExtract('TimeSheet.CreatedBy', 'id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'apiName'),
                    'eq',
                    stringLiteral('User')
                ),
            ]);
            expect(value.predicate).toEqual(
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'Email'),
                    'eq',
                    stringLiteral('Adrian')
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
                infoMap
            );

            const errors = unwrappedError(filter);
            expect(filter.isSuccess).toEqual(false);
            expect(errors).toEqual([
                'Comparison operator foo is not supported for type String.',
                'Comparison operator bar is not supported for type String.',
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
                infoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.joinNames).toEqual(['TimeSheet.CreatedBy']);
            expect(value.joinPredicates).toEqual([
                comparison(
                    jsonExtract('TimeSheet', 'CreatedById'),
                    'eq',
                    jsonExtract('TimeSheet.CreatedBy', 'id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'apiName'),
                    'eq',
                    stringLiteral('User')
                ),
            ]);
            expect(value.predicate).toEqual(
                combinePredicates(
                    [
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'Email'),
                            'eq',
                            stringLiteral('x')
                        ),
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'Email'),
                            'like',
                            stringLiteral('y')
                        ),
                    ],
                    'and'
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
                infoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.joinNames).toEqual(['TimeSheet.CreatedBy']);
            expect(value.joinPredicates).toEqual([
                comparison(
                    jsonExtract('TimeSheet', 'CreatedById'),
                    'eq',
                    jsonExtract('TimeSheet.CreatedBy', 'id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'apiName'),
                    'eq',
                    stringLiteral('User')
                ),
            ]);
            expect(value.predicate).toEqual(
                combinePredicates(
                    [
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'Email'),
                            'eq',
                            stringLiteral('a')
                        ),
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'Email'),
                            'like',
                            stringLiteral('b')
                        ),
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'Id'),
                            'eq',
                            stringLiteral('c')
                        ),
                        comparison(
                            jsonExtract('TimeSheet.CreatedBy', 'Id'),
                            'like',
                            stringLiteral('d')
                        ),
                    ],
                    'and'
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
                infoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.joinNames).toEqual([]);
            expect(value.joinPredicates).toEqual([]);
            expect(value.predicate).toEqual(
                comparison(jsonExtract('TimeSheet', 'Id'), 'eq', stringLiteral('c'))
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
                infoMap
            );

            const value = unwrappedValue(filter);
            expect(filter.isSuccess).toEqual(true);
            expect(value.joinNames).toEqual([
                'TimeSheet.CreatedBy.CreatedBy',
                'TimeSheet.CreatedBy',
            ]);
            expect(value.joinPredicates).toEqual([
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'CreatedById'),
                    'eq',
                    jsonExtract('TimeSheet.CreatedBy.CreatedBy', 'id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy.CreatedBy', 'apiName'),
                    'eq',
                    stringLiteral('User')
                ),
                comparison(
                    jsonExtract('TimeSheet', 'CreatedById'),
                    'eq',
                    jsonExtract('TimeSheet.CreatedBy', 'id')
                ),
                comparison(
                    jsonExtract('TimeSheet.CreatedBy', 'apiName'),
                    'eq',
                    stringLiteral('User')
                ),
            ]);
            expect(value.predicate).toEqual(
                comparison(
                    jsonExtract('TimeSheet.CreatedBy.CreatedBy', 'Email'),
                    'eq',
                    stringLiteral('Adrian')
                )
            );
        });

        describe('Field operator values', () => {
            function testOperatorResult(
                field: string,
                value: LuvioValueNode,
                expected: PredicateContainer,
                operator: string = 'eq'
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
                    infoMap
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
                            type: 'JsonExtract',
                        },
                        operator: op,
                        right: value,
                        type: 'comparison',
                    },
                };
            };

            it('returns predicate when double field is paired with an supported operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'TotalDurationInHours',
                        doubleNode('33.5'),
                        expectedValue(op, 'TotalDurationInHours', {
                            type: 'DoubleLiteral',
                            value: 33.5,
                        }),
                        op
                    );

                ['eq', 'ne', 'lt', 'gt', 'lte', 'gte'].forEach(testWithOperator);
            });

            it('returns predicate when int field is paired with an supported operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'TotalDurationInMinutes',
                        intNode('33.6'),
                        expectedValue(op, 'TotalDurationInMinutes', {
                            type: 'IntLiteral',
                            value: 33,
                        }),
                        op
                    );

                ['eq', 'ne', 'lt', 'gt', 'lte', 'gte'].forEach(testWithOperator);
            });

            it('returns predicate when string field is paired with an supported operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'TimeSheetNumber',
                        stringNode('33'),
                        expectedValue(op, 'TimeSheetNumber', {
                            type: 'StringLiteral',
                            value: '33',
                        }),
                        op
                    );

                ['eq', 'ne', 'lt', 'gt', 'lte', 'gte', 'like'].forEach(testWithOperator);
            });

            it('returns predicate when boolean field is paired with an supported operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'IsDeleted',
                        booleanNode(false),
                        expectedValue(op, 'IsDeleted', { type: 'BooleanLiteral', value: false }),
                        op
                    );

                ['eq', 'ne'].forEach(testWithOperator);
            });

            it('returns predicate when double field is paired with IN, NIN operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'TotalDurationInHours',
                        listNode([doubleNode('33.5'), doubleNode('34.6')]),
                        expectedValue(op, 'TotalDurationInHours', {
                            type: 'NumberArray',
                            value: [33.5, 34.6],
                        }),
                        op
                    );

                ['in', 'nin'].forEach(testWithOperator);
            });

            it('returns predicate when int field is paired with IN, NIN operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'TotalDurationInMinutes',
                        listNode([intNode('33'), intNode('34')]),
                        expectedValue(op, 'TotalDurationInMinutes', {
                            type: 'NumberArray',
                            value: [33, 34],
                        }),
                        op
                    );

                ['in', 'nin'].forEach(testWithOperator);
            });

            it('returns predicate when string field is paired with IN, NIN operators', () => {
                const testWithOperator = (op) =>
                    testOperatorResult(
                        'TimeSheetNumber',
                        listNode([stringNode('33'), stringNode('34')]),
                        expectedValue(op, 'TimeSheetNumber', {
                            type: 'StringArray',
                            value: ['33', '34'],
                        }),
                        op
                    );

                ['in', 'nin'].forEach(testWithOperator);
            });
        });

        describe('Field operator errors', () => {
            function expectedFieldError(
                field: string,
                value: LuvioValueNode,
                expectedError: string,
                operator: string = 'eq'
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
                    infoMap
                );

                expect(filter.isSuccess).toEqual(false);
                expect(unwrappedError(filter).length).toEqual(1);
                expect(unwrappedError(filter)[0]).toEqual(expectedError);
            }

            it('returns an error when double field IN or NIN ListValueNode contains a value with type different from field type', () => {
                const expected =
                    '{"kind":"BooleanValue","value":false} is not a valid value in list of FloatValue.';

                expectedFieldError(
                    'TotalDurationInHours',
                    listNode([booleanNode(false)]),
                    expected,
                    'in'
                );
                expectedFieldError(
                    'TotalDurationInHours',
                    listNode([booleanNode(false)]),
                    expected,
                    'nin'
                );
            });

            it('returns an error when string field IN ListValueNode contains a value with type different from field type', () => {
                const expected =
                    '{"kind":"BooleanValue","value":false} is not a valid value in list of StringValue.';

                expectedFieldError(
                    'TimeSheetNumber',
                    listNode([booleanNode(false)]),
                    expected,
                    'in'
                );
                expectedFieldError(
                    'TimeSheetNumber',
                    listNode([booleanNode(false)]),
                    expected,
                    'nin'
                );
            });

            it('returns an error when int field IN ListValueNode contains a value with type different from field type', () => {
                const expected =
                    '{"kind":"BooleanValue","value":false} is not a valid value in list of IntValue.';

                expectedFieldError(
                    'TotalDurationInMinutes',
                    listNode([booleanNode(false)]),
                    expected,
                    'in'
                );
                expectedFieldError(
                    'TotalDurationInMinutes',
                    listNode([booleanNode(false)]),
                    expected,
                    'nin'
                );
            });

            it('returns an error when double field IN is not paired with ListValueNode', () => {
                const expected = 'Comparison value must be a double array.';

                expectedFieldError('TotalDurationInHours', booleanNode(false), expected, 'in');
            });

            it('returns an error when string field IN is not paired with ListValueNode', () => {
                const expected = 'Comparison value must be a string array.';

                expectedFieldError('TimeSheetNumber', booleanNode(false), expected, 'in');
            });

            it('returns an error when int field IN is not paired with ListValueNode', () => {
                const expected = 'Comparison value must be an int array.';

                expectedFieldError('TotalDurationInMinutes', booleanNode(false), expected, 'in');
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

                ['in', 'nin', 'lt', 'gt', 'lte', 'gte', 'like'].forEach(testWithOperator);
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

                ['like'].forEach(testWithOperator);
            });

            it('returns an error when double field is paired with an unsupported operator', () => {
                const expected = (op) =>
                    `Comparison operator ${op} is not supported for type Double.`;
                const testWithOperator = (op) =>
                    expectedFieldError('TotalDurationInHours', doubleNode('33'), expected(op), op);

                ['like'].forEach(testWithOperator);
            });

            it('returns an error for unknown field definitions', () => {
                expectedFieldError(
                    'UnknownField',
                    booleanNode(false),
                    'Field UnknownField for type TimeSheet not found.'
                );
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
            expect(unwrappedError(filter)[0]).toEqual('Parent filter node should be an object.');
        });

        it('returns an error if field value is not an object or list', () => {
            let filter = recordFilter(
                where({
                    Id: { kind: 'StringValue', value: 'Adrian' },
                }),
                'TimeSheet',
                'TimeSheet',
                infoMap
            );

            expect(filter.isSuccess).toEqual(false);
            expect(unwrappedError(filter)[0]).toEqual('Filter node must be an object or list.');
        });
    });
});
