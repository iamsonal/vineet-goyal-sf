import { GetRecordsConfig } from '../GetRecordsConfig';
import { getRecords_ConfigPropertyNames } from '../getRecords_ConfigPropertyNames';
import { validateAdapterConfig, validateFieldsObjectApiName } from '../validateAdapterConfig';

describe('validation', () => {
    const mockRecordIds18 = ['001xx000003Gn4VAAS', '001xx000003Gn4WAAS'];
    const ACCOUNT_ID_FIELD_STRING = 'Account.Id';
    const ACCOUNT_NAME_FIELD_STRING = 'Account.Name';
    const OPPORTUNITY_ID_FIELD_STRING = 'Opportunity.Id';

    describe('validateFieldsObjectApiName', () => {
        it('should throw if record type of fields and optional fields is not the same', () => {
            expect(() =>
                validateFieldsObjectApiName({
                    records: [
                        {
                            recordIds: mockRecordIds18,
                            fields: [ACCOUNT_ID_FIELD_STRING],
                            optionalFields: [OPPORTUNITY_ID_FIELD_STRING],
                        },
                    ],
                })
            ).toThrowError(
                'all specified fields and optional fields must be of same ObjectApiName as Account'
            );
        });

        it('should throw if all fields does not have the same record type', () => {
            expect(() =>
                validateFieldsObjectApiName({
                    records: [
                        {
                            recordIds: mockRecordIds18,
                            fields: [OPPORTUNITY_ID_FIELD_STRING, ACCOUNT_ID_FIELD_STRING],
                        },
                    ],
                })
            ).toThrowError(
                'all specified fields and optional fields must be of same ObjectApiName as Opportunity'
            );
        });
    });
    describe('validateAdapterConfig', () => {
        it('should return config if a valid config with fields is passed', () => {
            const config: GetRecordsConfig = {
                records: [
                    {
                        recordIds: mockRecordIds18,
                        fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                    },
                ],
            };
            expect(validateAdapterConfig(config, getRecords_ConfigPropertyNames)).toEqual(config);
        });

        it('should return config if a valid config with fields and optionalFields is passed', () => {
            const config: GetRecordsConfig = {
                records: [
                    {
                        recordIds: mockRecordIds18,
                        fields: [ACCOUNT_ID_FIELD_STRING],
                        optionalFields: [ACCOUNT_NAME_FIELD_STRING],
                    },
                ],
            };
            expect(validateAdapterConfig(config, getRecords_ConfigPropertyNames)).toEqual(config);
        });
    });
});
