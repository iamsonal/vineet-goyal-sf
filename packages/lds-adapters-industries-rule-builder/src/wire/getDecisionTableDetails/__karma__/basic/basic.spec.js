import GetDecisionTableDetails from '../lwc/get-decision-table-details';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetDecisionTableDetailsNetworkOnce,
    mockDecisionTableDetailsNetworkErrorOnce,
} from 'industries-rule-builder-test-util';

const MOCK_PREFIX = 'wire/getDecisionTableDetails/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic decisionTableDetails', async () => {
        const mock = getMock('decisionTableDetails');
        const config = { id: '00xx1234abcd123' };
        mockGetDecisionTableDetailsNetworkOnce(config, mock);
        const el = await setupElement(config, GetDecisionTableDetails);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredDecisionTableDetails())).toEqual(mock);
    });

    it('do not fetch DecisionTableDetails second time', async () => {
        const mock = getMock('decisionTableDetails');
        const config = { id: '00xx1234abcd123' };
        mockGetDecisionTableDetailsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDecisionTableDetails);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredDecisionTableDetails())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetDecisionTableDetails);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredDecisionTableDetails())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { id: '00xx1234abcd123' };
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
        mockDecisionTableDetailsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDecisionTableDetails);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
