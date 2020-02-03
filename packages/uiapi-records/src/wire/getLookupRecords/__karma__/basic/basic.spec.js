import GetLookupRecords from '../lwc/get-lookup-records';
import { karmaNetworkAdapter } from 'lds';
import {
    getMock as globalGetMock,
    mockNetworkOnce,
    setupElement,
    mockNetworkSequence,
    mockNetworkErrorOnce,
} from 'test-util';
import { URL_BASE, expireLookupRecords } from 'uiapi-test-util';
import sinon from 'sinon';

const ONCE = 'once';
const SEQUENCE = 'sequence';
const ERROR = 'error';
const MOCK_PREFIX = 'wire/getLookupRecords/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function getSinonParamsMatch({ endpoint, params = {} }) {
    return sinon.match(config => {
        const { queryParams } = config;
        return `${URL_BASE}/${endpoint}` === config.path && sinon.match(params).test(queryParams);
    });
}

const mockingNetworkBehaviourMap = {
    [ONCE]: (paramMatch, mockData) => mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData),
    [SEQUENCE]: (paramMatch, mockData) =>
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData),
    [ERROR]: (paramMatch, mockData) =>
        mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData),
};

function mockNetworkBehaviour(entryToMock, data, behaviour = ONCE) {
    mockingNetworkBehaviourMap[behaviour](getSinonParamsMatch(entryToMock), data);
}

describe('getLookupRecords', () => {
    let endpointEntries;

    beforeAll(() => {
        endpointEntries = getMock('endpointEntries');
    });

    function getEndpointEntry(reference) {
        return endpointEntries.find(entryToMock => entryToMock.filename === reference);
    }

    it('handles empty record response', async () => {
        const reference = 'lookup-records-Account-No-Records';
        const mock = getMock(reference);

        const config = {
            fieldApiName: 'Opportunity.AccountId',
            targetApiName: 'Account',
            requestParams: {
                q: 'nc',
                searchType: 'Recent',
                page: 1,
                pageSize: 25,
                dependentFieldBindings: null,
            },
        };

        mockNetworkBehaviour(getEndpointEntry(reference), mock);

        const elm = await setupElement(config, GetLookupRecords);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should make correct http request', async () => {
        const reference = 'lookup-records-Opportunity-AccountId-Account-pageSize-1-q-bu';
        const mock = getMock(reference);

        const config = {
            fieldApiName: 'Opportunity.AccountId',
            targetApiName: 'Account',
            requestParams: {
                q: 'Bur',
                searchType: 'TypeAhead',
                page: 1,
                pageSize: 10,
            },
        };

        mockNetworkBehaviour(getEndpointEntry(reference), mock);

        const elm = await setupElement(config, GetLookupRecords);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should make correct http request when fieldApiName is a FieldId', async () => {
        const reference = 'lookup-records-Opportunity-AccountId-Account-pageSize-1-q-bu';
        const mock = getMock(reference);

        const config = {
            fieldApiName: {
                objectApiName: 'Opportunity',
                fieldApiName: 'AccountId',
            },
            targetApiName: 'Account',
            requestParams: {
                q: 'Bur',
                searchType: 'TypeAhead',
                page: 1,
                pageSize: 10,
            },
        };

        mockNetworkBehaviour(getEndpointEntry(reference), mock);

        const elm = await setupElement(config, GetLookupRecords);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should make correct http request when target api name is an ObjectId', async () => {
        const reference = 'lookup-records-Opportunity-AccountId-Account-pageSize-1-q-bu';
        const mock = getMock(reference);

        const config = {
            fieldApiName: 'Opportunity.AccountId',
            targetApiName: {
                objectApiName: 'Account',
            },
            requestParams: {
                q: 'Bur',
                searchType: 'TypeAhead',
                page: 1,
                pageSize: 10,
            },
        };

        mockNetworkBehaviour(getEndpointEntry(reference), mock);

        const elm = await setupElement(config, GetLookupRecords);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should result in a cache hit when same params are requested', async () => {
        const reference = 'lookup-records-Opportunity-AccountId-Account-pageSize-1-q-bu';
        const mock = getMock(reference);

        const config = {
            fieldApiName: 'Opportunity.AccountId',
            targetApiName: 'Account',
            requestParams: {
                q: 'Bur',
                searchType: 'TypeAhead',
                page: 1,
                pageSize: 10,
            },
        };

        mockNetworkBehaviour(getEndpointEntry(reference), mock);

        const wireA = await setupElement(config, GetLookupRecords);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(config, GetLookupRecords);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should make correct http request when data is expired', async () => {
        const reference = 'lookup-records-Opportunity-AccountId-Account-pageSize-1-q-bu';
        const mock = getMock(reference);

        const config = {
            fieldApiName: 'Opportunity.AccountId',
            targetApiName: 'Account',
            requestParams: {
                q: 'Bur',
                searchType: 'TypeAhead',
                page: 1,
                pageSize: 10,
            },
        };

        mockNetworkBehaviour(getEndpointEntry(reference), Array(2).fill(mock), SEQUENCE);

        const wireA = await setupElement(config, GetLookupRecords);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expireLookupRecords();

        const wireB = await setupElement(config, GetLookupRecords);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // Should not have received new data
        expect(wireA.pushCount()).toBe(1);
    });

    it('should make correct http request when requestParams are present', async () => {
        const reference = 'lookup-records-Case-ContactId-Contact';
        const mock = getMock(reference);

        const config = {
            fieldApiName: 'Case.ContactId',
            targetApiName: 'Contact',
            requestParams: {
                q: 'jak',
                pageSize: 10,
                searchType: 'TypeAhead',
                page: 1,
            },
        };

        mockNetworkBehaviour(getEndpointEntry(reference), mock);

        const elm = await setupElement(config, GetLookupRecords);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should result in a cache hit when same requestParams are present', async () => {
        const reference = 'lookup-records-Case-ContactId-Contact';
        const mock = getMock(reference);

        const config = {
            fieldApiName: 'Case.ContactId',
            targetApiName: 'Contact',
            requestParams: {
                q: 'jak',
                pageSize: 10,
                searchType: 'TypeAhead',
                page: 1,
            },
        };

        mockNetworkBehaviour(getEndpointEntry(reference), mock);

        const wireA = await setupElement(config, GetLookupRecords);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(config, GetLookupRecords);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('refresh should refresh lookup records', async () => {
        const reference = 'lookup-records-Opportunity-AccountId-Account-pageSize-1-q-bu';
        const mock = getMock(reference);
        const refreshed = getMock(reference);
        refreshed.count = refreshed.count - 1;
        refreshed.records.pop();

        const config = {
            fieldApiName: 'Opportunity.AccountId',
            targetApiName: 'Account',
            requestParams: {
                q: 'Bur',
                searchType: 'TypeAhead',
                page: 1,
                pageSize: 10,
            },
        };

        mockNetworkBehaviour(getEndpointEntry(reference), [mock, refreshed], SEQUENCE);

        const element = await setupElement(config, GetLookupRecords);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshed);
    });

    describe('Error Management', () => {
        it(`returns error for invalid field api name`, async () => {
            const reference = 'lookup-records-fieldApiName-invalid';
            const mockData = getMock(reference);
            mockNetworkBehaviour(getEndpointEntry(reference), mockData, ERROR);
            const config = {
                fieldApiName: 'Opportunity.Id',
                targetApiName: 'Contact',
            };
            const element = await setupElement(config, GetLookupRecords);

            const error = element.getWiredError();
            expect(error).toContainErrorResponse(mockData);
        });
        it(`returns unkown error from the server and that is cached`, async () => {
            const reference = 'lookup-records-Opportunity-unknown-error';
            const mockData = getMock(reference);
            mockNetworkBehaviour(getEndpointEntry(reference), mockData, ERROR);

            const config = {
                fieldApiName: 'Opportunity.ContactId',
                targetApiName: 'Contact',
                requestParams: {
                    q: 'Bu',
                    searchType: 'Recent',
                    page: 123456,
                    pageSize: 10,
                },
            };
            const element = await setupElement(config, GetLookupRecords);

            const error = element.getWiredError();
            expect(element.pushCount()).toBe(1);
            expect(error).toContainErrorResponse(mockData);
        });
    });
});
