import { ingestRecord } from 'lds-adapters-community-microbatching';
import { getMock as globalGetMock } from 'test-util';
import {
    mockIngestRecordNetworkOnce,
    mockIngestRecordInvalidCommunityIdNetworkErrorOnce,
} from 'community-microbatching-test-util';

const MOCK_PREFIX = 'wire/ingestRecord/__karma__/data/';
function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('ingest record', async () => {
        const mockResponse = getMock('record');
        const config = {
            communityId: '0DBR00000000lk0CAI',
            groupBy: '',
            keyPrefix: '00Q',
            processType: 'Lead_MC',
            requestBody: {
                Name: 'James Bond',
            },
        };
        mockIngestRecordNetworkOnce(config, mockResponse);
        const data = await ingestRecord(config);
        expect(data).toEqual(mockResponse);
    });

    it('displays error when network request 400s', async () => {
        const mock = {
            status: 400,
            ok: false,
            body: [
                {
                    errorCode: 'INVALID_ID_FIELD',
                    message: 'Specify a valid community ID',
                    dataExtensionId: '',
                },
            ],
        };

        const config = {
            communityId: 'not-valid-community-id',
            groupBy: '',
            keyPrefix: '00Q',
            processType: 'Lead_MC',
            requestBody: {
                Name: 'James Bond',
            },
        };
        mockIngestRecordInvalidCommunityIdNetworkErrorOnce(config, mock);

        try {
            await ingestRecord(config);
            // make sure we are hitting the catch
            fail('ingestRecord did not throw');
        } catch (e) {
            expect(e).toContainErrorBody(mock.body);
        }
    });
});
