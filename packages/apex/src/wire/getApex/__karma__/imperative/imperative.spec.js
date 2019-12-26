import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireApex, mockApexNetwork, mockApexNetworkOnce } from 'apex-test-util';

import Imperative from '../lwc/imperative';
import Wired from '../lwc/wired';

const MOCK_PREFIX = 'wire/getApex/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

const requestBody = {
    namespace: '',
    classname: 'ContactController',
    method: 'getContactList',
    isContinuation: false,
    params: undefined,
    cacheable: false,
};

const mockHeaders = { cacheable: true };

describe('imperative Apex call', () => {
    it('returns data', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetworkOnce(requestBody, mockApex, mockHeaders);

        const element = await setupElement({}, Imperative);
        const contacts = await element.getContacts();

        expect(contacts).toEqual(mockApex);
    });

    it('returns error', async () => {
        const mockApexError = getMock('apex-getContactList-imperativeError');
        mockApexNetwork(requestBody, { reject: true, data: mockApexError }, mockHeaders);

        const element = await setupElement({}, Imperative);
        const error = await element.getContacts();

        expect(error).toContainErrorResponse(mockApexError);
    });

    it('uses cached data when cacheable is set in response', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetworkOnce(requestBody, mockApex, mockHeaders);

        await setupElement({}, Imperative);

        // would throw if more than one network request
        const element = await setupElement({}, Imperative);
        const contacts = await element.getContacts();
        expect(contacts).toEqual(mockApex);
    });

    it('issues a new network request when cacheable is not set in response', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetwork(
            requestBody,
            [mockApex, mockApex],
            [{ cacheable: false }, { cacheable: true }]
        );

        const element = await setupElement({}, Imperative);
        await element.getContacts();
        const contacts = await element.getContacts();
        expect(contacts).toEqual(mockApex);
    });

    it('throws an error when trying to refresh non-cacheable apex data', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetworkOnce(requestBody, mockApex, mockHeaders);

        const element = await setupElement({}, Imperative);
        const contacts = await element.getContacts();
        expect(contacts).toEqual(mockApex);

        expect(() => element.refreshContacts()).toThrow();
    });

    it('uses cache of @wire', async () => {
        const mockApex = getMock('apex-getContactList');
        const wiredRequestBody = {
            namespace: '',
            classname: 'ContactController',
            method: 'getContactList',
            isContinuation: false,
            params: {},
            cacheable: true,
        };
        mockApexNetworkOnce(wiredRequestBody, mockApex, mockHeaders);

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
        mockApexNetwork(requestBody, [mockApex1, mockApex2], [mockHeaders, mockHeaders]);

        const element = await setupElement({}, Imperative);
        await element.getContacts();

        expireApex();

        const contacts = await element.getContacts();
        expect(contacts).toEqual(mockApex2);
    });
});
