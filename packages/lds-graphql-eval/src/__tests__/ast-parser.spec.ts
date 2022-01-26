import { transform } from '../ast-parser';
import { parseAndVisit } from '@luvio/graphql-parser';
import infoJson from './mockData/objectInfos.json';
import { Failure, unwrappedError, unwrappedValue } from '../Result';
import { ObjectInfoMap } from '../info-types';
import {
    FieldType,
    ComparisonOperator,
    PredicateType,
    RootQuery,
    CompoundOperator,
    ValueType,
} from '../Predicate';
import { message, PredicateError, MessageError } from '../Error';

const objectInfoMap = infoJson as unknown as ObjectInfoMap;
const Extract = ValueType.Extract;

describe('ast-parser', () => {
    describe('MINE scope', () => {
        it('results in correct predicate', () => {
            const source = /* GraphQL */ `
                query {
                    uiapi {
                        query {
                            TimeSheet(scope: MINE) @connection {
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

            const expected: RootQuery = {
                type: 'root',
                connections: [
                    {
                        alias: 'TimeSheet',
                        apiName: 'TimeSheet',
                        first: undefined,
                        orderBy: [],
                        joinNames: [],

                        fields: [
                            {
                                type: FieldType.Scalar,
                                path: 'node.TimeSheetNumber.value',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.fields.TimeSheetNumber.value',
                                },
                            },
                            {
                                type: FieldType.Scalar,
                                path: 'node._drafts',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.drafts',
                                },
                            },
                            {
                                type: FieldType.Scalar,
                                path: 'node.Id',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.id',
                                },
                            },
                            {
                                type: FieldType.Scalar,
                                path: 'node._metadata',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'metadata',
                                },
                            },
                        ],
                        predicate: {
                            type: PredicateType.compound,
                            operator: CompoundOperator.and,
                            children: [
                                {
                                    type: PredicateType.comparison,
                                    left: {
                                        type: Extract,
                                        jsonAlias: 'TimeSheet',
                                        path: 'data.fields.OwnerId.value',
                                    },
                                    operator: ComparisonOperator.eq,
                                    right: {
                                        type: ValueType.StringLiteral,
                                        value: 'MyId',
                                    },
                                },
                                {
                                    type: PredicateType.comparison,
                                    operator: ComparisonOperator.eq,
                                    left: {
                                        type: Extract,
                                        jsonAlias: 'TimeSheet',
                                        path: 'data.apiName',
                                    },
                                    right: {
                                        type: ValueType.StringLiteral,
                                        value: 'TimeSheet',
                                    },
                                },
                            ],
                        },
                    },
                ],
            };

            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedValue(result)).toEqual(expected);
        });

        it('results in an error if Record type does not have an OwnerId field', () => {
            const source = /* GraphQL */ `
                query {
                    uiapi {
                        query {
                            TimeSheetEntry(scope: MINE) @connection {
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

            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedError(result)).toEqual([
                message('Scope MINE requires the entity type to have an OwnerId field.'),
            ]);
        });
    });

    describe('Scope errors', () => {
        it('scope will result an error if non enum value is used', () => {
            const source = /* GraphQL */ `
                query {
                    uiapi {
                        query {
                            TimeSheetEntry(scope: { notAnEnum: "at all" }) @connection {
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

            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedError(result)).toEqual([
                message('Scope type should be an EnumValueNode.'),
            ]);
        });

        it('unknown scope results in an error', () => {
            const source = /* GraphQL */ `
                query {
                    uiapi {
                        query {
                            TimeSheetEntry(scope: UNKNOWN) @connection {
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

            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedError(result)).toEqual([message("Scope 'UNKNOWN is not supported.")]);
        });
    });

    describe('Id tests', () => {
        it('uses id field for edge values', () => {
            const source = /* GraphQL */ `
                query {
                    uiapi {
                        query {
                            TimeSheet @connection {
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

            const expected: RootQuery = {
                type: 'root',
                connections: [
                    {
                        alias: 'TimeSheet',
                        apiName: 'TimeSheet',
                        first: undefined,
                        orderBy: [],
                        joinNames: [],

                        fields: [
                            {
                                type: FieldType.Scalar,
                                path: 'node.Id',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.id',
                                },
                            },
                            {
                                type: FieldType.Scalar,
                                path: 'node._drafts',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.drafts',
                                },
                            },
                            {
                                type: FieldType.Scalar,
                                path: 'node._metadata',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'metadata',
                                },
                            },
                        ],
                        predicate: {
                            type: PredicateType.comparison,
                            operator: ComparisonOperator.eq,
                            left: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.apiName',
                            },
                            right: {
                                type: ValueType.StringLiteral,
                                value: 'TimeSheet',
                            },
                        },
                    },
                ],
            };

            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedValue(result)).toEqual(expected);
        });
    });

    it('transforms GraphQL operation into a custom AST', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet @connection {
                            edges {
                                node @resource(type: "Record") {
                                    TimeSheetNumber {
                                        value
                                        displayValue
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected: RootQuery = {
            type: 'root',
            connections: [
                {
                    alias: 'TimeSheet',
                    apiName: 'TimeSheet',
                    first: undefined,
                    orderBy: [],
                    joinNames: [],

                    fields: [
                        {
                            type: FieldType.Scalar,
                            path: 'node.TimeSheetNumber.value',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.fields.TimeSheetNumber.value',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.TimeSheetNumber.displayValue',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.fields.TimeSheetNumber.displayValue',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._drafts',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.drafts',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.Id',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.id',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._metadata',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'metadata',
                            },
                        },
                    ],
                    predicate: {
                        type: PredicateType.comparison,
                        operator: ComparisonOperator.eq,
                        left: {
                            type: Extract,
                            jsonAlias: 'TimeSheet',
                            path: 'data.apiName',
                        },
                        right: {
                            type: ValueType.StringLiteral,
                            value: 'TimeSheet',
                        },
                    },
                },
            ],
        };

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toEqual(expected);
    });

    it('transforms GraphQL query with multiple fields', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet @connection {
                            edges {
                                node @resource(type: "Record") {
                                    TimeSheetNumber {
                                        value
                                        displayValue
                                    }

                                    OwnerId {
                                        value
                                        displayValue
                                    }

                                    IsDeleted {
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected: RootQuery = {
            type: 'root',
            connections: [
                {
                    alias: 'TimeSheet',
                    apiName: 'TimeSheet',
                    first: undefined,
                    orderBy: [],
                    joinNames: [],

                    fields: [
                        {
                            type: FieldType.Scalar,
                            path: 'node.TimeSheetNumber.value',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.fields.TimeSheetNumber.value',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.TimeSheetNumber.displayValue',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.fields.TimeSheetNumber.displayValue',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.OwnerId.value',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.fields.OwnerId.value',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.OwnerId.displayValue',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.fields.OwnerId.displayValue',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.IsDeleted.value',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.fields.IsDeleted.value',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._drafts',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.drafts',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.Id',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.id',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._metadata',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'metadata',
                            },
                        },
                    ],
                    predicate: {
                        type: PredicateType.comparison,
                        operator: ComparisonOperator.eq,
                        left: {
                            type: Extract,
                            jsonAlias: 'TimeSheet',
                            path: 'data.apiName',
                        },
                        right: {
                            type: ValueType.StringLiteral,
                            value: 'TimeSheet',
                        },
                    },
                },
            ],
        };

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toEqual(expected);
    });

    it('transforms spanning record GraphQL operation', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet @connection {
                            edges {
                                node @resource(type: "Record") {
                                    CreatedBy {
                                        Email {
                                            value
                                            displayValue
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected: RootQuery = {
            type: 'root',
            connections: [
                {
                    alias: 'TimeSheet',
                    apiName: 'TimeSheet',
                    first: undefined,
                    orderBy: [],
                    joinNames: ['TimeSheet.CreatedBy'],

                    fields: [
                        {
                            type: FieldType.Scalar,
                            path: 'node.CreatedBy.Email.value',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet.CreatedBy',
                                path: 'data.fields.Email.value',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.CreatedBy.Email.displayValue',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet.CreatedBy',
                                path: 'data.fields.Email.displayValue',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._drafts',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.drafts',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.Id',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.id',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._metadata',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'metadata',
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
                                    type: Extract,
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'data.apiName',
                                },
                                right: {
                                    type: ValueType.StringLiteral,
                                    value: 'User',
                                },
                            },
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.fields.CreatedById.value',
                                },
                                right: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'data.id',
                                },
                            },
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.apiName',
                                },
                                right: {
                                    type: ValueType.StringLiteral,
                                    value: 'TimeSheet',
                                },
                            },
                        ],
                    },
                },
            ],
        };

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toEqual(expected);
    });

    it('transforms GraphQL query with multiple root record types each having spanning fields', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet @connection {
                            edges {
                                node @resource(type: "Record") {
                                    CreatedBy {
                                        Email {
                                            value
                                            displayValue
                                        }
                                    }
                                }
                            }
                        }

                        User @connection {
                            edges {
                                node @resource(type: "Record") {
                                    CreatedBy {
                                        Email {
                                            value
                                            displayValue
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected: RootQuery = {
            type: 'root',
            connections: [
                {
                    alias: 'TimeSheet',
                    apiName: 'TimeSheet',
                    first: undefined,
                    orderBy: [],
                    joinNames: ['TimeSheet.CreatedBy'],

                    fields: [
                        {
                            type: FieldType.Scalar,
                            path: 'node.CreatedBy.Email.value',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet.CreatedBy',
                                path: 'data.fields.Email.value',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.CreatedBy.Email.displayValue',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet.CreatedBy',
                                path: 'data.fields.Email.displayValue',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._drafts',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.drafts',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.Id',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.id',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._metadata',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'metadata',
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
                                    type: Extract,
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'data.apiName',
                                },
                                right: {
                                    type: ValueType.StringLiteral,
                                    value: 'User',
                                },
                            },
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.fields.CreatedById.value',
                                },
                                right: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'data.id',
                                },
                            },
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.apiName',
                                },
                                right: {
                                    type: ValueType.StringLiteral,
                                    value: 'TimeSheet',
                                },
                            },
                        ],
                    },
                },
                {
                    alias: 'User',
                    apiName: 'User',
                    first: undefined,
                    orderBy: [],

                    joinNames: ['User.CreatedBy'],

                    fields: [
                        {
                            type: FieldType.Scalar,
                            path: 'node.CreatedBy.Email.value',
                            extract: {
                                type: Extract,
                                jsonAlias: 'User.CreatedBy',
                                path: 'data.fields.Email.value',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.CreatedBy.Email.displayValue',
                            extract: {
                                type: Extract,
                                jsonAlias: 'User.CreatedBy',
                                path: 'data.fields.Email.displayValue',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._drafts',
                            extract: {
                                type: Extract,
                                jsonAlias: 'User',
                                path: 'data.drafts',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.Id',
                            extract: {
                                type: Extract,
                                jsonAlias: 'User',
                                path: 'data.id',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._metadata',
                            extract: {
                                type: Extract,
                                jsonAlias: 'User',
                                path: 'metadata',
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
                                    type: Extract,
                                    jsonAlias: 'User.CreatedBy',
                                    path: 'data.apiName',
                                },
                                right: {
                                    type: ValueType.StringLiteral,
                                    value: 'User',
                                },
                            },
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: {
                                    type: Extract,
                                    jsonAlias: 'User',
                                    path: 'data.fields.CreatedById.value',
                                },
                                right: {
                                    type: Extract,
                                    jsonAlias: 'User.CreatedBy',
                                    path: 'data.id',
                                },
                            },
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: {
                                    type: Extract,
                                    jsonAlias: 'User',
                                    path: 'data.apiName',
                                },
                                right: {
                                    type: ValueType.StringLiteral,
                                    value: 'User',
                                },
                            },
                        ],
                    },
                },
            ],
        };

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toEqual(expected);
    });

    it('transforms GraphQL operation with draft', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet @connection {
                            edges {
                                node @resource(type: "Record") {
                                    TimeSheetNumber {
                                        value
                                        displayValue
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected: RootQuery = {
            type: 'root',
            connections: [
                {
                    alias: 'TimeSheet',
                    apiName: 'TimeSheet',
                    first: undefined,
                    orderBy: [],
                    joinNames: [],

                    fields: [
                        {
                            type: FieldType.Scalar,
                            path: 'node.TimeSheetNumber.value',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.fields.TimeSheetNumber.value',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.TimeSheetNumber.displayValue',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.fields.TimeSheetNumber.displayValue',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._drafts',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.drafts',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.Id',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.id',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._metadata',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'metadata',
                            },
                        },
                    ],
                    predicate: {
                        type: PredicateType.comparison,
                        operator: ComparisonOperator.eq,
                        left: {
                            type: Extract,
                            jsonAlias: 'TimeSheet',
                            path: 'data.apiName',
                        },
                        right: {
                            type: ValueType.StringLiteral,
                            value: 'TimeSheet',
                        },
                    },
                },
            ],
        };

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toEqual(expected);
    });

    it('transforms child record GraphQL operation', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet @connection {
                            edges {
                                node @resource(type: "Record") {
                                    TimeSheetEntries @connection {
                                        edges {
                                            node @resource(type: "Record") {
                                                Id
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const expected: RootQuery = {
            type: 'root',
            connections: [
                {
                    alias: 'TimeSheet',
                    apiName: 'TimeSheet',
                    first: undefined,
                    orderBy: [],

                    joinNames: [],
                    fields: [
                        {
                            type: FieldType.Child,
                            path: 'node.TimeSheetEntries.edges',
                            connection: {
                                alias: 'TimeSheet.TimeSheetEntries',
                                apiName: 'TimeSheetEntry',
                                first: undefined,
                                orderBy: [],

                                joinNames: [],
                                fields: [
                                    {
                                        type: FieldType.Scalar,
                                        path: 'node.Id',
                                        extract: {
                                            type: Extract,
                                            jsonAlias: 'TimeSheet.TimeSheetEntries',
                                            path: 'data.id',
                                        },
                                    },
                                    {
                                        type: FieldType.Scalar,
                                        path: 'node._drafts',
                                        extract: {
                                            type: Extract,
                                            jsonAlias: 'TimeSheet.TimeSheetEntries',
                                            path: 'data.drafts',
                                        },
                                    },
                                    {
                                        type: FieldType.Scalar,
                                        path: 'node._metadata',
                                        extract: {
                                            type: Extract,
                                            jsonAlias: 'TimeSheet.TimeSheetEntries',
                                            path: 'metadata',
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
                                                jsonAlias: 'TimeSheet.TimeSheetEntries',
                                                path: 'data.apiName',
                                                type: Extract,
                                            },
                                            right: {
                                                type: ValueType.StringLiteral,
                                                value: 'TimeSheetEntry',
                                            },
                                        },
                                        {
                                            type: PredicateType.comparison,
                                            operator: ComparisonOperator.eq,
                                            left: {
                                                type: Extract,
                                                path: 'data.fields.TimeSheetId.value',
                                                jsonAlias: 'TimeSheet.TimeSheetEntries',
                                            },
                                            right: {
                                                type: Extract,
                                                path: 'data.id',
                                                jsonAlias: 'TimeSheet',
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._drafts',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.drafts',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.Id',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.id',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._metadata',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'metadata',
                            },
                        },
                    ],
                    predicate: {
                        type: PredicateType.comparison,
                        operator: ComparisonOperator.eq,
                        left: {
                            jsonAlias: 'TimeSheet',
                            path: 'data.apiName',
                            type: Extract,
                        },
                        right: {
                            type: ValueType.StringLiteral,
                            value: 'TimeSheet',
                        },
                    },
                },
            ],
        };

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toEqual(expected);
    });

    it('errors for unsupported datatypes', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        ServiceResource(where: { ResourceType: { eq: "T" } }) @connection {
                            edges {
                                node @resource(type: "Record") {
                                    ResourceType {
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const fakeObjectInfo = Object.assign({}, objectInfoMap) as any;
        fakeObjectInfo.ServiceResource.fields.ResourceType.dataType = 'SomeUnsupportedType';

        const result = transform(parseAndVisit(source), {
            userId: 'MyId',
            objectInfoMap: fakeObjectInfo,
        }) as Failure<RootQuery, PredicateError[]>;
        expect(result.isSuccess).toEqual(false);
        const { message } = result.error[0] as MessageError;
        expect(message).toEqual(
            'Comparison operator eq is not supported for type SomeUnsupportedType.'
        );
    });

    it('where argument join information is reflected in connection', () => {
        const source = /* GraphQL */ `
            query {
                uiapi {
                    query {
                        TimeSheet(where: { CreatedBy: { CreatedBy: { Email: { eq: "xyz" } } } })
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

        const expected: RootQuery = {
            type: 'root',
            connections: [
                {
                    alias: 'TimeSheet',
                    apiName: 'TimeSheet',
                    first: undefined,
                    orderBy: [],

                    joinNames: ['TimeSheet.CreatedBy.CreatedBy', 'TimeSheet.CreatedBy'],

                    fields: [
                        {
                            type: FieldType.Scalar,
                            path: 'node.TimeSheetNumber.value',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.fields.TimeSheetNumber.value',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._drafts',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.drafts',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node.Id',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.id',
                            },
                        },
                        {
                            type: FieldType.Scalar,
                            path: 'node._metadata',
                            extract: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'metadata',
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
                                    type: Extract,
                                    jsonAlias: 'TimeSheet.CreatedBy.CreatedBy',
                                    path: 'data.fields.Email.value',
                                },
                                right: {
                                    type: ValueType.StringLiteral,
                                    value: 'xyz',
                                },
                            },
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'data.fields.CreatedById.value',
                                },
                                right: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet.CreatedBy.CreatedBy',
                                    path: 'data.id',
                                },
                            },
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet.CreatedBy.CreatedBy',
                                    path: 'data.apiName',
                                },
                                right: {
                                    type: ValueType.StringLiteral,
                                    value: 'User',
                                },
                            },
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.fields.CreatedById.value',
                                },
                                right: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'data.id',
                                },
                            },

                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'data.apiName',
                                },
                                right: {
                                    type: ValueType.StringLiteral,
                                    value: 'User',
                                },
                            },
                            {
                                type: PredicateType.comparison,
                                operator: ComparisonOperator.eq,
                                left: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.apiName',
                                },
                                right: {
                                    type: ValueType.StringLiteral,
                                    value: 'TimeSheet',
                                },
                            },
                        ],
                    },
                },
            ],
        };

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toEqual(expected);
    });

    describe('first arg', () => {
        it('returns an error for wrong type', () => {
            const source = /* GraphQL */ `
                query {
                    uiapi {
                        query {
                            TimeSheet(first: true) @connection {
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

            const expected = [message('first type should be an IntValue.')];
            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedError(result)).toEqual(expected);
        });

        it('includes first arg in connection', () => {
            const source = /* GraphQL */ `
                query {
                    uiapi {
                        query {
                            TimeSheet(first: 43) @connection {
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

            const expected: RootQuery = {
                type: 'root',
                connections: [
                    {
                        alias: 'TimeSheet',
                        apiName: 'TimeSheet',
                        first: 43,
                        orderBy: [],
                        joinNames: [],

                        fields: [
                            {
                                type: FieldType.Scalar,
                                path: 'node.Id',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.id',
                                },
                            },
                            {
                                type: FieldType.Scalar,
                                path: 'node._drafts',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'data.drafts',
                                },
                            },
                            {
                                type: FieldType.Scalar,
                                path: 'node._metadata',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'TimeSheet',
                                    path: 'metadata',
                                },
                            },
                        ],
                        predicate: {
                            type: PredicateType.comparison,
                            operator: ComparisonOperator.eq,
                            left: {
                                type: Extract,
                                jsonAlias: 'TimeSheet',
                                path: 'data.apiName',
                            },
                            right: {
                                type: ValueType.StringLiteral,
                                value: 'TimeSheet',
                            },
                        },
                    },
                ],
            };

            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedValue(result)).toEqual(expected);
        });
    });

    describe('ASSIGNEDTOME scope', () => {
        it('results in correct predicate', () => {
            const source = /* GraphQL */ `
                query {
                    uiapi {
                        query {
                            ServiceAppointment(scope: ASSIGNEDTOME) @connection {
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

            const expected: RootQuery = {
                type: 'root',
                connections: [
                    {
                        alias: 'ServiceAppointment',
                        apiName: 'ServiceAppointment',
                        first: undefined,
                        orderBy: [],
                        joinNames: [],

                        fields: [
                            {
                                type: FieldType.Scalar,
                                path: 'node.Id',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'ServiceAppointment',
                                    path: 'data.id',
                                },
                            },
                            {
                                type: FieldType.Scalar,
                                path: 'node._drafts',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'ServiceAppointment',
                                    path: 'data.drafts',
                                },
                            },
                            {
                                type: FieldType.Scalar,
                                path: 'node._metadata',
                                extract: {
                                    type: Extract,
                                    jsonAlias: 'ServiceAppointment',
                                    path: 'metadata',
                                },
                            },
                        ],
                        predicate: {
                            type: PredicateType.compound,
                            operator: CompoundOperator.and,
                            children: [
                                {
                                    type: PredicateType.exists,
                                    alias: 'AssignedResource',
                                    joinNames: ['ServiceResource'],
                                    predicate: {
                                        children: [
                                            {
                                                left: {
                                                    jsonAlias: 'AssignedResource',
                                                    path: 'data.fields.ServiceResourceId.value',
                                                    type: ValueType.Extract,
                                                },
                                                operator: ComparisonOperator.eq,
                                                right: {
                                                    jsonAlias: 'ServiceResource',
                                                    path: 'data.id',
                                                    type: ValueType.Extract,
                                                },
                                                type: PredicateType.comparison,
                                            },
                                            {
                                                left: {
                                                    jsonAlias: 'AssignedResource',
                                                    path: 'data.fields.ServiceAppointmentId.value',
                                                    type: ValueType.Extract,
                                                },
                                                operator: ComparisonOperator.eq,
                                                right: {
                                                    jsonAlias: 'ServiceAppointment',
                                                    path: 'data.id',
                                                    type: ValueType.Extract,
                                                },
                                                type: PredicateType.comparison,
                                            },
                                            {
                                                left: {
                                                    jsonAlias: 'ServiceResource',
                                                    path: 'data.fields.RelatedRecordId.value',
                                                    type: ValueType.Extract,
                                                },
                                                operator: ComparisonOperator.eq,
                                                right: {
                                                    type: ValueType.StringLiteral,
                                                    value: 'MyId',
                                                },
                                                type: PredicateType.comparison,
                                            },
                                            {
                                                left: {
                                                    jsonAlias: 'AssignedResource',
                                                    path: 'data.apiName',
                                                    type: ValueType.Extract,
                                                },
                                                operator: ComparisonOperator.eq,
                                                right: {
                                                    type: ValueType.StringLiteral,
                                                    value: 'AssignedResource',
                                                },
                                                type: PredicateType.comparison,
                                            },
                                            {
                                                left: {
                                                    jsonAlias: 'ServiceResource',
                                                    path: 'data.apiName',
                                                    type: ValueType.Extract,
                                                },
                                                operator: ComparisonOperator.eq,
                                                right: {
                                                    type: ValueType.StringLiteral,
                                                    value: 'ServiceResource',
                                                },
                                                type: PredicateType.comparison,
                                            },
                                        ],
                                        operator: CompoundOperator.and,
                                        type: PredicateType.compound,
                                    },
                                },
                                {
                                    type: PredicateType.comparison,
                                    operator: ComparisonOperator.eq,
                                    left: {
                                        type: Extract,
                                        jsonAlias: 'ServiceAppointment',
                                        path: 'data.apiName',
                                    },
                                    right: {
                                        type: ValueType.StringLiteral,
                                        value: 'ServiceAppointment',
                                    },
                                },
                            ],
                        },
                    },
                ],
            };

            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedValue(result)).toEqual(expected);
        });

        it('results in an error if Record type is not ServiceAppointment', () => {
            const source = /* GraphQL */ `
                query {
                    uiapi {
                        query {
                            TimeSheetEntry(scope: ASSIGNEDTOME) @connection {
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

            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedError(result)).toEqual([
                message('ASSIGNEDTOME can only be used with ServiceAppointment'),
            ]);
        });
    });
});
