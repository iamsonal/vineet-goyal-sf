import { factory as updateRecord } from '../index';

describe('validation', () => {
    it('returns rejected promise for undefined recordInput', async () => {
        expect(() => {
            updateRecord({} as any)(undefined as any);
        }).toThrow('Invalid recordInput');
    });

    it('returns rejected promise for unspecified fields.Id', async () => {
        expect(() => {
            updateRecord({} as any)({
                fields: {
                    Name: 'Name',
                },
            } as any);
        }).toThrow('Invalid recordInput');
    });

    it('returns rejected promise for invalid .fields.Id', async () => {
        expect(() => {
            updateRecord({} as any)({
                fields: {
                    Name: 'Name',
                    Id: 'Invalid',
                },
            } as any);
        }).toThrow('Invalid recordInput');
    });
});
