import GetFeaturedItemsRelatedList from '../lwc/get-featured-items-related-list';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockGetRelatedListNetwork,
    mockGetRelatedListNetworkErrorOnce,
} from 'platform-learning-content-test-util';

const MOCK_PREFIX = 'wire/getFeaturedItemsRelatedList/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets basic related list', async () => {
        const mock = getMock('get-related-list');
        const appId = 'test_app_id';
        const pageRef = JSON.stringify({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'LearningItem',
                actionName: 'home',
            },
            state: {
                one__moduleId: 'moduleId',
            },
        });
        const config = { appId, pageRef };
        mockGetRelatedListNetwork(config, mock);

        const el = await setupElement(config, GetFeaturedItemsRelatedList);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredRelatedList())).toEqual(mock);
    });

    it('does not fetch second time', async () => {
        const mock = getMock('get-related-list');
        const appId = 'test_app_id';
        const pageRef = JSON.stringify({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'LearningItem',
                actionName: 'home',
            },
            state: {
                one__moduleId: 'moduleId',
            },
        });
        const config = { appId, pageRef };
        mockGetRelatedListNetwork(config, mock);

        const el = await setupElement(config, GetFeaturedItemsRelatedList);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredRelatedList())).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetFeaturedItemsRelatedList);
        expect(el2.pushCount()).toBe(1);
        expect(clone(el2.getWiredRelatedList())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const appId = 'test_app_id';
        const pageRef = JSON.stringify({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'LearningItem',
                actionName: 'home',
            },
            state: {
                one__moduleId: 'moduleId',
            },
        });
        const config = { appId, pageRef };

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
        mockGetRelatedListNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetFeaturedItemsRelatedList);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getError())).toEqual(mock);
    });
});
