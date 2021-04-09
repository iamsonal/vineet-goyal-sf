import { LuvioArgumentNode } from '@salesforce/lds-graphql-parser';
import { serialize, serializeArguments } from '../Argument';

describe('Arguments', () => {
    describe('serialize', () => {
        it('should return correct string when one argument present', () => {
            const args: LuvioArgumentNode = {
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
            };

            expect(serialize(args)).toBe('where:{Name:{like:"Account1"}}');
        });

        it('should return correct string when multiple arguments present', () => {
            const args: LuvioArgumentNode = {
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
                                    value: 'Account%',
                                },
                            },
                        },
                        Id: {
                            kind: 'ObjectValue',
                            fields: {
                                eq: {
                                    kind: 'StringValue',
                                    value: '001RM00000558MmYAI',
                                },
                            },
                        },
                    },
                },
            };

            expect(serialize(args)).toBe(
                'where:{Name:{like:"Account%"}},{Id:{eq:"001RM00000558MmYAI"}}'
            );
        });
    });

    describe('serialize arguments', () => {
        it('should serialize multiple arguments correctly', () => {
            const args: LuvioArgumentNode[] = [
                {
                    kind: 'Argument',
                    name: 'orderBy',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            Name: {
                                kind: 'ObjectValue',
                                fields: {
                                    order: {
                                        kind: 'EnumValue',
                                        value: 'DESC',
                                    },
                                },
                            },
                        },
                    },
                },
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
                                        value: 'Account%',
                                    },
                                },
                            },
                            Id: {
                                kind: 'ObjectValue',
                                fields: {
                                    eq: {
                                        kind: 'StringValue',
                                        value: '001RM00000558MmYAI',
                                    },
                                },
                            },
                        },
                    },
                },
            ];

            expect(serializeArguments(args)).toBe(
                'orderBy:{Name:{order:DESC}},where:{Name:{like:"Account%"}},{Id:{eq:"001RM00000558MmYAI"}}'
            );
        });
    });
});
