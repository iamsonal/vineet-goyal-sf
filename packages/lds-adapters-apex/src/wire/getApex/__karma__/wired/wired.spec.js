import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireApex, mockApexNetwork, mockApexNetworkOnce } from 'apex-test-util';
import { getSObjectValue } from 'lds';

import Imperative from '../lwc/imperative';
import Wired from '../lwc/wired';
import WiredCustomProp from '../lwc/wiredCustomProp';

const MOCK_PREFIX = 'wire/getApex/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

const requestBody = {
    namespace: '',
    classname: 'ContactController',
    method: 'getContactList',
    isContinuation: false,
    params: {},
    cacheable: true,
};
const mockHeaders = { cacheable: true };

describe('Apex getSObjectValue', () => {
    it('returns Contact.Name from sObject response', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetworkOnce(requestBody, mockApex, mockHeaders);

        const element = await setupElement({}, Wired);

        expect(element.getWiredContacts()).toEqual(mockApex);

        let sObject = element.getWiredContacts()[0];
        let expectedData = mockApex[0];

        expect(getSObjectValue(sObject, 'Contact.Name')).toEqual(expectedData['Name']);
    });

    it('returns undefined for null sObject', async () => {
        expect(getSObjectValue(null, 'Contact.Name')).toBeUndefined();
    });

    it('returns undefined for string sObject', async () => {
        expect(getSObjectValue('heya', 'Contact.Name')).toBeUndefined();
    });

    it('returns undefined for field that is not in sObject', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetworkOnce(requestBody, mockApex, mockHeaders);

        const element = await setupElement({}, Wired);

        expect(element.getWiredContacts()).toEqual(mockApex);

        let sObject = element.getWiredContacts()[0];

        expect(getSObjectValue(sObject, 'Contact.ShouldNotExist__c')).toBeUndefined();
    });
});

describe('@wire Apex call', () => {
    it('returns data', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetworkOnce(requestBody, mockApex, mockHeaders);

        const element = await setupElement({}, Wired);

        expect(element.getWiredContacts()).toEqual(mockApex);
    });

    it('returns error', async () => {
        const mockApexError = getMock('apex-getContactList-wiredError');
        mockApexNetwork(requestBody, { reject: true, data: mockApexError }, mockHeaders);

        const element = await setupElement({}, Wired);

        expect(element.getWiredError()).toContainErrorResponse(mockApexError);
    });

    it('does not issue network request on configs with undefined values', async () => {
        const element = await setupElement({ property: undefined }, WiredCustomProp);

        expect(element.pushCount()).toBe(0);
    });

    it('uses cached data when cacheable is set in response', async () => {
        const mockApex = getMock('apex-getContactList');
        mockApexNetworkOnce(requestBody, mockApex, mockHeaders);

        await setupElement({}, Wired);

        // would throw if more than one network request
        const element = await setupElement({}, Wired);
        expect(element.getWiredContacts()).toEqual(mockApex);
    });

    it('issues a new network request when cacheable is not set in response', async () => {
        const mockApex = getMock('apex-getContactList');

        mockApexNetwork(
            requestBody,
            [mockApex, mockApex],
            [{ cacheable: false }, { cacheable: true }]
        );

        await setupElement({}, Wired);

        const element = await setupElement({}, Wired);
        expect(element.getWiredContacts()).toEqual(mockApex);
    });

    it('refreshes data', async () => {
        const mockApex1 = getMock('apex-getContactList');
        const mockApex2 = mockApex1.slice(mockApex1.length - 1);
        mockApexNetwork(requestBody, [mockApex1, mockApex2], [mockHeaders, mockHeaders]);

        const element = await setupElement({}, Wired);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredContacts()).toEqual(mockApex1);

        await element.refreshWiredContacts();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredContacts()).toEqual(mockApex2);
    });

    it('does not emit same refreshed data', async () => {
        const mockApex1 = getMock('apex-getContactList');
        const mockApex2 = getMock('apex-getContactList');
        mockApexNetwork(requestBody, [mockApex1, mockApex2], [mockHeaders, mockHeaders]);

        const element = await setupElement({}, Wired);

        expect(element.pushCount()).toBe(1);

        await element.refreshWiredContacts();

        expect(element.pushCount()).toBe(1);
    });

    it('uses cache of imperative', async () => {
        const mockApex = getMock('apex-getContactList');
        const imperativeRequestBody = {
            namespace: '',
            classname: 'ContactController',
            method: 'getContactList',
            isContinuation: false,
            params: undefined,
            cacheable: false,
        };

        mockApexNetworkOnce(imperativeRequestBody, mockApex, mockHeaders);

        await (await setupElement({}, Imperative)).getContacts();

        // would throw if more than one network request
        const element = await setupElement({}, Wired);
        expect(element.getWiredContacts()).toEqual(mockApex);
    });

    xit('handles continuations, longRunning true');

    it('makes network request after cache TTLs out', async () => {
        const mockApex1 = getMock('apex-getContactList');
        const mockApex2 = mockApex1.slice(1);
        mockApexNetwork(requestBody, [mockApex1, mockApex2], [mockHeaders, mockHeaders]);

        await setupElement({}, Wired);

        expireApex();

        const element = await setupElement({}, Wired);
        expect(element.getWiredContacts()).toEqual(mockApex2);
    });

    xit('handles successful response that contains error payload');

    xit('handles rejected promise from network (eg server 500s), does not cache the result');

    xit('cache hit if params created in different order, especially on nested objects of params');
});
