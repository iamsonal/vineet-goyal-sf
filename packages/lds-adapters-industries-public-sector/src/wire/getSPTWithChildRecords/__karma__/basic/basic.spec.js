import SptWithChildRecords from '../lwc/spt-with-child-records';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetSPTWithChildRecordsNetworkOnce,
    mockGetSPTWithChildRecordsNetworkErrorOnce,
} from 'industries-public-sector-test-util';
const MOCK_PREFIX = 'wire/getSPTWithChildRecords/__karma__/data/';
const MOCK_SPT_WITH_CHILD_RECORDS_JSON = 'getSPTWithChildRecords';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}
describe('basic', () => {
    it('fetches results for service plan template successfully using a valid configuration', async () => {
        const mock = getMock(MOCK_SPT_WITH_CHILD_RECORDS_JSON);
        const config = {
            servicePlanTemplateId: '1stS70000004C93IAE',
        };
        mockGetSPTWithChildRecordsNetworkOnce(config, mock);
        const el = await setupElement(config, SptWithChildRecords);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredSPTWithChildRecords())).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock(MOCK_SPT_WITH_CHILD_RECORDS_JSON);
        const config = {
            servicePlanTemplateId: '1stS70000004C93IAE',
        };

        // Mock network request once only
        mockGetSPTWithChildRecordsNetworkOnce(config, mock);

        const el = await setupElement(config, SptWithChildRecords);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredSPTWithChildRecords()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(config, SptWithChildRecords);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredSPTWithChildRecords()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = {
            servicePlanTemplateId: '1stS70000004C93IAE',
        };
        const mock = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        mockGetSPTWithChildRecordsNetworkErrorOnce(config, mock);
        const el = await setupElement(config, SptWithChildRecords);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
