import { transform } from '../ast-parser';
import { parseAndVisit } from '@luvio/graphql-parser';
import infoJson from './mockData/objectInfos.json';
import { Failure, unwrappedError, unwrappedValue } from '../Result';
import { ObjectInfoMap } from '../info-types';
import { RootQuery } from '../Predicate';
import { message, PredicateError, MessageError } from '../Error';

const objectInfoMap = infoJson as unknown as ObjectInfoMap;

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

            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedValue(result)).toMatchSnapshot();
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

            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedValue(result)).toMatchSnapshot();
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

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toMatchSnapshot();
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

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toMatchSnapshot();
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

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toMatchSnapshot();
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

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toMatchSnapshot();
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

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toMatchSnapshot();
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

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toMatchSnapshot();
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

        const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
        expect(unwrappedValue(result)).toMatchSnapshot();
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

            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedValue(result)).toMatchSnapshot();
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

            const result = transform(parseAndVisit(source), { userId: 'MyId', objectInfoMap });
            expect(unwrappedValue(result)).toMatchSnapshot();
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
