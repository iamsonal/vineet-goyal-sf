import GetFeaturedItemsRecommendedList from '../lwc/get-featured-items-recommended-list';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetRecommendedListNetwork,
    mockGetRecommendedListNetworkErrorOnce,
} from 'platform-learning-content-test-util';

const MOCK_PREFIX = 'wire/getFeaturedItemsRecommendedList/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic recommended list', async () => {
        const mock = getMock('get-recommended-list');
        const appId = 'test_app_id';
        const config = { appId };
        mockGetRecommendedListNetwork(config, mock);

        const el = await setupElement(config, GetFeaturedItemsRecommendedList);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredRecommendedList())).toEqual(mock);
    });

    it('does not fetch second time', async () => {
        const mock = getMock('get-recommended-list');
        const appId = 'test_app_id';
        const config = { appId };
        mockGetRecommendedListNetwork(config, mock);

        const el = await setupElement(config, GetFeaturedItemsRecommendedList);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredRecommendedList())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetFeaturedItemsRecommendedList);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredRecommendedList())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const appId = 'test_app_id';
        const config = { appId };

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
        mockGetRecommendedListNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetFeaturedItemsRecommendedList);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
