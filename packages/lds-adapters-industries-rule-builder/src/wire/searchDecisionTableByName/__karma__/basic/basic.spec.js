import SearchDecisionTableByName from '../lwc/search-decision-table-by-name';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockSearchDecisionTableByNameNetworkOnce,
    mockSearchDecisionTableByNameNetworkErrorOnce,
    expireSearchData,
} from 'industries-rule-builder-test-util';
const MOCK_PREFIX = 'wire/searchDecisionTableByName/__karma__/data/';
const MOCK_SEARCH_DECISION_TABLE_EMPTY_JSON = 'searchDecisionTableByNameEmpty';
const MOCK_SEARCH_DECISION_TABLE_JSON = 'searchDecisionTableByName';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}
describe('basic', () => {
    it('fetches search result decision table successfully using a valid configuration', async () => {
        const mock = getMock(MOCK_SEARCH_DECISION_TABLE_JSON);
        const config = {
            query: {
                searchKey: 'DT1',
            },
        };
        mockSearchDecisionTableByNameNetworkOnce(config, mock);
        const el = await setupElement(config.query, SearchDecisionTableByName);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredDecisionTables())).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock(MOCK_SEARCH_DECISION_TABLE_JSON);
        const config = {
            query: {
                searchKey: 'DT1',
            },
        };

        // Mock network request once only
        mockSearchDecisionTableByNameNetworkOnce(config, mock);

        const el = await setupElement(config.query, SearchDecisionTableByName);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredDecisionTables()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(config.query, SearchDecisionTableByName);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredDecisionTables()).toEqual(mock);
    });

    it('makes two network calls when time elapsed > TTL', async () => {
        const mock = getMock(MOCK_SEARCH_DECISION_TABLE_JSON);
        const config = {
            query: {
                searchKey: 'DT1',
            },
        };
        mockSearchDecisionTableByNameNetworkOnce(config, [mock, mock]);

        const el1 = await setupElement(config.query, SearchDecisionTableByName);

        expect(el1.pushCount()).toBe(1);
        expect(el1.getWiredDecisionTables()).toEqualSnapshotWithoutEtags(mock);

        expireSearchData();

        const el2 = await setupElement(config.query, SearchDecisionTableByName);

        // el2 should not have received new value
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredDecisionTables()).toEqualSnapshotWithoutEtags(mock);
    });

    it('fetches search results successfully with no items', async () => {
        const mock = getMock(MOCK_SEARCH_DECISION_TABLE_EMPTY_JSON);
        const config = { query: {} };
        mockSearchDecisionTableByNameNetworkOnce(config, mock);
        const el = await setupElement(config, SearchDecisionTableByName);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredDecisionTables())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { query: { searchKey: 'test123' } };
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
        mockSearchDecisionTableByNameNetworkErrorOnce(config, mock);
        const el = await setupElement(config.query, SearchDecisionTableByName);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });

    it('causes a cache hit when a searchDecisionTableByName is queried after server returned 404', async () => {
        const mockError = {
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

        const config = { query: { searchKey: 'test123' } };

        mockSearchDecisionTableByNameNetworkErrorOnce(config, mockError);

        const elm = await setupElement(config.query, SearchDecisionTableByName);
        expect(elm.getError()).toEqual(mockError);
        expect(elm.getError()).toBeImmutable();

        const secondElm = await setupElement(config.query, SearchDecisionTableByName);
        expect(secondElm.getError()).toEqual(mockError);
        expect(secondElm.getError()).toBeImmutable();
    });

    it('causes a cache miss when a searchDecisionTableByName is queried again after server returned 404, and cache is cleared', async () => {
        const mock = getMock(MOCK_SEARCH_DECISION_TABLE_JSON);
        const config = { query: { searchKey: 'test123' } };
        const mockError = {
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

        mockSearchDecisionTableByNameNetworkOnce(config, [
            {
                reject: true,
                data: mockError,
            },
            mock,
        ]);

        const elm = await setupElement(config.query, SearchDecisionTableByName);
        expect(elm.getError()).toEqual(mockError);

        expireSearchData();

        const secondElm = await setupElement(config.query, SearchDecisionTableByName);
        expect(secondElm.getError()).toBeUndefined();
        expect(secondElm.getWiredDecisionTables()).toEqual(mock);
    });
});
