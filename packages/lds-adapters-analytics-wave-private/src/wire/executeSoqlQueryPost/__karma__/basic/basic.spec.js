import WiredExecuteSoqlQueryPost from '../lwc/execute-soql-query-post';
import { getMock as globalGetMock, setupElement, updateElement } from 'test-util';
import {
    mockExecuteSoqlQueryPostNetworkOnce,
    mockExecuteSoqlQueryPostNetworkErrorOnce,
} from 'analytics-wave-private-test-util';
import timekeeper from 'timekeeper';

const MOCK_PREFIX = 'wire/executeSoqlQueryPost/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

const query = { query: 'SELECT Id,Name,Type,CreatedById FROM Account LIMIT 100' };
const TTL = 5000;

describe('wired', () => {
    it('returns data', async () => {
        const mock = getMock('soql-results');
        mockExecuteSoqlQueryPostNetworkOnce(query, mock);

        const element = await setupElement(query, WiredExecuteSoqlQueryPost);
        const data = element.getWiredData();
        expect(data).toEqual(mock);
        expect(element.pushCount()).toBe(1);
    });

    it('does not issue network request on config with undefined query', async () => {
        const element = await setupElement({}, WiredExecuteSoqlQueryPost);

        expect(element.pushCount()).toBe(0);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('soql-results');
        mockExecuteSoqlQueryPostNetworkOnce(query, mock);

        const el = await setupElement(query, WiredExecuteSoqlQueryPost);

        expect(el.getWiredData()).toEqual(mock);
        expect(el.pushCount()).toBe(1);

        const el2 = await setupElement(query, WiredExecuteSoqlQueryPost);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('fetches a second time after TTL expires', async () => {
        const mock = getMock('soql-results');
        const mock2 = getMock('soql-results-2');
        mockExecuteSoqlQueryPostNetworkOnce(query, [mock, mock2]);

        const el = await setupElement(query, WiredExecuteSoqlQueryPost);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        timekeeper.travel(Date.now() + TTL + 1);

        await updateElement(el, query);
        expect(el.pushCount()).toBe(2);
        expect(el.getWiredData()).toEqual(mock2);
    });

    it('displays error when network request 404s', async () => {
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
        mockExecuteSoqlQueryPostNetworkErrorOnce(query, mock);

        const el = await setupElement(query, WiredExecuteSoqlQueryPost);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
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

        mockExecuteSoqlQueryPostNetworkErrorOnce(query, mock);

        const el = await setupElement(query, WiredExecuteSoqlQueryPost);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(query, WiredExecuteSoqlQueryPost);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
