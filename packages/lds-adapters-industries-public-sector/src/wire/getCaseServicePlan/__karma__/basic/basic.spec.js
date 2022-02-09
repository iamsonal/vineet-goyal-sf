import GetCaseServicePlan from '../lwc/get-case-service-plan';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetCaseServicePlanNetworkOnce,
    mockGetCaseServicePlanNetworkErrorOnce,
    expireSearchData,
} from 'industries-public-sector-test-util';

const MOCK_PREFIX = 'wire/getCaseServicePlan/__karma__/data/';
const MOCK_GET_CASE_SEVICE_PLAN_EMPTY_JSON = 'getCaseServicePlanEmpty';
const MOCK_GET_CASE_SEVICE_PLAN_JSON = 'getCaseServicePlan';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches case service plan successfully using a valid configuration', async () => {
        const mock = getMock(MOCK_GET_CASE_SEVICE_PLAN_JSON);
        const config = {
            caseServicePlanId: '123456789123456789',
        };
        mockGetCaseServicePlanNetworkOnce(config, mock);
        const el = await setupElement(config, GetCaseServicePlan);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredCaseServicePlan())).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock(MOCK_GET_CASE_SEVICE_PLAN_JSON);
        const config = {
            caseServicePlanId: '123456789123456789',
        };

        // Mock network request once only
        mockGetCaseServicePlanNetworkOnce(config, mock);

        const el = await setupElement(config, GetCaseServicePlan);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredCaseServicePlan()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(config, GetCaseServicePlan);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredCaseServicePlan()).toEqual(mock);
    });

    it('makes two network calls when time elapsed > TTL', async () => {
        const mock = getMock(MOCK_GET_CASE_SEVICE_PLAN_JSON);
        const config = {
            caseServicePlanId: '123456789123456789',
        };
        mockGetCaseServicePlanNetworkOnce(config, [mock, mock]);

        const el1 = await setupElement(config, GetCaseServicePlan);

        expect(el1.pushCount()).toBe(1);
        expect(el1.getWiredCaseServicePlan()).toEqualSnapshotWithoutEtags(mock);

        expireSearchData();

        const el2 = await setupElement(config, GetCaseServicePlan);

        // el2 should not have received new value
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredCaseServicePlan()).toEqualSnapshotWithoutEtags(mock);
    });

    it('fetches search results successfully with no items', async () => {
        const mock = getMock(MOCK_GET_CASE_SEVICE_PLAN_EMPTY_JSON);
        const config = {
            caseServicePlanId: '123456789123456789',
        };
        mockGetCaseServicePlanNetworkOnce(config, mock);
        const el = await setupElement(config, GetCaseServicePlan);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredCaseServicePlan())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = {
            caseServicePlanId: '123456789123456789',
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
        mockGetCaseServicePlanNetworkErrorOnce(config, mock);
        const el = await setupElement(config, GetCaseServicePlan);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
