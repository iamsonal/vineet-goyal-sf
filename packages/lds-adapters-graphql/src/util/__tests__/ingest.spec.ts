import { Environment, Luvio, Store } from '@luvio/engine';
import { LuvioSelectionObjectFieldNode } from '@salesforce/lds-graphql-parser';
import { createIngest } from '../ingest';

describe('ingest', () => {
    describe('createIngest', () => {
        it('should properly ingest nodes with arguments', () => {
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
                    'child(where:{Name:{like:"Account1"}})': {
                        __ref: 'toplevel__child',
                    },
                },
            });
        });
    });
});
