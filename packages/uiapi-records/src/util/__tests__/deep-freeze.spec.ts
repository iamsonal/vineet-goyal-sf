import { deepFreeze } from '../deep-freeze';

describe('deep freeze', () => {
    it('should throw when mutating top level property', () => {
        const value = {
            foo: 'foo',
            bar: 'bar',
            baz: {
                nested: 'string',
                null: null,
            },
        };

        deepFreeze(value);

        expect(() => {
            value.foo = 'changed';
        }).toThrow("Cannot assign to read only property 'foo' of object '#<Object>'");
    });

    it('should throw when mutating nested property', () => {
        const value = {
            foo: 'foo',
            bar: 'bar',
            baz: {
                nested: 'string',
                null: null,
            },
        };

        deepFreeze(value);
        expect(() => {
            value.baz.nested = 'changed';
        }).toThrow("Cannot assign to read only property 'nested' of object '#<Object>'");
    });

    it('should throw when mutating a null property', () => {
        const value = {
            foo: 'foo',
            bar: 'bar',
            baz: {
                nested: 'string',
                null: null,
            },
        };

        deepFreeze(value);
        expect(() => {
            (value.baz.null as any) = 'changed';
        }).toThrow("Cannot assign to read only property 'null' of object '#<Object>'");
    });

    it('should throw when pushing to array', () => {
        const value = {
            array: [
                {
                    string: 'string',
                    number: 0,
                    nullable: null,
                },
            ],
        };

        deepFreeze(value);
        expect(() => {
            value.array.push({
                string: 'string',
                number: 0,
                nullable: null,
            });
        }).toThrow('Cannot add property 1, object is not extensible');
    });

    it('should throw when mutating string property on array', () => {
        const value = {
            array: [
                {
                    string: 'string',
                    number: 0,
                    nullable: null,
                },
            ],
        };
        deepFreeze(value);
        expect(() => {
            value.array[0].string = 'changed';
        }).toThrow("Cannot assign to read only property 'string' of object '#<Object>'");
    });

    it('should throw when mutating number property on array', () => {
        const value = {
            array: [
                {
                    string: 'string',
                    number: 0,
                    nullable: null,
                },
            ],
        };
        deepFreeze(value);
        expect(() => {
            value.array[0].number = 1;
        }).toThrow("Cannot assign to read only property 'number' of object '#<Object>'");
    });

    it('should throw when mutating null property on array', () => {
        const value = {
            array: [
                {
                    string: 'string',
                    number: 0,
                    nullable: null,
                },
            ],
        };
        deepFreeze(value);
        expect(() => {
            (value.array[0].nullable as any) = 'foo';
        }).toThrow("Cannot assign to read only property 'nullable' of object '#<Object>'");
    });
});
