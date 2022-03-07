import { karmaNetworkAdapter } from 'lds-engine';
import { getMock as globalGetMock, setupElement, updateElement } from 'test-util';
import {
    mockGetRulesNetworkOnce,
    mockGetRulesNetworkErrorOnce,
    mockGetRulesNetworkSequence,
    expireFlowBuilderCaches,
} from 'platform-flow-builder-test-util';
import GetRules from '../lwc/get-rules';

const MOCK_PREFIX = 'wire/getRules/__karma__/data/';
const allRulesNoTriggerTypeNoRecordTriggerTypeConfig = {
    flowTriggerType: 'None',
    recordTriggerType: 'None',
};

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets rules for given parameteres', async () => {
        const mock = getMock('allRulesNoTriggerTypeNoRecordTriggerType');
        mockGetRulesNetworkOnce(allRulesNoTriggerTypeNoRecordTriggerTypeConfig, mock);

        const el = await setupElement(allRulesNoTriggerTypeNoRecordTriggerTypeConfig, GetRules);

        expect(el.pushCount()).toBe(1);
        expect(el.getData()).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock('allRulesNoTriggerTypeNoRecordTriggerType');
        mockGetRulesNetworkOnce(allRulesNoTriggerTypeNoRecordTriggerTypeConfig, mock);

        const el = await setupElement(allRulesNoTriggerTypeNoRecordTriggerTypeConfig, GetRules);
        expect(el.pushCount()).toBe(1);
        expect(el.getData()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(allRulesNoTriggerTypeNoRecordTriggerTypeConfig, GetRules);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getData()).toEqual(mock);

        await updateElement(el2, allRulesNoTriggerTypeNoRecordTriggerTypeConfig);
        expect(el2.getData()).toEqual(mock);
        expect(karmaNetworkAdapter.callCount).toBe(1);
    });

    it('makes two network calls for multiple wire function invocations with different parameters', async () => {
        const mock = getMock('allRulesNoTriggerTypeNoRecordTriggerType');
        const mock2 = getMock('allRulesScheduledTriggerTypeUpdateRecordTriggerType');
        const config2 = { flowTriggerType: 'Scheduled', recordTriggerType: 'Update' };
        mockGetRulesNetworkOnce(allRulesNoTriggerTypeNoRecordTriggerTypeConfig, mock);
        mockGetRulesNetworkOnce(config2, mock2);

        const el = await setupElement(allRulesNoTriggerTypeNoRecordTriggerTypeConfig, GetRules);
        expect(el.pushCount()).toBe(1);
        expect(el.getData()).toEqual(mock);

        await updateElement(el, config2);
        expect(el.pushCount()).toBe(2);
        expect(el.getData()).toEqual(mock2);
        expect(karmaNetworkAdapter.callCount).toBe(2);
    });

    it('displays error when network request returns 404s', async () => {
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
        mockGetRulesNetworkErrorOnce(allRulesNoTriggerTypeNoRecordTriggerTypeConfig, mock);

        const el = await setupElement(allRulesNoTriggerTypeNoRecordTriggerTypeConfig, GetRules);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });

    it('should refetch the rules when ingested properties error TTLs out', async () => {
        const mock = getMock('allRulesNoTriggerTypeNoRecordTriggerType');
        const mock2 = getMock('allRulesScheduledTriggerTypeUpdateRecordTriggerType');

        mockGetRulesNetworkSequence(allRulesNoTriggerTypeNoRecordTriggerTypeConfig, [mock, mock2]);

        const el1 = await setupElement(allRulesNoTriggerTypeNoRecordTriggerTypeConfig, GetRules);
        expect(el1.getData()).toEqual(mock);

        expireFlowBuilderCaches();

        const el2 = await setupElement(allRulesNoTriggerTypeNoRecordTriggerTypeConfig, GetRules);
        expect(el2.getData()).toEqual(mock2);
    });
});
