import { factory as updateLayoutUserState } from '../index';

const MASTER_RECORD_TYPE_ID = '012000000000000AAA';

describe('validation', () => {
    it.each([undefined, null])(
        'throws an error when required param recordTypeId is %s',
        (recordTypeId) => {
            expect(() => {
                updateLayoutUserState({} as any)('Account', recordTypeId, 'Full', 'View', {});
            }).toThrow('@wire(updateLayoutUserState) invalid configuration');
        }
    );

    it.each([
        ['null', null],
        ['an empty string', ''],
        ['an invalid value', 'invalid'],
    ])('throws an error if recordType is %s', (_type: any, recordType: any) => {
        expect(() => {
            updateLayoutUserState({} as any)(
                'Account',
                MASTER_RECORD_TYPE_ID,
                recordType,
                'View',
                {}
            );
        }).toThrow('@wire(updateLayoutUserState) invalid configuration');
    });

    it.each([
        ['null', null],
        ['an empty string', ''],
        ['an invalid value', 'invalid'],
    ])('throws an error if mode is %s', (_type: any, mode: any) => {
        expect(() => {
            updateLayoutUserState({} as any)('Account', MASTER_RECORD_TYPE_ID, 'Full', mode, {});
        }).toThrow('@wire(updateLayoutUserState) invalid configuration');
    });

    it('calls dispatchResourceRequest on valid input', async () => {
        const mockData = {
            sectionUserStates: {
                '01Bxx000002C2sTEAS': {
                    collapsed: true,
                },
            },
        };
        const mockLds = {
            dispatchResourceRequest: jest.fn().mockReturnValue({ then: () => {} }),
            storeLookup: jest.fn().mockReturnValue({ state: 'Fulfilled', data: mockData }),
            applyCachePolicy: jest.fn().mockReturnValue({ state: 'Fulfilled', data: mockData }),
            storeIngest: jest.fn(),
            storeBroadcast: jest.fn(),
        };
        await updateLayoutUserState(mockLds as any)(
            'Opportunity',
            MASTER_RECORD_TYPE_ID,
            'Full',
            'View',
            mockData
        );
        expect(mockLds.dispatchResourceRequest.mock.calls.length).toBe(1);
    });
});
