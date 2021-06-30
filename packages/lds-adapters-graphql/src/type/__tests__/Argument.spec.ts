import { LuvioArgumentNode } from '@salesforce/lds-graphql-parser';
import { serialize, render } from '../Argument';

describe('Arguments', () => {
    describe('serialize', () => {
        it('should return correct string when one argument present', () => {
            const args: LuvioArgumentNode[] = [
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
            ];

            expect(serialize(args)).toBe('where:{Name:{like:"Account1"}}');
        });

        it('should return correct string when multiple arguments present', () => {
            const args: LuvioArgumentNode[] = [
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

            expect(serialize(args)).toBe(
                'where:{Id:{eq:"001RM00000558MmYAI"},Name:{like:"Account%"}}'
            );
        });

        describe('ListValue', () => {
            it('should serialize ListValue correctly', () => {
                const listValue: LuvioArgumentNode[] = [
                    {
                        name: 'foo',
                        kind: 'Argument',
                        value: {
                            kind: 'ListValue',
                            values: [
                                {
                                    kind: 'StringValue',
                                    value: 'a',
                                },
                                {
                                    kind: 'StringValue',
                                    value: 'b',
                                },
                            ],
                        },
                    },
                ];

                expect(serialize(listValue)).toBe('foo:["a","b"]');
            });

            it('should serialize and sort ListValue correctly', () => {
                const listValue: LuvioArgumentNode[] = [
                    {
                        name: 'foo',
                        kind: 'Argument',
                        value: {
                            kind: 'ListValue',
                            values: [
                                {
                                    kind: 'StringValue',
                                    value: 'b',
                                },
                                {
                                    kind: 'StringValue',
                                    value: 'a',
                                },
                            ],
                        },
                    },
                ];

                expect(render(listValue, {})).toBe('foo:["a","b"]');
            });
        });
    });

    describe('render', () => {
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

            expect(render(args, {})).toBe(
                'orderBy:{Name:{order:DESC}},where:{Id:{eq:"001RM00000558MmYAI"},Name:{like:"Account%"}}'
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
            expect(render(args, {})).toBe(
                'orderBy:{Name:{order:ASC}},where:{Name:{like:"Account2"},Owner:{Name:{like:"Admin User"}}}'
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

            expect(render(args, {})).toBe(
                'first:10,orderBy:{CreatedDate:{order:DESC},Name:{order:ASC}},scope:EVERYTHING,where:{Name:{like:"Account%"},Owner:{LastModifiedBy:{CreatedBy:{Name:{like:"Admin User"}},Name:{like:"Admin User"}},Name:{like:"Admin User"}}}'
            );
        });

        it('should serialize and sort complex deeply nested arguments correctly', () => {
            const arg: LuvioArgumentNode[] = [
                {
                    kind: 'Argument',
                    name: 'orderBy',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            AppointmentNumber: {
                                kind: 'ObjectValue',
                                fields: {
                                    order: {
                                        kind: 'EnumValue',
                                        value: 'ASC',
                                    },
                                    nulls: {
                                        kind: 'EnumValue',
                                        value: 'FIRST',
                                    },
                                },
                            },
                            Id: {
                                kind: 'ObjectValue',
                                fields: {
                                    order: {
                                        kind: 'EnumValue',
                                        value: 'ASC',
                                    },
                                    nulls: {
                                        kind: 'EnumValue',
                                        value: 'FIRST',
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
                        value: '1000',
                    },
                },
                {
                    kind: 'Argument',
                    name: 'where',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            SchedStartTime: {
                                kind: 'ObjectValue',
                                fields: {
                                    gte: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            range: {
                                                kind: 'ObjectValue',
                                                fields: {
                                                    last_n_months: {
                                                        kind: 'IntValue',
                                                        value: '4',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            and: {
                                kind: 'ObjectValue',
                                fields: {
                                    SchedEndTime: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            lte: {
                                                kind: 'ObjectValue',
                                                fields: {
                                                    range: {
                                                        kind: 'ObjectValue',
                                                        fields: {
                                                            next_n_months: {
                                                                kind: 'IntValue',
                                                                value: '4',
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ];

            expect(render(arg, {})).toBe(
                'first:1000,orderBy:{AppointmentNumber:{nulls:FIRST,order:ASC},Id:{nulls:FIRST,order:ASC}},where:{SchedStartTime:{gte:{range:{last_n_months:4}}},and:{SchedEndTime:{lte:{range:{next_n_months:4}}}}}'
            );
        });

        it('should serialize multiple nested arguments', () => {
            const arg: LuvioArgumentNode[] = [
                {
                    kind: 'Argument',
                    name: 'orderBy',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            AppointmentNumber: {
                                kind: 'ObjectValue',
                                fields: {
                                    order: {
                                        kind: 'EnumValue',
                                        value: 'ASC',
                                    },
                                    nulls: {
                                        kind: 'EnumValue',
                                        value: 'FIRST',
                                    },
                                },
                            },
                        },
                    },
                },
            ];

            expect(render(arg, {})).toBe('orderBy:{AppointmentNumber:{nulls:FIRST,order:ASC}}');
        });

        it('should serialize and sort deeply nested enum arguments correctly', () => {
            const args: LuvioArgumentNode[] = [
                {
                    kind: 'Argument',
                    name: 'orderBy',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            AppointmentNumber: {
                                kind: 'ObjectValue',
                                fields: {
                                    order: {
                                        kind: 'EnumValue',
                                        value: 'ASC',
                                    },
                                    nulls: {
                                        kind: 'EnumValue',
                                        value: 'FIRST',
                                    },
                                },
                            },
                            Id: {
                                kind: 'ObjectValue',
                                fields: {
                                    order: {
                                        kind: 'EnumValue',
                                        value: 'ASC',
                                    },
                                    nulls: {
                                        kind: 'EnumValue',
                                        value: 'FIRST',
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
                        value: '1000',
                    },
                },
                {
                    kind: 'Argument',
                    name: 'where',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            SchedStartTime: {
                                kind: 'ObjectValue',
                                fields: {
                                    gte: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            range: {
                                                kind: 'ObjectValue',
                                                fields: {
                                                    last_n_months: {
                                                        kind: 'IntValue',
                                                        value: '4',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            and: {
                                kind: 'ObjectValue',
                                fields: {
                                    SchedEndTime: {
                                        kind: 'ObjectValue',
                                        fields: {
                                            lte: {
                                                kind: 'ObjectValue',
                                                fields: {
                                                    range: {
                                                        kind: 'ObjectValue',
                                                        fields: {
                                                            next_n_months: {
                                                                kind: 'IntValue',
                                                                value: '4',
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ];

            expect(render(args, {})).toBe(
                'first:1000,orderBy:{AppointmentNumber:{nulls:FIRST,order:ASC},Id:{nulls:FIRST,order:ASC}},where:{SchedStartTime:{gte:{range:{last_n_months:4}}},and:{SchedEndTime:{lte:{range:{next_n_months:4}}}}}'
            );
        });

        it('should return same serialization string when arguments are the same but out of order', () => {
            const sel1: LuvioArgumentNode[] = [
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
                        value: '1',
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

            const sel2: LuvioArgumentNode[] = [
                {
                    kind: 'Argument',
                    name: 'orderBy',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            CreatedDate: {
                                kind: 'ObjectValue',
                                fields: {
                                    order: {
                                        kind: 'EnumValue',
                                        value: 'DESC',
                                    },
                                },
                            },
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
                {
                    kind: 'Argument',
                    name: 'first',
                    value: {
                        kind: 'IntValue',
                        value: '1',
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
                        },
                    },
                },
            ];

            expect(render(sel1, {})).toEqual(render(sel2, {}));
        });

        it('should render scalar variables in arguments correctly', () => {
            const args: LuvioArgumentNode[] = [
                {
                    kind: 'Argument',
                    name: 'where',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            IsDeleted: {
                                kind: 'ObjectValue',
                                fields: {
                                    eq: {
                                        kind: 'Variable',
                                        name: 'IsDeleted',
                                    },
                                },
                            },
                        },
                    },
                },
            ];

            expect(render(args, { IsDeleted: false })).toBe('where:{IsDeleted:{eq:false}}');
        });

        it('should render string variables in arguments correctly', () => {
            const args: LuvioArgumentNode[] = [
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
                                        kind: 'Variable',
                                        name: 'accountName',
                                    },
                                },
                            },
                        },
                    },
                },
            ];

            expect(render(args, { accountName: 'Account1' })).toBe(
                'where:{Name:{like:"Account1"}}'
            );
        });

        it('should render list variables in arguments correctly', () => {
            const args: LuvioArgumentNode[] = [
                {
                    kind: 'Argument',
                    name: 'where',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            Id: {
                                kind: 'ObjectValue',
                                fields: {
                                    in: {
                                        kind: 'Variable',
                                        name: 'Id',
                                    },
                                },
                            },
                        },
                    },
                },
            ];

            expect(render(args, { Id: ['001RM000004uuhtYAA', '001RM000004uuhsYAA'] })).toBe(
                'where:{Id:{in:["001RM000004uuhsYAA","001RM000004uuhtYAA"]}}'
            );
        });

        it('should render object variables in arguments correctly', () => {
            const args: LuvioArgumentNode[] = [
                {
                    kind: 'Argument',
                    name: 'where',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            IsDeleted: {
                                kind: 'Variable',
                                name: 'IsDeleted',
                            },
                        },
                    },
                },
            ];

            expect(render(args, { IsDeleted: { eq: false } })).toBe('where:{IsDeleted:{eq:false}}');
        });

        it('should render object variables in arguments correctly and sort the values', () => {
            const args: LuvioArgumentNode[] = [
                {
                    kind: 'Argument',
                    name: 'orderBy',
                    value: {
                        kind: 'ObjectValue',
                        fields: {
                            Id: {
                                kind: 'Variable',
                                name: 'clause',
                            },
                        },
                    },
                },
            ];

            expect(render(args, { clause: { order: 'ASC', nulls: 'FIRST' } })).toBe(
                'orderBy:{Id:{nulls:"FIRST",order:"ASC"}}'
            );
        });
    });
});
