import { unwrappedError, unwrappedValue } from '../Result';
import infoJson from './mockData/objectInfos.json';
const infoMap = infoJson as ObjectInfoMap;

import { parseAndVisit } from '@luvio/graphql-parser';
import { findRecordSelections, transform } from '../ast-parser';
import { LuvioArgumentNode, LuvioDocumentNode } from '@luvio/graphql-parser';
import {
    ComparisonOperator,
    CompoundOperator,
    FieldType,
    OrderByContainer,
    PredicateType,
    RootQuery,
    ValueType,
} from '../Predicate';
import { parseOrderBy } from '../orderby-parser';
import { ObjectInfoMap } from '../info-types';
import { message } from '../Error';

function findOrderByArg(document: LuvioDocumentNode): LuvioArgumentNode | undefined {
    return findRecordSelections(document).flatMap((selection) => {
        const args = selection.arguments || [];
        return args.filter((node) => node.name === 'orderBy');
    })[0];
}

export function makeOrderByGraphQL(orderBy: string | undefined, edges: string = 'Id'): string {
    const arg = orderBy === undefined ? '' : `(orderBy: ${orderBy})`;

    return /* GraphQL */ `
    query {
        uiapi {
            query {
                TimeSheet${arg}
                    @connection {
                    edges {
                        node @resource(type: "Record") {
                            ${edges}
                        }
                    }
                }
            }
        }
    }
`;
}

function operatorResult(source: string | undefined): OrderByContainer[] | undefined {
    const graphqlSource = makeOrderByGraphQL(source);
    const orderByArg = findOrderByArg(parseAndVisit(graphqlSource));
    const orderBy = parseOrderBy(orderByArg, 'TimeSheet', 'TimeSheet', infoMap);

    expect(orderBy.isSuccess).toEqual(true);

    return unwrappedValue(orderBy);
}

function testExpectedError(source: string, expectedError: string) {
    const graphqlSource = makeOrderByGraphQL(source);
    const orderByArg = findOrderByArg(parseAndVisit(graphqlSource));
    const orderBy = parseOrderBy(orderByArg, 'TimeSheet', 'TimeSheet', infoMap);

    expect(orderBy.isSuccess).toEqual(false);
    expect(unwrappedError(orderBy)).toEqual([message(expectedError)]);
}

describe('order by filter parser', () => {
    describe('expected errors', () => {
        it('results in an error when an unknown nulls enum is found', () => {
            const source = `{TimeSheetNumber: {nulls: foo}}`;

            return testExpectedError(source, 'Unknown nulls enum foo.');
        });

        it('results in an error when an non-enum nulls arg is found', () => {
            const source = `{TimeSheetNumber: {nulls: 1}}`;

            return testExpectedError(source, 'OrderBy nulls field must be an enum.');
        });

        it('results in an error when an unknown order enum is found', () => {
            const source = `{TimeSheetNumber: {order: foo}}`;

            return testExpectedError(source, 'Unknown order enum foo.');
        });

        it('results in an error when an non-enum order arg is found', () => {
            const source = `{TimeSheetNumber: {order: 1}}`;

            return testExpectedError(source, 'OrderBy order field must be an enum.');
        });

        it('results in an error when an unknown field is found', () => {
            const source = `{UnknownField: {order: ASC}}`;

            return testExpectedError(source, 'Field UnknownField for type TimeSheet not found.');
        });

        it('results in an error when orderBy node is not an object', () => {
            const source = `{UnknownField: "ooops"}`;

            return testExpectedError(source, 'OrderBy node must be an object.');
        });
    });

    it('returns empty array if no order by is sent', () => {
        const result = operatorResult(undefined);
        expect(result).toEqual([]);
    });

    describe('spanning order by', () => {
        it('has join alias or predicates', () => {
            const expected: RootQuery = {
                type: 'root',
                connections: [
                    {
                        alias: 'TimeSheet',
                        apiName: 'TimeSheet',
                        fields: [
                            {
                                type: FieldType.Scalar,
                                path: 'node.Id',
                                extract: {
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.id',
                                    type: ValueType.Extract,
                                },
                            },
                            {
                                type: FieldType.Scalar,
                                path: 'node._drafts',
                                extract: {
                                    type: ValueType.Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.drafts',
                                },
                            },
                            {
                                type: FieldType.Scalar,
                                path: 'node._metadata',
                                extract: {
                                    jsonAlias: 'TimeSheet',
                                    path: 'metadata',
                                    type: ValueType.Extract,
                                },
                            },
                        ],
                        first: undefined,
                        joinNames: ['TimeSheet.CreatedBy'],
                        orderBy: [
                            {
                                asc: true,
                                nullsFirst: false,
                                extract: {
                                    type: ValueType.Extract,
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'data.fields.Email.value',
                                },
                            },
                        ],
                        predicate: {
                            type: PredicateType.compound,
                            operator: CompoundOperator.and,
                            children: [
                                {
                                    type: PredicateType.comparison,
                                    operator: ComparisonOperator.eq,
                                    left: {
                                        type: ValueType.Extract,
                                        jsonAlias: 'TimeSheet',
                                        path: 'data.fields.CreatedById.value',
                                    },
                                    right: {
                                        type: ValueType.Extract,
                                        jsonAlias: 'TimeSheet.CreatedBy',
                                        path: 'data.id',
                                    },
                                },
                                {
                                    type: PredicateType.comparison,
                                    operator: ComparisonOperator.eq,
                                    left: {
                                        type: ValueType.Extract,
                                        jsonAlias: 'TimeSheet.CreatedBy',
                                        path: 'data.apiName',
                                    },
                                    right: {
                                        type: ValueType.StringLiteral,
                                        value: 'User',
                                        safe: true,
                                        isCaseSensitive: true,
                                    },
                                },
                                {
                                    type: PredicateType.comparison,
                                    operator: ComparisonOperator.eq,
                                    left: {
                                        type: ValueType.Extract,
                                        jsonAlias: 'TimeSheet',
                                        path: 'data.apiName',
                                    },
                                    right: {
                                        type: ValueType.StringLiteral,
                                        value: 'TimeSheet',
                                        safe: true,
                                        isCaseSensitive: true,
                                    },
                                },
                            ],
                        },
                    },
                ],
            };

            const source = `{CreatedBy: {Email: {order: ASC, nulls: LAST}}}`;
            const graphqlSource = makeOrderByGraphQL(source);

            const result = transform(parseAndVisit(graphqlSource), {
                userId: 'MyId',
                objectInfoMap: infoMap,
            });

            expect(unwrappedValue(result)).toEqual(expected);
        });
    });

    describe('self order by', () => {
        it('has no join alias or predicates', () => {
            const source = `{TimeSheetNumber: {order: ASC}}`;

            const result = operatorResult(source);
            expect(result[0].joinNames).toEqual([]);
            expect(result[0].joinPredicates).toEqual([]);
        });

        it('no order value results in ASC true', () => {
            const source = `{TimeSheetNumber:{}}`;

            const result = operatorResult(source);
            expect(result[0].orderBy.asc).toEqual(true);
        });

        it('asc results in ASC true', () => {
            const source = `{TimeSheetNumber:{order: ASC}}`;

            const result = operatorResult(source);
            expect(result[0].orderBy.asc).toEqual(true);
        });

        it('desc results in ASC false', () => {
            const source = `{TimeSheetNumber:{order: DESC}}`;

            const result = operatorResult(source);
            expect(result[0].orderBy.asc).toEqual(false);
        });

        it('no nulls value results in false', () => {
            const source = `{TimeSheetNumber:{}}`;

            const result = operatorResult(source);
            expect(result[0].orderBy.nullsFirst).toEqual(false);
        });

        it('nulls FIRST returns true', () => {
            const source = `{TimeSheetNumber:{nulls: FIRST}}`;

            const result = operatorResult(source);
            expect(result[0].orderBy.nullsFirst).toEqual(true);
        });

        it('nulls LAST returns false', () => {
            const source = `{TimeSheetNumber:{nulls: LAST}}`;

            const result = operatorResult(source);
            expect(result[0].orderBy.nullsFirst).toEqual(false);
        });
    });
});
