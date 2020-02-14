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

    it('calls dispatchResourceRequest on valid input', async () => {
        const mockLds = {
            dispatchResourceRequest: jest.fn().mockReturnValue({ then: () => {} }),
        };
        await updateRecord(mockLds as any)({
            fields: {
                Name: 'Name',
                Id: '123456789012345678',
            },
        } as any);
        expect(mockLds.dispatchResourceRequest.mock.calls.length).toBe(1);
    });
});
