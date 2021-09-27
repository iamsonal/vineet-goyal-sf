import {
    getMock as globalGetMock,
    mockNetworkOnce,
    mockNetworkSequence,
    setupElement,
} from 'test-util';
import { URL_BASE, expireRecords, mockGetRecordNetwork } from 'uiapi-test-util';
import { karmaNetworkAdapter } from 'lds-engine';
import sinon from 'sinon';
import { beforeEach as util_beforeEach } from '../util';

import ListUi from '../lwc/basic';
import RecordWire from './../../../getRecord/__karma__/lwc/record-fields';

const MOCK_PREFIX = 'wire/getListUi/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetworkListUi(config, mockData) {
    const { listViewId, ...queryParams } = config;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/list-ui/${listViewId}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

beforeEach(() => {
    util_beforeEach();
});

describe('basic', () => {
    it('should not emit new snapshot when selected list data has not changed', async () => {
        const mockListUi = getMock('list-ui-All-Opportunities');
        const listViewUiConfig = {
            listViewId: mockListUi.info.listReference.id,
        };
        mockNetworkListUi(listViewUiConfig, mockListUi);

        const mockRecord = getMock(
            'record-Opportunity-fields-Opportunity.Owner.City.Opportunity.Owner.Name'
        );
        const recordConfig = {
            recordId: mockRecord.id,
            fields: ['Opportunity.Owner.City'],
        };
        mockGetRecordNetwork(recordConfig, mockRecord);

        const element = await setupElement(
            {
                ...listViewUiConfig,
                pageSize: mockListUi.records.records.length,
            },
            ListUi
        );

        expireRecords();
        await setupElement(recordConfig, RecordWire);

        // It should not have pushed a new value to list ui element because Opportunity.Owner.City
        // is not referenced there
        expect(element.pushCount()).toBe(1);
    });
});

describe('errors', () => {
    it('emit error snapshot when network responses 404s', async () => {
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

        // actual listViewId value doesn't really matter here since we mock fetch to 404
        const config = { listViewId: '00BRM0000029bDc2AI' };
        mockNetworkListUi(config, { reject: true, data: mockError });

        const element = await setupElement(config, ListUi);
        expect(element.getWiredError()).toEqualImmutable(mockError);
    });

    it('listViewId does not exist', async () => {
        const mockError = {
            ok: false,
            status: 403,
            statusText: 'FORBIDDEN',
            body: [
                {
                    errorCode: 'INSUFFICIENT_ACCESS',
                    message:
                        "You don't have access to this record. Ask your administrator for help or to request access.",
                },
            ],
        };

        const config = { listViewId: 'invalidListViewId' };

        mockNetworkListUi(config, { reject: true, data: mockError });

        const element = await setupElement(config, ListUi);
        expect(element.getWiredError()).toEqualImmutable(mockError);
    });

    it('pageSize is -1', async () => {
        const mockError = {
            ok: false,
            status: 400,
            statusText: 'BAD_REQUEST',
            body: [
                {
                    errorCode: 'NUMBER_OUTSIDE_VALID_RANGE',
                    message: 'pageSize parameter must be between 1 and 2000',
                },
            ],
        };

        const config = { listViewId: '00BRM00000ZZZZZZZZ', pageSize: -1 };
        mockNetworkListUi(config, { reject: true, data: mockError });
        const element = await setupElement(config, ListUi);
        expect(element.getWiredError()).toEqualImmutable(mockError);
    });

    it('pageSize is above max', async () => {
        const mockError = {
            ok: false,
            status: 400,
            statusText: 'BAD_REQUEST',
            body: [
                {
                    errorCode: 'NUMBER_OUTSIDE_VALID_RANGE',
                    message: 'pageSize parameter must be between 1 and 2000',
                },
            ],
        };

        const config = { listViewId: '00BRM00000ZZZZZZZZ', pageSize: 2100 };
        mockNetworkListUi(config, { reject: true, data: mockError });
        const element = await setupElement(config, ListUi);
        expect(element.getWiredError()).toEqualImmutable(mockError);
    });

    it('pageToken is invalid', async () => {
        const mockError = {
            ok: false,
            status: 400,
            statusText: 'BAD_REQUEST',
            body: [
                {
                    errorCode: 'ILLEGAL_QUERY_PARAMETER_VALUE',
                    message: 'For input string: invalid',
                },
            ],
        };

        // actual listViewId value doesn't really matter here since we mock fetch to 404
        const config = { listViewId: '00BRM0000029bDc2AI', pageSize: 1, pageToken: 'invalid' };
        mockNetworkListUi(config, { reject: true, data: mockError });

        const element = await setupElement(config, ListUi);
        expect(element.getWiredError()).toEqualImmutable(mockError);
    });

    it('requests non-existent fields', async () => {
        const mockError = {
            ok: false,
            status: 400,
            statusText: 'BAD_REQUEST',
            body: [
                {
                    errorCode: 'INVALID_FIELD',
                    message: "No such column 'BadField' on entity Opportunity",
                },
            ],
        };

        // actual listViewId value doesn't really matter here since we mock fetch to 404
        const config = { listViewId: '00BRM0000029bDc2AI', fields: ['BadField'] };
        mockNetworkListUi(config, { reject: true, data: mockError });

        const element = await setupElement(config, ListUi);
        expect(element.getWiredError()).toEqualImmutable(mockError);
    });

    it('returns error when multiple sortBy values are passed', async () => {
        // even though sortBy is of type Array<string> it accept a single value

        const mockError = {
            ok: false,
            status: 400,
            statusText: 'BAD_REQUEST',
            body: [
                {
                    errorCode: 'ILLEGAL_QUERY_PARAMETER_VALUE',
                    message: 'Can only sortBy one value',
                },
            ],
        };
        const config = { listViewId: '00BRM0000029bDc2AI', sortBy: ['Account.Name'] };
        mockNetworkListUi(config, { reject: true, data: mockError });

        const element = await setupElement(config, ListUi);
        expect(element.getWiredError()).toEqualImmutable(mockError);
    });
});

describe('refresh', () => {
    it('should refresh list ui', async () => {
        const mock = getMock('list-ui-All-Opportunities');
        const refreshed = getMock('list-ui-All-Opportunities');
        refreshed.eTag = refreshed.eTag + '999';
        refreshed.info.eTag = refreshed.info.eTag + '999';
        refreshed.info.updateable = !refreshed.info.updateable;
        refreshed.records.listInfoETag = refreshed.info.eTag;

        const config = {
            listViewId: mock.info.listReference.id,
        };
        mockNetworkSequence(
            karmaNetworkAdapter,
            sinon.match({
                basePath: `${URL_BASE}/list-ui/${mock.info.listReference.id}`,
                queryParams: {},
            }),
            [mock, refreshed]
        );

        const element = await setupElement(config, ListUi);

        expect(element.pushCount()).toBe(1);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
    });
});

describe('special data', () => {
    it('handles nested entities that omit the 5 magic fields', async () => {
        const mockData = getMock('list-ui-All-Open-Leads-pageSize-1');
        const config = {
            listViewId: mockData.info.listReference.id,
            pageSize: mockData.records.pageSize,
        };
        mockNetworkListUi(config, mockData);

        const element = await setupElement(config, ListUi);
        expect(element.getWiredData()).toEqualListUi(mockData);
    });
});
