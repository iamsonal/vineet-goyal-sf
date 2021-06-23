import SearchDecisionMatrixByName from '../lwc/search-decision-matrix-by-name';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockSearchDecisionMatrixByNameNetworkOnce,
    mockSearchDecisionMatrixByNameNetworkErrorOnce,
    expireSearchData,
} from 'industries-rule-builder-test-util';
const MOCK_PREFIX = 'wire/searchDecisionMatrixByName/__karma__/data/';
const MOCK_SEARCH_DECISION_MATRICES_EMPTY_JSON = 'searchDecisionMatrixByNameEmpty';
const MOCK_SEARCH_DECISION_MATRICES_JSON = 'searchDecisionMatrixByName';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}
describe('basic', () => {
    it('fetches search result decision matrices successfully using a valid configuration', async () => {
        const mock = getMock(MOCK_SEARCH_DECISION_MATRICES_JSON);
        const config = {
            query: {
                searchKey: 'DM1',
            },
        };
        mockSearchDecisionMatrixByNameNetworkOnce(config, mock);
        const el = await setupElement(config.query, SearchDecisionMatrixByName);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredDecisionMatrices())).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock(MOCK_SEARCH_DECISION_MATRICES_JSON);
        const config = {
            query: {
                searchKey: 'DM1',
            },
        };

        // Mock network request once only
        mockSearchDecisionMatrixByNameNetworkOnce(config, mock);

        const el = await setupElement(config.query, SearchDecisionMatrixByName);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredDecisionMatrices()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(config.query, SearchDecisionMatrixByName);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredDecisionMatrices()).toEqual(mock);
    });

    it('makes two network calls when time elapsed > TTL', async () => {
        const mock = getMock(MOCK_SEARCH_DECISION_MATRICES_JSON);
        const config = {
            query: {
                searchKey: 'DM1',
            },
        };
        mockSearchDecisionMatrixByNameNetworkOnce(config, [mock, mock]);

        const el1 = await setupElement(config.query, SearchDecisionMatrixByName);

        expect(el1.pushCount()).toBe(1);
        expect(el1.getWiredDecisionMatrices()).toEqualSnapshotWithoutEtags(mock);

        expireSearchData();

        const el2 = await setupElement(config.query, SearchDecisionMatrixByName);

        // el2 should not have received new value
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredDecisionMatrices()).toEqualSnapshotWithoutEtags(mock);
    });

    it('fetches search results successfully with no items', async () => {
        const mock = getMock(MOCK_SEARCH_DECISION_MATRICES_EMPTY_JSON);
        const config = { query: {} };
        mockSearchDecisionMatrixByNameNetworkOnce(config, mock);
        const el = await setupElement(config, SearchDecisionMatrixByName);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredDecisionMatrices())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { query: {} };
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
        mockSearchDecisionMatrixByNameNetworkErrorOnce(config, mock);
        const el = await setupElement(config.query, SearchDecisionMatrixByName);
        expect(el.pushCount()).toBe(1);
        expect(el.getError().body).toEqual(mock);
    });

    it('causes a cache hit when a searchDecisionMatrixByName is queried after server returned 404', async () => {
        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];
        const config = { query: {} };

        mockSearchDecisionMatrixByNameNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mockError,
            },
        ]);

        const expectedError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };

        const elm = await setupElement(config, SearchDecisionMatrixByName);
        expect(elm.getError()).toEqual(expectedError);
        expect(elm.getError()).toBeImmutable();

        const secondElm = await setupElement(config, SearchDecisionMatrixByName);
        expect(secondElm.getError()).toEqual(expectedError);
        expect(secondElm.getError()).toBeImmutable();
    });

    it('causes a cache miss when a searchDecisionMatrixByName is queried again after server returned 404, and cache is cleared', async () => {
        const mock = getMock(MOCK_SEARCH_DECISION_MATRICES_JSON);
        const config = { query: { searchKey: 'test123' } };
        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];

        mockSearchDecisionMatrixByNameNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mockError,
            },
            mock,
        ]);

        const expectedError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: mockError,
        };

        const elm = await setupElement(config.query, SearchDecisionMatrixByName);
        expect(elm.getError()).toEqual(expectedError);

        expireSearchData();

        const secondElm = await setupElement(config.query, SearchDecisionMatrixByName);
        expect(secondElm.getError()).toBeUndefined();
        expect(secondElm.getWiredDecisionMatrices()).toEqual(mock);
    });
});
