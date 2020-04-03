import {
    getMock as globalGetMock,
    mockNetworkErrorOnce,
    mockNetworkOnce,
    mockNetworkSequence,
    setupElement,
} from 'test-util';
import { URL_BASE, expireRecords, mockGetRecordNetwork } from 'uiapi-test-util';
import { karmaNetworkAdapter } from 'lds';
import sinon from 'sinon';
import { beforeEach as util_beforeEach } from '../util';

import Basic from '../lwc/basic';
import RecordWire from './../../../getRecord/__karma__/lwc/record-fields';

const MOCK_PREFIX = 'wire/getListUi/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetworkListUi(config, mockData) {
    const listViewId = config.listViewId;
    const queryParams = { ...config };
    delete queryParams.listViewId;

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
    it('displays error when network request 404s', async () => {
        // actual listViewId value doesn't really matter here since we mock fetch to 404
        const listViewId = '00BRM0000029bDc2AI';
        const response404 = {
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

        const matchParams = sinon.match({
            basePath: `${URL_BASE}/list-ui/${listViewId}`,
        });
        mockNetworkErrorOnce(karmaNetworkAdapter, matchParams, response404);

        const element = await setupElement({ listViewId }, Basic);

        const wiredData = element.getWiredData();
        expect(wiredData.error).toBeTruthy();
    });

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
            Basic
        );

        expireRecords();
        await setupElement(recordConfig, RecordWire);

        // It should not have pushed a new value to list ui element because Opportunity.Owner.City
        // is not referenced there
        expect(element.pushCount()).toBe(1);
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

        const element = await setupElement(config, Basic);

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

        const element = await setupElement(config, Basic);

        expect(element.getWiredData()).toEqualListUi(mockData);
    });
});
