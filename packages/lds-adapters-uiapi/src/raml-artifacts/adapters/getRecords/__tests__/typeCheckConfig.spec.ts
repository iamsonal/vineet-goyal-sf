import { coerceConfig, typeCheckConfig, coerceRecordId18Array } from '../typeCheckConfig';

describe('coerceRecordId18Array', () => {
    it('should return undefined for invalid input', () => {
        expect(coerceRecordId18Array('invalid')).toBe(undefined);
    });

    it('should return array when passed single valid record 18', () => {
        expect(coerceRecordId18Array('005B0000003g6BCIAY')).toEqual(['005B0000003g6BCIAY']);
    });

    it('should return array when passed an array of valid record 18s', () => {
        expect(coerceRecordId18Array(['005B0000003g6BCIAY'])).toEqual(['005B0000003g6BCIAY']);
    });

    it('should return array in the same order when passed an array of multiple valid record 18s', () => {
        expect(coerceRecordId18Array(['006T1000001rBK9IAM', '005B0000003g6BCIAY'])).toEqual([
            '006T1000001rBK9IAM',
            '005B0000003g6BCIAY',
        ]);
    });

    it('should return array when passed an array of single valid record 15s', () => {
        expect(coerceRecordId18Array(['005B0000003g6BC'])).toEqual(['005B0000003g6BCIAY']);
    });

    it('should return array when passed an array of multiple valid record 15s', () => {
        expect(coerceRecordId18Array(['005B0000003g6BC', '006T1000001rBK9'])).toEqual([
            '005B0000003g6BCIAY',
            '006T1000001rBK9IAM',
        ]);
    });

    it('should return undefined if a single item in the array is invalid', () => {
        expect(coerceRecordId18Array(['005B0000003g6BC', 'invalid'])).toBe(undefined);
    });

    it('should auto-dedupe the array', () => {
        expect(coerceRecordId18Array(['005B0000003g6BCIAY', '005B0000003g6BCIAY'])).toEqual([
            '005B0000003g6BCIAY',
        ]);
    });

    it('should auto-dedupe record15 array', () => {
        expect(coerceRecordId18Array(['005B0000003g6BC', '005B0000003g6BC'])).toEqual([
            '005B0000003g6BCIAY',
        ]);
    });

    it('should return undefined when passed empty array', () => {
        expect(coerceRecordId18Array([])).toEqual(undefined);
    });
});

describe('coerceConfig', () => {
    const mockRecordIds18 = ['001xx000003Gn4VAAS', '001xx000003Gn4WAAS'];
    const mockRecordIds15 = mockRecordIds18.map(elem => elem.slice(0, 15));
    const ACCOUNT_ID_FIELD_STRING = 'Account.Id';
    const ACCOUNT_NAME_FIELD_STRING = 'Account.Name';

    it('handles empty records config', () => {
        expect(coerceConfig({ records: [] })).toEqual({ records: [] });
    });

    it('coercion for reorordIds & fields', () => {
        expect(
            coerceConfig({
                records: [
                    {
                        recordIds: mockRecordIds15,
                        fields: [ACCOUNT_NAME_FIELD_STRING, ACCOUNT_ID_FIELD_STRING],
                    },
                ],
            })
        ).toEqual({
            records: [
                {
                    recordIds: mockRecordIds18,
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        });
    });

    it('coercion for recordIds & optionalFields', () => {
        expect(
            coerceConfig({
                records: [
                    {
                        recordIds: mockRecordIds15,
                        optionalFields: [ACCOUNT_NAME_FIELD_STRING, ACCOUNT_ID_FIELD_STRING],
                    },
                ],
            })
        ).toEqual({
            records: [
                {
                    recordIds: mockRecordIds18,
                    optionalFields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        });
    });
});

describe('typeCheckConfig', () => {
    const mockRecordIds18 = ['001xx000003Gn4VAAS', '001xx000003Gn4WAAS'];
    const ACCOUNT_ID_FIELD_STRING = 'Account.Id';

    describe('returns empty config object when', () => {
        it('untrusted config does not have records as an array', () => {
            expect(typeCheckConfig({ records: [] })).toEqual({});
        });

        it('the untrustedIsObject check', () => {
            expect(typeCheckConfig({ records: [null] })).toEqual({});
        });

        it('any of the singular getRecord_validateAdapterConfig check fails', () => {
            expect(
                typeCheckConfig({
                    records: [
                        {
                            recordIds: [undefined],
                            fields: [ACCOUNT_ID_FIELD_STRING],
                        },
                    ],
                })
            ).toEqual({});
        });
    });

    it('skips the invalid configs (due to invalid recordIds) and returns the records array with only valid configs', () => {
        expect(
            typeCheckConfig({
                records: [
                    {
                        recordIds: mockRecordIds18,
                        fields: [ACCOUNT_ID_FIELD_STRING],
                    },
                    {
                        recordIds: null,
                        fields: [ACCOUNT_ID_FIELD_STRING],
                    },
                ],
            })
        ).toEqual({
            records: [
                {
                    recordIds: mockRecordIds18,
                    fields: [ACCOUNT_ID_FIELD_STRING],
                },
            ],
        });
    });

    it('skips the invalid configs (due to missing fields and optional fields) and returns the records array with only valid configs', () => {
        expect(
            typeCheckConfig({
                records: [
                    {
                        recordIds: mockRecordIds18,
                        fields: [ACCOUNT_ID_FIELD_STRING],
                    },
                    {
                        recordIds: mockRecordIds18,
                        fields: undefined, // TS Checks will not let me miss this key
                    },
                ],
            })
        ).toEqual({
            records: [
                {
                    recordIds: mockRecordIds18,
                    fields: [ACCOUNT_ID_FIELD_STRING],
                },
            ],
        });
    });

    it('returns the correct config when type check passes', () => {
        expect(
            typeCheckConfig({
                records: [
                    {
                        recordIds: mockRecordIds18,
                        fields: [ACCOUNT_ID_FIELD_STRING],
                    },
                ],
            })
        ).toEqual({
            records: [
                {
                    recordIds: mockRecordIds18,
                    fields: [ACCOUNT_ID_FIELD_STRING],
                },
            ],
        });
    });
});
