import { transform } from '../ast-parser';
import * as parser from '@salesforce/lds-graphql-parser';
import infoJson from './mockData/objectInfos.json';
import { unwrappedError, unwrappedValue } from '../Result';
import { ObjectInfoMap } from '../info-types';
import { RootQuery } from '../Predicate';

const objectInfoMap = infoJson as ObjectInfoMap;

describe('ast-parser', () => {
    describe('MINE scope', () => {
        it('mine scope results in correct predicate', () => {
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
                        type: 'connection',
                        first: undefined,
                        joinNames: [],

                        fields: [
                            {
                                type: 'ScalarField',
                                path: 'TimeSheetNumber.value',
                                extract: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet',
                                    path: 'TimeSheetNumber.value',
                                },
                            },
                        ],
                        predicate: {
                            type: 'compound',
                            operator: 'and',
                            children: [
                                {
                                    type: 'comparison',
                                    left: {
                                        type: 'JsonExtract',
                                        jsonAlias: 'TimeSheet',
                                        path: 'OwnerId',
                                    },
                                    operator: 'eq',
                                    right: {
                                        type: 'StringLiteral',
                                        value: 'MyId',
                                    },
                                },
                                {
                                    type: 'comparison',
                                    operator: 'eq',
                                    left: {
                                        type: 'JsonExtract',
                                        jsonAlias: 'TimeSheet',
                                        path: 'apiName',
                                    },
                                    right: {
                                        type: 'StringLiteral',
                                        value: 'TimeSheet',
                                    },
                                },
                            ],
                        },
                    },
                ],
            };

            const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedValue(result)).toEqual(expected);
        });

        it('mine scope results in an error if Record type does not have an OwnerId field', () => {
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

            const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedError(result)).toEqual([
                'Scope MINE requires the entity type to have an OwnerId field.',
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

            const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedError(result)).toEqual(['Scope type should be an EnumValueNode.']);
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

            const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedError(result)).toEqual(["Scope 'UNKNOWN is not supported."]);
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
                    type: 'connection',
                    first: undefined,
                    joinNames: [],

                    fields: [
                        {
                            type: 'ScalarField',
                            path: 'TimeSheetNumber.value',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'TimeSheet',
                                path: 'TimeSheetNumber.value',
                            },
                        },
                        {
                            type: 'ScalarField',
                            path: 'TimeSheetNumber.displayValue',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'TimeSheet',
                                path: 'TimeSheetNumber.displayValue',
                            },
                        },
                    ],
                    predicate: {
                        type: 'comparison',
                        operator: 'eq',
                        left: {
                            type: 'JsonExtract',
                            jsonAlias: 'TimeSheet',
                            path: 'apiName',
                        },
                        right: {
                            type: 'StringLiteral',
                            value: 'TimeSheet',
                        },
                    },
                },
            ],
        };

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
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
                    type: 'connection',
                    first: undefined,
                    joinNames: [],

                    fields: [
                        {
                            type: 'ScalarField',
                            path: 'TimeSheetNumber.value',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'TimeSheet',
                                path: 'TimeSheetNumber.value',
                            },
                        },
                        {
                            type: 'ScalarField',
                            path: 'TimeSheetNumber.displayValue',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'TimeSheet',
                                path: 'TimeSheetNumber.displayValue',
                            },
                        },
                        {
                            type: 'ScalarField',
                            path: 'OwnerId.value',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'TimeSheet',
                                path: 'OwnerId.value',
                            },
                        },
                        {
                            type: 'ScalarField',
                            path: 'OwnerId.displayValue',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'TimeSheet',
                                path: 'OwnerId.displayValue',
                            },
                        },
                        {
                            type: 'ScalarField',
                            path: 'IsDeleted.value',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'TimeSheet',
                                path: 'IsDeleted.value',
                            },
                        },
                    ],
                    predicate: {
                        type: 'comparison',
                        operator: 'eq',
                        left: {
                            type: 'JsonExtract',
                            jsonAlias: 'TimeSheet',
                            path: 'apiName',
                        },
                        right: {
                            type: 'StringLiteral',
                            value: 'TimeSheet',
                        },
                    },
                },
            ],
        };

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
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
                    type: 'connection',
                    first: undefined,
                    joinNames: ['TimeSheet.CreatedBy'],

                    fields: [
                        {
                            type: 'ScalarField',
                            path: 'Email.value',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'TimeSheet.CreatedBy',
                                path: 'Email.value',
                            },
                        },
                        {
                            type: 'ScalarField',
                            path: 'Email.displayValue',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'TimeSheet.CreatedBy',
                                path: 'Email.displayValue',
                            },
                        },
                    ],
                    predicate: {
                        type: 'compound',
                        operator: 'and',
                        children: [
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'apiName',
                                },
                                right: {
                                    type: 'StringLiteral',
                                    value: 'User',
                                },
                            },
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet',
                                    path: 'CreatedById',
                                },
                                right: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'id',
                                },
                            },
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet',
                                    path: 'apiName',
                                },
                                right: {
                                    type: 'StringLiteral',
                                    value: 'TimeSheet',
                                },
                            },
                        ],
                    },
                },
            ],
        };

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
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
                    type: 'connection',
                    first: undefined,
                    joinNames: ['TimeSheet.CreatedBy'],

                    fields: [
                        {
                            type: 'ScalarField',
                            path: 'Email.value',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'TimeSheet.CreatedBy',
                                path: 'Email.value',
                            },
                        },
                        {
                            type: 'ScalarField',
                            path: 'Email.displayValue',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'TimeSheet.CreatedBy',
                                path: 'Email.displayValue',
                            },
                        },
                    ],
                    predicate: {
                        type: 'compound',
                        operator: 'and',
                        children: [
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'apiName',
                                },
                                right: {
                                    type: 'StringLiteral',
                                    value: 'User',
                                },
                            },
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet',
                                    path: 'CreatedById',
                                },
                                right: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'id',
                                },
                            },
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet',
                                    path: 'apiName',
                                },
                                right: {
                                    type: 'StringLiteral',
                                    value: 'TimeSheet',
                                },
                            },
                        ],
                    },
                },
                {
                    alias: 'User',
                    apiName: 'User',
                    type: 'connection',
                    first: undefined,
                    joinNames: ['User.CreatedBy'],

                    fields: [
                        {
                            type: 'ScalarField',
                            path: 'Email.value',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'User.CreatedBy',
                                path: 'Email.value',
                            },
                        },
                        {
                            type: 'ScalarField',
                            path: 'Email.displayValue',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'User.CreatedBy',
                                path: 'Email.displayValue',
                            },
                        },
                    ],
                    predicate: {
                        type: 'compound',
                        operator: 'and',
                        children: [
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'User.CreatedBy',
                                    path: 'apiName',
                                },
                                right: {
                                    type: 'StringLiteral',
                                    value: 'User',
                                },
                            },
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'User',
                                    path: 'CreatedById',
                                },
                                right: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'User.CreatedBy',
                                    path: 'id',
                                },
                            },
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'User',
                                    path: 'apiName',
                                },
                                right: {
                                    type: 'StringLiteral',
                                    value: 'User',
                                },
                            },
                        ],
                    },
                },
            ],
        };

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
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
                                                Id {
                                                    value
                                                }
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
                    type: 'connection',
                    first: undefined,
                    joinNames: [],
                    fields: [
                        {
                            type: 'ChildRecordField',
                            path: 'TimeSheetEntries.edges',
                            connection: {
                                alias: 'TimeSheet.TimeSheetEntries',
                                apiName: 'TimeSheetEntry',
                                type: 'connection',
                                first: undefined,
                                joinNames: [],
                                fields: [
                                    {
                                        type: 'ScalarField',
                                        path: 'Id.value',
                                        extract: {
                                            type: 'JsonExtract',
                                            jsonAlias: 'TimeSheet.TimeSheetEntries',
                                            path: 'Id.value',
                                        },
                                    },
                                ],
                                predicate: {
                                    type: 'compound',
                                    operator: 'and',
                                    children: [
                                        {
                                            type: 'comparison',
                                            operator: 'eq',
                                            left: {
                                                jsonAlias: 'TimeSheet.TimeSheetEntries',
                                                path: 'apiName',
                                                type: 'JsonExtract',
                                            },
                                            right: {
                                                type: 'StringLiteral',
                                                value: 'TimeSheetEntry',
                                            },
                                        },
                                        {
                                            type: 'comparison',
                                            operator: 'eq',
                                            left: {
                                                type: 'JsonExtract',
                                                path: 'TimeSheetId',
                                                jsonAlias: 'TimeSheet.TimeSheetEntries',
                                            },
                                            right: {
                                                type: 'JsonExtract',
                                                path: 'id',
                                                jsonAlias: 'TimeSheet',
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                    predicate: {
                        type: 'comparison',
                        operator: 'eq',
                        left: {
                            jsonAlias: 'TimeSheet',
                            path: 'apiName',
                            type: 'JsonExtract',
                        },
                        right: {
                            type: 'StringLiteral',
                            value: 'TimeSheet',
                        },
                    },
                },
            ],
        };

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toEqual(expected);
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
                    type: 'connection',
                    first: undefined,
                    joinNames: ['TimeSheet.CreatedBy.CreatedBy', 'TimeSheet.CreatedBy'],

                    fields: [
                        {
                            type: 'ScalarField',
                            path: 'TimeSheetNumber.value',
                            extract: {
                                type: 'JsonExtract',
                                jsonAlias: 'TimeSheet',
                                path: 'TimeSheetNumber.value',
                            },
                        },
                    ],
                    predicate: {
                        type: 'compound',
                        operator: 'and',
                        children: [
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet.CreatedBy.CreatedBy',
                                    path: 'Email',
                                },
                                right: {
                                    type: 'StringLiteral',
                                    value: 'xyz',
                                },
                            },
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'CreatedById',
                                },
                                right: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet.CreatedBy.CreatedBy',
                                    path: 'id',
                                },
                            },
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet.CreatedBy.CreatedBy',
                                    path: 'apiName',
                                },
                                right: {
                                    type: 'StringLiteral',
                                    value: 'User',
                                },
                            },
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet',
                                    path: 'CreatedById',
                                },
                                right: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'id',
                                },
                            },

                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet.CreatedBy',
                                    path: 'apiName',
                                },
                                right: {
                                    type: 'StringLiteral',
                                    value: 'User',
                                },
                            },
                            {
                                type: 'comparison',
                                operator: 'eq',
                                left: {
                                    type: 'JsonExtract',
                                    jsonAlias: 'TimeSheet',
                                    path: 'apiName',
                                },
                                right: {
                                    type: 'StringLiteral',
                                    value: 'TimeSheet',
                                },
                            },
                        ],
                    },
                },
            ],
        };

        const result = transform(parser.default(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toEqual(expected);
    });
});
