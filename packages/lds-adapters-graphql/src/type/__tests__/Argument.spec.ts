import { LuvioArgumentNode } from '@salesforce/lds-graphql-parser';
import { serialize, serializeAndSortArguments } from '../Argument';

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
                'where:{Id:{eq:"001RM00000558MmYAI"}},{Name:{like:"Account%"}}'
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

            expect(serializeAndSortArguments(args)).toBe(
                'orderBy:{Name:{order:DESC}},where:{Id:{eq:"001RM00000558MmYAI"}},{Name:{like:"Account%"}}'
            );
        });
        it('should serialize multiple arguments and sort them correctly', () => {
            const args: LuvioArgumentNode[] = [
                {
                    kind: 'Argument',
                    name: 'where',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            Owner: {
                                kind: 'ObjectValue',
                                fields: {
                                    Name: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            like: {
                                                kind: 'StringValue',
                                                value: 'Admin User',
                                            },
                                        },
                                    },
                                },
                            },
                            Name: {
                                kind: 'ObjectValue',
                                fields: {
                                    like: {
                                        kind: 'StringValue',
                                        value: 'Account2',
                                    },
                                },
                            },
                        },
                    },
                },
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
                                        value: 'ASC',
                                    },
                                },
                            },
                        },
                    },
                },
            ];
            expect(serializeAndSortArguments(args)).toBe(
                'orderBy:{Name:{order:ASC}},where:{Name:{like:"Account2"}},{Owner:{Name:{like:"Admin User"}}}'
            );
        });

        it('should serialize and sort deeply nested arguments correctly', () => {
            const args: LuvioArgumentNode[] = [
                {
                    kind: 'Argument',
                    name: 'where',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            Owner: {
                                kind: 'ObjectValue',
                                fields: {
                                    Name: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            like: {
                                                kind: 'StringValue',
                                                value: 'Admin User',
                                            },
                                        },
                                    },
                                    LastModifiedBy: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            Name: {
                                                kind: 'ObjectValue',
                                                fields: {
                                                    like: {
                                                        kind: 'StringValue',
                                                        value: 'Admin User',
                                                    },
                                                },
                                            },
                                            CreatedBy: {
                                                kind: 'ObjectValue',
                                                fields: {
                                                    Name: {
                                                        kind: 'ObjectValue',
                                                        fields: {
                                                            like: {
                                                                kind: 'StringValue',
                                                                value: 'Admin User',
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            Name: {
                                kind: 'ObjectValue',
                                fields: {
                                    like: {
                                        kind: 'StringValue',
                                        value: 'Account%',
                                    },
                                },
                            },
                        },
                    },
                },
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
                                        value: 'ASC',
                                    },
                                },
                            },
                            CreatedDate: {
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
                    name: 'first',
                    value: {
                        kind: 'IntValue',
                        value: '10',
                    },
                },
                {
                    kind: 'Argument',
                    name: 'scope',
                    value: {
                        kind: 'EnumValue',
                        value: 'EVERYTHING',
                    },
                },
            ];

            expect(serializeAndSortArguments(args)).toBe(
                'first:10,orderBy:{CreatedDate:{order:DESC}},{Name:{order:ASC}},scope:EVERYTHING,where:{Name:{like:"Account%"}},{Owner:{LastModifiedBy:{CreatedBy:{Name:{like:"Admin User"}}},{Name:{like:"Admin User"}}},{Name:{like:"Admin User"}}}'
            );
        });
    });
});
