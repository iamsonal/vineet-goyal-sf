import GetContactsInteractions from '../lwc/get-contacts-interactions';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetContactsInteractionsNetworkOnce,
    mockGetContactsInteractionsNetworkErrorOnce,
} from 'industries-cib-test-util';

const MOCK_PREFIX = 'wire/getContactsInteractions/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets contactsInteractions admin context', async () => {
        const mock = getMock('contacts-interactions-admin-context');
        const config = {
            systemContext: true,
            contactIds: ['003R000000T3K4EIAV', '003R000000T3K49IAF'],
            relatedRecordId: '0lsR00000000014IAA',
        };
        mockGetContactsInteractionsNetworkOnce(config, mock);

        const el = await setupElement(config, GetContactsInteractions);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredContactsInteractions()).toEqual(mock);
    });

    it('gets contactsInteractions user context', async () => {
        const mock = getMock('contacts-interactions-user-context');
        const config = {
            systemContext: false,
            contactIds: ['003R000000T3K4EIAV', '003R000000T3K49IAF'],
            relatedRecordId: '0lsR00000000014IAA',
        };
        mockGetContactsInteractionsNetworkOnce(config, mock);

        const el = await setupElement(config, GetContactsInteractions);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredContactsInteractions()).toEqual(mock);
    });

    it('do not fetch ContactsInteractions second time', async () => {
        const mock = getMock('contacts-interactions-user-context');
        const config = {
            systemContext: false,
            contactIds: ['003R000000T3K4EIAV', '003R000000T3K49IAF'],
            relatedRecordId: '0lsR00000000014IAA',
        };
        mockGetContactsInteractionsNetworkOnce(config, mock);

        const el = await setupElement(config, GetContactsInteractions);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredContactsInteractions()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network traffic once
        const el2 = await setupElement(config, GetContactsInteractions);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredContactsInteractions()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = {
            systemContext: false,
            contactIds: ['003R000000T3K4EIAV', '003R000000T3K49IAF'],
            relatedRecordId: '0lsR00000000014IAA',
        };
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
        mockGetContactsInteractionsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetContactsInteractions);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
