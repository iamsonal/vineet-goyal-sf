import { isExpressionEqual, removeDuplicateFields, removeDuplicatePredicates } from '../comparison';
import {
    ChildField,
    ComparisonOperator,
    ComparisonPredicate,
    CompoundOperator,
    CompoundPredicate,
    DateEnumType,
    Expression,
    FieldType,
    NotPredicate,
    NullComparisonOperator,
    NullComparisonPredicate,
    PredicateType,
    ScalarField,
    ValueType,
} from '../Predicate';

describe('comparison', () => {
    describe('removeDuplicateFields', () => {
        describe('scalar fields', () => {
            it('removes scalar field with matching extract and path', () => {
                const fields: ScalarField[] = [
                    {
                        extract: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                        path: 'Id',
                        type: FieldType.Scalar,
                    },
                    {
                        extract: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                        path: 'Id',
                        type: FieldType.Scalar,
                    },
                ];

                expect(removeDuplicateFields(fields)).toEqual([fields[1]]);
            });

            it('does not remove scalar field with different path', () => {
                const fields: ScalarField[] = [
                    {
                        extract: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                        path: 'Id',
                        type: FieldType.Scalar,
                    },
                    {
                        extract: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                        path: 'Name',
                        type: FieldType.Scalar,
                    },
                ];

                expect(removeDuplicateFields(fields)).toEqual(fields);
            });

            it('does not remove scalar field with different extract', () => {
                const fields: ScalarField[] = [
                    {
                        extract: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                        path: 'Id',
                        type: FieldType.Scalar,
                    },
                    {
                        extract: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id2' },
                        path: 'Id',
                        type: FieldType.Scalar,
                    },
                ];

                expect(removeDuplicateFields(fields)).toEqual(fields);
            });
        });

        describe('child fields', () => {
            it('removes duplicate child field', () => {
                const fields: ChildField[] = [
                    {
                        connection: {
                            predicate: undefined,
                            fields: [],
                            alias: 'Alias1',
                            first: undefined,
                            orderBy: undefined,
                            joinNames: [],
                            apiName: 'TimeSheet',
                        },
                        path: 'Id',
                        type: FieldType.Child,
                    },
                    {
                        connection: {
                            predicate: undefined,
                            fields: [],
                            alias: 'Alias1',
                            first: undefined,
                            orderBy: undefined,
                            joinNames: [],
                            apiName: 'TimeSheet',
                        },
                        path: 'Id',
                        type: FieldType.Child,
                    },
                    {
                        connection: {
                            predicate: undefined,
                            fields: [],
                            alias: 'Alias2',
                            first: 10,
                            orderBy: {
                                asc: true,
                                extract: {
                                    type: ValueType.Extract,
                                    path: 'Name',
                                    jsonAlias: 'TimeSheet',
                                },
                                nullsFirst: false,
                            },
                            joinNames: [],
                            apiName: 'TimeSheet',
                        },
                        path: 'Id',
                        type: FieldType.Child,
                    },
                    {
                        connection: {
                            predicate: undefined,
                            fields: [],
                            alias: 'Alias2',
                            first: 10,
                            orderBy: {
                                asc: true,
                                extract: {
                                    type: ValueType.Extract,
                                    path: 'Name',
                                    jsonAlias: 'TimeSheet',
                                },
                                nullsFirst: false,
                            },
                            joinNames: [],
                            apiName: 'TimeSheet',
                        },
                        path: 'Id',
                        type: FieldType.Child,
                    },
                ];

                expect(removeDuplicateFields(fields)).toEqual([fields[1], fields[3]]);
            });
        });
    });

    describe('removeDuplicatePredicates', () => {
        describe('NullComparison', () => {
            const predicateType = PredicateType.nullComparison;

            it('removes duplicate null comparison', () => {
                const predicates: NullComparisonPredicate[] = [
                    {
                        type: predicateType,
                        operator: NullComparisonOperator.is,
                        left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                    },
                    {
                        type: predicateType,
                        operator: NullComparisonOperator.is,
                        left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual([predicates[1]]);
            });

            it('does not remove null compare with different operator', () => {
                const predicates: NullComparisonPredicate[] = [
                    {
                        type: predicateType,
                        operator: NullComparisonOperator.is,
                        left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                    },
                    {
                        type: predicateType,
                        operator: NullComparisonOperator.isNot,
                        left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual(predicates);
            });

            it('does not remove null compare with different expression', () => {
                const predicates: NullComparisonPredicate[] = [
                    {
                        type: predicateType,
                        operator: NullComparisonOperator.is,
                        left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                    },
                    {
                        type: predicateType,
                        operator: NullComparisonOperator.is,
                        left: {
                            type: ValueType.Extract,
                            jsonAlias: 'data.fields.Name.value',
                            path: 'Name',
                        },
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual(predicates);
            });
        });

        describe('NotPredicate', () => {
            const predicateType = PredicateType.not;

            it('removes duplicate not comparison', () => {
                const predicates: NotPredicate[] = [
                    {
                        type: predicateType,
                        child: {
                            type: PredicateType.comparison,
                            operator: ComparisonOperator.eq,
                            left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                            right: { type: ValueType.DoubleLiteral, value: 1 },
                        },
                    },
                    {
                        type: predicateType,
                        child: {
                            type: PredicateType.comparison,
                            operator: ComparisonOperator.eq,
                            left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                            right: { type: ValueType.DoubleLiteral, value: 1 },
                        },
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual([predicates[1]]);
            });

            it('does not remove not compare with different operator', () => {
                const predicates: NotPredicate[] = [
                    {
                        type: predicateType,
                        child: {
                            type: PredicateType.comparison,
                            operator: ComparisonOperator.eq,
                            left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                            right: { type: ValueType.DoubleLiteral, value: 1 },
                        },
                    },
                    {
                        type: predicateType,
                        child: {
                            type: PredicateType.comparison,
                            operator: ComparisonOperator.lt,
                            left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                            right: { type: ValueType.DoubleLiteral, value: 1 },
                        },
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual(predicates);
            });

            it('does not remove not compare with different value', () => {
                const predicates: NotPredicate[] = [
                    {
                        type: predicateType,
                        child: {
                            type: PredicateType.comparison,
                            operator: ComparisonOperator.eq,
                            left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                            right: { type: ValueType.DoubleLiteral, value: 1 },
                        },
                    },
                    {
                        type: predicateType,
                        child: {
                            type: PredicateType.comparison,
                            operator: ComparisonOperator.eq,
                            left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                            right: { type: ValueType.DoubleLiteral, value: 2 },
                        },
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual(predicates);
            });
        });

        describe('AndPredicate', () => {
            const predicateType = PredicateType.compound;

            it('removes duplicate AND comparison', () => {
                const predicates: CompoundPredicate[] = [
                    {
                        type: predicateType,
                        operator: CompoundOperator.and,
                        children: [
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                                right: { type: ValueType.DoubleLiteral, value: 1 },
                            },
                        ],
                    },
                    {
                        type: predicateType,
                        operator: CompoundOperator.and,

                        children: [
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                                right: { type: ValueType.DoubleLiteral, value: 1 },
                            },
                        ],
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual([predicates[1]]);
            });

            it('does not remove AND compare with different operator', () => {
                const predicates: CompoundPredicate[] = [
                    {
                        type: predicateType,
                        operator: CompoundOperator.and,

                        children: [
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                                right: { type: ValueType.DoubleLiteral, value: 1 },
                            },
                        ],
                    },
                    {
                        type: predicateType,
                        operator: CompoundOperator.and,

                        children: [
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.lt,
                                left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                                right: { type: ValueType.DoubleLiteral, value: 1 },
                            },
                        ],
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual(predicates);
            });

            it('does not remove AND compare with different value', () => {
                const predicates: CompoundPredicate[] = [
                    {
                        type: predicateType,
                        operator: CompoundOperator.and,

                        children: [
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                                right: { type: ValueType.DoubleLiteral, value: 1 },
                            },
                        ],
                    },
                    {
                        type: predicateType,
                        operator: CompoundOperator.and,

                        children: [
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                                right: { type: ValueType.DoubleLiteral, value: 2 },
                            },
                        ],
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual(predicates);
            });
        });

        describe('OrPredicate', () => {
            const predicateType = PredicateType.compound;
            const compoundOperator = CompoundOperator.or;

            it('removes duplicate OR', () => {
                const predicates: CompoundPredicate[] = [
                    {
                        type: predicateType,
                        operator: compoundOperator,
                        children: [
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                                right: { type: ValueType.DoubleLiteral, value: 1 },
                            },
                        ],
                    },
                    {
                        type: predicateType,
                        operator: compoundOperator,

                        children: [
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                                right: { type: ValueType.DoubleLiteral, value: 1 },
                            },
                        ],
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual([predicates[1]]);
            });

            it('does not remove OR with different operator', () => {
                const predicates: CompoundPredicate[] = [
                    {
                        type: predicateType,
                        operator: compoundOperator,

                        children: [
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                                right: { type: ValueType.DoubleLiteral, value: 1 },
                            },
                        ],
                    },
                    {
                        type: predicateType,
                        operator: compoundOperator,

                        children: [
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.lt,
                                left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                                right: { type: ValueType.DoubleLiteral, value: 1 },
                            },
                        ],
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual(predicates);
            });

            it('does not remove OR with different value', () => {
                const predicates: CompoundPredicate[] = [
                    {
                        type: predicateType,
                        operator: compoundOperator,

                        children: [
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                                right: { type: ValueType.DoubleLiteral, value: 1 },
                            },
                        ],
                    },
                    {
                        type: predicateType,
                        operator: compoundOperator,

                        children: [
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                                right: { type: ValueType.DoubleLiteral, value: 2 },
                            },
                        ],
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual(predicates);
            });
        });

        describe('ComparisonPredicate', () => {
            const predicateType = PredicateType.comparison;

            it('removes duplicate comparison', () => {
                const predicates: ComparisonPredicate[] = [
                    {
                        type: predicateType,
                        operator: ComparisonOperator.eq,
                        left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                        right: { type: ValueType.DoubleLiteral, value: 1 },
                    },
                    {
                        type: predicateType,
                        operator: ComparisonOperator.eq,
                        left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                        right: { type: ValueType.DoubleLiteral, value: 1 },
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual([predicates[1]]);
            });

            it('does not remove compare with different operator', () => {
                const predicates: ComparisonPredicate[] = [
                    {
                        type: predicateType,
                        operator: ComparisonOperator.eq,
                        left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                        right: { type: ValueType.DoubleLiteral, value: 1 },
                    },
                    {
                        type: predicateType,
                        operator: ComparisonOperator.lt,
                        left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                        right: { type: ValueType.DoubleLiteral, value: 1 },
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual(predicates);
            });

            it('does not remove compare with different value', () => {
                const predicates: ComparisonPredicate[] = [
                    {
                        type: predicateType,
                        operator: ComparisonOperator.eq,
                        left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                        right: { type: ValueType.DoubleLiteral, value: 1 },
                    },
                    {
                        type: predicateType,
                        operator: ComparisonOperator.eq,
                        left: { type: ValueType.Extract, jsonAlias: 'data.id', path: 'Id' },
                        right: { type: ValueType.DoubleLiteral, value: 2 },
                    },
                ];

                expect(removeDuplicatePredicates(predicates)).toEqual(predicates);
            });
        });
    });

    const stuff: [string, Expression, boolean][] = [
        ['a string', { type: ValueType.StringLiteral, value: 'b' }, false],
        ['a double', { type: ValueType.DoubleLiteral, value: 4 }, false],
        ['an int', { type: ValueType.IntLiteral, value: 7 }, false],
        ['a bool', { type: ValueType.BooleanLiteral, value: false }, false],
        ['a string array', { type: ValueType.StringArray, value: ['a'] }, false],
        ['a number array', { type: ValueType.NumberArray, value: [1] }, false],
        ['a date value', { type: ValueType.DateValue, value: 'a' }, false],
        ['a date enum', { type: ValueType.DateEnum, value: DateEnumType.today }, false],
        ['a date time value', { type: ValueType.DateTimeValue, value: 'a' }, false],
        ['a date time enum', { type: ValueType.DateTimeEnum, value: DateEnumType.tomorrow }, false],
        ['a null', { type: ValueType.NullValue }, false],
        [
            'a date array',
            {
                type: ValueType.DateArray,
                value: [
                    { type: ValueType.DateValue, value: 'a' },
                    { type: ValueType.DateEnum, value: DateEnumType.today },
                ],
            },
            false,
        ],
        [
            'a date time array',
            {
                type: ValueType.DateTimeArray,
                value: [
                    { type: ValueType.DateTimeValue, value: 'a' },
                    { type: ValueType.DateTimeEnum, value: DateEnumType.today },
                ],
            },
            false,
        ],
        ['an extract', { type: ValueType.Extract, path: 'id', jsonAlias: 'Account' }, false],
    ];

    describe('expression equality', () => {
        it.each<[string, Expression, boolean]>(
            stuff.concat([['an equal string', { type: ValueType.StringLiteral, value: 'a' }, true]])
        )('compares string literal to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual(
                { type: ValueType.StringLiteral, value: 'a' },
                comparedTo
            );
            expect(actual).toEqual(expected);
        });

        it.each<[string, Expression, boolean]>(
            stuff.concat([['an equal double', { type: ValueType.DoubleLiteral, value: 5 }, true]])
        )('compares double literal to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual(
                { type: ValueType.DoubleLiteral, value: 5 },
                comparedTo
            );
            expect(actual).toEqual(expected);
        });

        it.each<[string, Expression, boolean]>(
            stuff.concat([['an equal int', { type: ValueType.IntLiteral, value: 5 }, true]])
        )('compares int literal to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual({ type: ValueType.IntLiteral, value: 5 }, comparedTo);
            expect(actual).toEqual(expected);
        });

        it.each<[string, Expression, boolean]>(
            stuff.concat([
                ['an equal boolean', { type: ValueType.BooleanLiteral, value: true }, true],
            ])
        )('compares boolean to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual(
                { type: ValueType.BooleanLiteral, value: true },
                comparedTo
            );
            expect(actual).toEqual(expected);
        });

        it.each<[string, Expression, boolean]>(
            stuff.concat([
                ['an equal string array', { type: ValueType.StringArray, value: ['b', 'd'] }, true],
            ])
        )('compares string array to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual(
                { type: ValueType.StringArray, value: ['b', 'd'] },
                comparedTo
            );
            expect(actual).toEqual(expected);
        });

        it.each<[string, Expression, boolean]>(
            stuff.concat([
                ['an equal number array', { type: ValueType.NumberArray, value: [5, 7] }, true],
            ])
        )('compares number array to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual(
                { type: ValueType.NumberArray, value: [5, 7] },
                comparedTo
            );
            expect(actual).toEqual(expected);
        });

        it.each<[string, Expression, boolean]>(
            stuff.concat([
                ['an equal date value', { type: ValueType.DateValue, value: '14/02/1979' }, true],
            ])
        )('compares date value to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual(
                { type: ValueType.DateValue, value: '14/02/1979' },
                comparedTo
            );
            expect(actual).toEqual(expected);
        });

        it.each<[string, Expression, boolean]>(
            stuff.concat([
                [
                    'an equal date enum',
                    { type: ValueType.DateEnum, value: DateEnumType.tomorrow },
                    true,
                ],
            ])
        )('compares date enum to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual(
                { type: ValueType.DateEnum, value: DateEnumType.tomorrow },
                comparedTo
            );
            expect(actual).toEqual(expected);
        });

        it.each<[string, Expression, boolean]>(
            stuff.concat([
                [
                    'an equal date time value',
                    { type: ValueType.DateTimeValue, value: '14/02/1979T00:00.000Z' },
                    true,
                ],
            ])
        )('compares date time value to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual(
                { type: ValueType.DateTimeValue, value: '14/02/1979T00:00.000Z' },
                comparedTo
            );
            expect(actual).toEqual(expected);
        });

        it.each<[string, Expression, boolean]>(
            stuff.concat([
                [
                    'an equal date time enum',
                    { type: ValueType.DateTimeEnum, value: DateEnumType.today },
                    true,
                ],
            ])
        )('compares date time enum to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual(
                { type: ValueType.DateTimeEnum, value: DateEnumType.today },
                comparedTo
            );
            expect(actual).toEqual(expected);
        });

        const nullEach = stuff
            .filter((a) => a[1].type !== ValueType.NullValue)
            .concat([['an equal null', { type: ValueType.NullValue }, true]]);

        it.each<[string, Expression, boolean]>(nullEach)(
            'compares a null to %s',
            (_, comparedTo, expected) => {
                const actual = isExpressionEqual({ type: ValueType.NullValue }, comparedTo);
                expect(actual).toEqual(expected);
            }
        );

        it.each<[string, Expression, boolean]>(
            stuff.concat([
                [
                    'an equal date array',
                    {
                        type: ValueType.DateArray,
                        value: [
                            { type: ValueType.DateValue, value: '14/02/1979' },
                            { type: ValueType.DateValue, value: '03/02/1979' },
                        ],
                    },
                    true,
                ],
            ])
        )('compares date array to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual(
                {
                    type: ValueType.DateArray,
                    value: [
                        { type: ValueType.DateValue, value: '14/02/1979' },
                        { type: ValueType.DateValue, value: '03/02/1979' },
                    ],
                },
                comparedTo
            );
            expect(actual).toEqual(expected);
        });

        it.each<[string, Expression, boolean]>(
            stuff.concat([
                [
                    'an equal date time array',
                    {
                        type: ValueType.DateTimeArray,
                        value: [
                            { type: ValueType.DateTimeValue, value: '14/02/1979T00:00.000Z' },
                            { type: ValueType.DateTimeValue, value: '03/02/1979T00:00.000Z' },
                        ],
                    },
                    true,
                ],
            ])
        )('compares date array to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual(
                {
                    type: ValueType.DateTimeArray,
                    value: [
                        { type: ValueType.DateTimeValue, value: '14/02/1979T00:00.000Z' },
                        { type: ValueType.DateTimeValue, value: '03/02/1979T00:00.000Z' },
                    ],
                },
                comparedTo
            );
            expect(actual).toEqual(expected);
        });

        it.each<[string, Expression, boolean]>(
            stuff.concat([
                [
                    'an equal extract',
                    { type: ValueType.Extract, path: 'data.id', jsonAlias: 'Account' },
                    true,
                ],
            ])
        )('compares extract to %s', (_, comparedTo, expected) => {
            const actual = isExpressionEqual(
                { type: ValueType.Extract, path: 'data.id', jsonAlias: 'Account' },
                comparedTo
            );
            expect(actual).toEqual(expected);
        });
    });
});
