import {
    clone,
    mockGetTenantRegistrationStatusNetworkErrorOnce,
    mockGetTenantRegistrationStatusNetworkOnce,
} from 'industries-rcg-tenantmanagement-test-util';
//import { getTenantRegistrationStatus } from 'lds-adapters-industries-rcg-tenantmanagement';
import { getMock as globalGetMock, setupElement } from 'test-util';

import GetTenantRegStatus from '../lwc/get-tenant-registration-status';

const MOCK_INPUT_PREFIX = 'wire/tenantMgmt/__karma__/getTenantRegistrationStatus/data/';

function getInputMock(filename) {
    return globalGetMock(MOCK_INPUT_PREFIX + filename);
}

describe('tenantregistratorstatus test', () => {
    it('test positive case of getting tenant registration status', async () => {
        const outputMock = getInputMock('getTenantRegistrationStatusOutput');
        mockGetTenantRegistrationStatusNetworkOnce(outputMock);

        const el = await setupElement({}, GetTenantRegStatus);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredTenantRegistrationStatus()).toEqual(outputMock);
    });

    it('do not fetch tenant details second time', async () => {
        const mock = getInputMock('getTenantRegistrationStatusOutput');
        mockGetTenantRegistrationStatusNetworkOnce(mock);

        const el = await setupElement({}, GetTenantRegStatus);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredTenantRegistrationStatus())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement({}, GetTenantRegStatus);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredTenantRegistrationStatus())).toEqual(mock);
    });

    it('test getting tenant registration status error case', async () => {
        const config = {};
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
        mockGetTenantRegistrationStatusNetworkErrorOnce(mock);

        const el = await setupElement(config, GetTenantRegStatus);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
