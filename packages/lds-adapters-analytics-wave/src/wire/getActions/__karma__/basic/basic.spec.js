import timekeeper from 'timekeeper';
import GetActions from '../lwc/get-actions';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetActionsNetworkOnce,
    mockGetActionsNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getActions/__karma__/data/';
const TTL = 300;

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets actions', async () => {
        const mock = getMock('actions');
        const config = {
            entityId: '001S7000002VrnHIAS',
        };
        mockGetActionsNetworkOnce(config, mock);

        const el = await setupElement(config, GetActions);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('actions');
        const config = {
            entityId: '001S7000002VrnHIAS',
        };
        mockGetActionsNetworkOnce(config, mock);

        const el = await setupElement(config, GetActions);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetActions);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mockError = getMock('error');
        const config = {
            entityId: '001S7000002VrnHIAS',
        };

        // mock server to return 404
        mockGetActionsNetworkErrorOnce(config, mockError);

        const el = await setupElement(config, GetActions);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mockError);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const mockError = getMock('error');
        const config = {
            entityId: '001S7000002VrnHIAS',
        };

        // mock server to return 404
        mockGetActionsNetworkErrorOnce(config, mockError);

        const el = await setupElement(config, GetActions);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mockError);

        const el2 = await setupElement(config, GetActions);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mockError);
    });

    it('returns cached result when cached data is available', async () => {
        const mock = getMock('actions');
        const config = {
            entityId: '001S7000002VrnHIAS',
        };
        mockGetActionsNetworkOnce(config, mock);

        // populate cache
        await setupElement(config, GetActions);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GetActions);

        expect(element.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock = getMock('actions');
        const updatedData = getMock('actions-updated');
        const config = {
            entityId: '001S7000002VrnHIAS',
        };
        // mock server to return 404
        mockGetActionsNetworkOnce(config, [mock, updatedData]);

        // populate cache
        await setupElement(config, GetActions);

        // expire cache
        timekeeper.travel(Date.now() + TTL + 1);

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GetActions);

        expect(element.getWiredData()).toEqual(updatedData);
    });
});
