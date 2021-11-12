import { Environment, Luvio, Store } from '@luvio/engine';
import { LuvioSelectionObjectFieldNode } from '@salesforce/lds-graphql-parser';
import { createIngest } from '../ingest';
import timekeeper from 'timekeeper';

beforeEach(() => {
    timekeeper.reset();
});

describe('ingest', () => {
    describe('createIngest', () => {
        it('should properly ingest nodes with arguments', () => {
            timekeeper.freeze(100);
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'foo',
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'child',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'title',
                            },
                        ],
                        arguments: [
                            {
                                kind: 'Argument',
                                name: 'where',
                                value: {
                                    kind: 'ObjectValue',
                                    fields: {
                                        Name: {
                                            kind: 'ObjectValue',
                                            fields: {
                                                like: {
                                                    kind: 'StringValue',
                                                    value: 'Account1',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                ],
            };

            const data = {
                __typename: 'DataRepresentation',
                child: {
                    title: 'title',
                },
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(ast)(
                data,
                {
                    parent: null,
                    fullPath: 'toplevel',
                    propertyName: null,
                    state: { result: { type: 'success' } },
                },
                luvio,
                store,
                0
            );

            expect(store.records).toEqual({
                toplevel__child: {
                    title: 'title',
                },
                toplevel: {
                    __typename: 'DataRepresentation',
                    'child(where:{Name:{like:"Account1"}})': {
                        __ref: 'toplevel__child',
                    },
                },
            });

            expect(store.metadata).toMatchInlineSnapshot(`
                Object {
                  "toplevel": Object {
                    "expirationTimestamp": 30100,
                    "ingestionTimestamp": 100,
                    "namespace": "GraphQL",
                    "representationName": "DataRepresentation",
                  },
                }
            `);
        });
    });
});
