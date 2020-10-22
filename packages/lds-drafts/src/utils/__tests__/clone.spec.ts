import { clone } from '../clone';

describe('clone', () => {
    it('clones an object that is mutable', () => {
        const frozen = { field: 'test' };
        Object.freeze(frozen);

        const cloned = clone(frozen);

        expect(cloned).toStrictEqual(frozen);

        cloned.field = 'changed';
        expect(cloned).toStrictEqual({
            field: 'changed',
        });
    });
});
