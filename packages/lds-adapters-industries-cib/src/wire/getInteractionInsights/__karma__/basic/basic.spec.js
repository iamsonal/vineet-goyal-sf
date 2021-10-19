import GetInteractionInsights from '../lwc/get-interaction-insights';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetInteractionInsightsNetworkOnce,
    mockGetInteractionInsightsNetworkErrorOnce,
} from 'industries-cib-test-util';

const MOCK_PREFIX = 'wire/getInteractionInsights/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic InteractionInsights', async () => {
        const mock = getMock('interaction-insights');
        const config = {
            accountId: '001xx000003GfH9AAK',
            systemContext: true,
            showACR: true,
            limit: 10,
            offset: 10,
            isDirectContacts: false,
        };
        mockGetInteractionInsightsNetworkOnce(config, mock);

        const el = await setupElement(config, GetInteractionInsights);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredInteractionInsights()).toEqual(mock);
    });

    it('do not fetch InteractionInsights second time', async () => {
        const mock = getMock('interaction-insights');
        const config = { accountId: '001xx000003GfH9AA1', systemContext: true };
        mockGetInteractionInsightsNetworkOnce(config, mock);

        const el = await setupElement(config, GetInteractionInsights);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredInteractionInsights()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetInteractionInsights);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredInteractionInsights()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { accountId: '001xx000003GfH9AA2', systemContext: true };
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
        mockGetInteractionInsightsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetInteractionInsights);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
