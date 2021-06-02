import { getMock as globalGetMock, setupElement } from 'test-util';
import { CACHE_CONTROL, expireApex, mockApexNetwork, mockApexNetworkOnce } from 'apex-test-util';

import Imperative from '../lwc/imperative';
import Wired from '../lwc/wired';

const MOCK_PREFIX = 'wire/postApex/__karma__/data/';

const BASE_URI = '/lwr/v53.0/apex';
const BASE_PATH = '/ContactController/getContactList';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

const request = {
    baseUri: BASE_URI,
    basePath: BASE_PATH,
    method: 'post',
    body: undefined,
    urlParams: {
        apexMethod: 'getContactList',
        apexClass: 'ContactController',
    },
    headers: {
        'X-SFDC-Allow-Continuation': false,
    },
};

const mockCacheableHeaders = { [CACHE_CONTROL]: 'private' };
const mockNonCacheableHeaders = { [CACHE_CONTROL]: 'no-cache' };

describe('imperative Apex call', () => {
    it('returns immutable data for cacheable apex function', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetworkOnce(request, mockApex, mockCacheableHeaders);

        const element = await setupElement({}, Imperative);
        const contacts = await element.getContacts();

        expect(contacts).toEqual(mockApex);
        expect(contacts).toBeImmutable();
    });

    it('returns mutable data for non-cacheable apex function', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetworkOnce(request, mockApex, mockNonCacheableHeaders);

        const element = await setupElement({}, Imperative);
        const contacts = await element.getContacts();

        expect(contacts).toEqual(mockApex);
        expect(contacts).toBeMutable();
    });

    it('returns immutable error', async () => {
        const mockApexError = getMock('apex-getContactList-imperativeError');
        mockApexNetwork(request, { reject: true, data: mockApexError }, mockCacheableHeaders);

        const element = await setupElement({}, Imperative);
        const error = await element.getContacts();

        expect(error).toContainErrorResponse(mockApexError);
    });

    it('uses cached data when cacheable is set in response', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetworkOnce(request, mockApex, mockCacheableHeaders);

        await setupElement({}, Imperative);

        // would throw if more than one network request
        const element = await setupElement({}, Imperative);
        const contacts = await element.getContacts();
        expect(contacts).toEqual(mockApex);
    });

    it('issues a new network request when cacheable is not set in response', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetwork(request, [mockApex, mockApex], [{ cacheable: false }, { cacheable: true }]);

        const element = await setupElement({}, Imperative);
        await element.getContacts();
        const contacts = await element.getContacts();
        expect(contacts).toEqual(mockApex);
    });

    it('throws an error when trying to refresh non-cacheable apex data', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetworkOnce(request, mockApex, mockCacheableHeaders);

        const element = await setupElement({}, Imperative);
        const contacts = await element.getContacts();
        expect(contacts).toEqual(mockApex);

        expect(() => element.refreshContacts()).toThrow();
    });

    it('uses cache of @wire', async () => {
        const mockApex = getMock('apex-getContactList');
        const wiredRequest = {
            baseUri: BASE_URI,
            basePath: BASE_PATH,
            method: 'get',
            body: null,
            urlParams: {
                apexMethod: 'getContactList',
                apexClass: 'ContactController',
            },
            queryParams: {
                methodParams: {},
            },
            headers: {
                'X-SFDC-Allow-Continuation': 'false',
            },
        };
        mockApexNetworkOnce(wiredRequest, mockApex, mockCacheableHeaders);

        await setupElement({}, Wired);

        // would throw if more than one network request
        const element = await setupElement({}, Imperative);
        const contacts = await element.getContacts();
        expect(contacts).toEqual(mockApex);
    });

    xit('handles continuations, longRunning true');

    it('makes network request after cache TTLs out', async () => {
        const mockApex1 = getMock('apex-getContactList');
        const mockApex2 = mockApex1.slice(1);
        mockApexNetwork(
            request,
            [mockApex1, mockApex2],
            [mockCacheableHeaders, mockCacheableHeaders]
        );

        const element = await setupElement({}, Imperative);
        await element.getContacts();

        expireApex();

        const contacts = await element.getContacts();
        expect(contacts).toEqual(mockApex2);
    });
});
