import { getMock as globalGetMock, setupElement, flushPromises } from 'test-util';
import {
    URL_BASE,
    mockDeleteRecordNetwork,
    mockGetRecordNetwork,
    mockGetRecordUiNetwork,
} from 'uiapi-test-util';
import { deleteRecord } from 'lds-adapters-uiapi';
import { karmaNetworkAdapter } from 'lds-engine';

import RecordFields from '../../getRecord/__karma__/lwc/record-fields';
import RecordFieldsLayoutTypes from '../../getRecord/__karma__/lwc/record-fields-layout-types';
import RecordUi from '../../getRecordUi/__karma__/lwc/record-ui';

const MOCK_PREFIX = 'wire/deleteRecord/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('deleteRecord - basic', () => {
    it('sends request with the given record Id', async () => {
        const recordId = '005B00000029o0qIAA';
        mockDeleteRecordNetwork(recordId);

        await deleteRecord(recordId);

        const expected = {
            basePath: `${URL_BASE}/records/${recordId}`,
            method: 'delete',
            urlParams: { recordId },
        };

        expect(karmaNetworkAdapter.firstCall.args[0]).toEqual(jasmine.objectContaining(expected));
    });

    it('evicts record from cache', async () => {
        const mockRecord = getMock('record-Opportunity-fields-Opportunity.FiscalYear');
        const mockError = {
            status: 404,
            statusText: 'Server Error',
            ok: false,
            body: getMock('delete-record-not-exist'),
        };
        const recordId = mockRecord.id;

        const config = {
            recordId,
            fields: ['Opportunity.FiscalYear'],
        };
        mockGetRecordNetwork(config, [
            mockRecord,
            {
                reject: true,
                data: mockError,
            },
        ]);
        mockDeleteRecordNetwork(recordId);

        // populate cache
        const element = await setupElement(config, RecordFields);

        await deleteRecord(recordId);
        // the existing wire will be refreshed
        await flushPromises();

        // hit network
        expect(element.pushCount()).toBe(2);
        expect(element.getWiredError()).toEqual(mockError);

        expect(element.getWiredError()).toBeImmutable();
    });

    it('evicts record fetched with layoutType from cache', async () => {
        const mockRecordUiData = getMock('record-Opportunity-layouttypes-Full-modes-View');
        const mockRecord = mockRecordUiData.records[Object.keys(mockRecordUiData.records)[0]];
        const mockError = {
            status: 404,
            statusText: 'Server Error',
            ok: false,
            body: getMock('delete-record-not-exist'),
        };
        const recordId = mockRecord.id;

        const config = {
            recordId: mockRecord.id,
            layoutTypes: ['Full'],
        };

        const recordUiConfig = {
            recordIds: [mockRecord.id],
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        const networkParams = {
            recordIds: config.recordId,
            layoutTypes: config.layoutTypes,
        };
        mockGetRecordUiNetwork(networkParams, [
            mockRecordUiData,
            {
                reject: true,
                data: mockError,
            },
            {
                reject: true,
                data: mockError,
            },
        ]);
        mockDeleteRecordNetwork(recordId);

        // populate cache
        const element = await setupElement(config, RecordFieldsLayoutTypes);
        const recordUi = await setupElement(recordUiConfig, RecordUi);

        expect(element.pushCount()).toBe(1);
        expect(recordUi.pushCount()).toBe(1);

        await deleteRecord(recordId);
        // the existing wire will be refreshed
        await flushPromises();

        // hit network
        expect(element.pushCount()).toBe(2);
        expect(recordUi.pushCount()).toBe(2);

        expect(element.getWiredError()).toEqual(mockError);
        expect(element.getWiredError()).toBeImmutable();

        expect(recordUi.getWiredError()).toEqual(mockError);
        expect(recordUi.getWiredError()).toBeImmutable();
    });
});

describe('deleteRecord - errors', () => {
    it('throws error for invalid recordId', async () => {
        const recordId = 'InvalidId';
        let error;
        try {
            await deleteRecord(recordId);
            fail("deleteRecord should've thrown");
        } catch (e) {
            error = e;
        }

        expect(error).toEqual(
            jasmine.objectContaining({
                message: 'Invalid config for "deleteRecord"',
            })
        );
    });

    it('rejects when server returns an error', async () => {
        const recordId = '005B00000029o0qIAA';
        const mockError = getMock('delete-record-error');

        mockDeleteRecordNetwork(recordId, { reject: true, data: { body: mockError } });

        let error;
        try {
            await deleteRecord(recordId);
            fail("deleteRecord should've thrown");
        } catch (e) {
            error = e;
        }

        expect(error).toContainErrorBody(mockError);
    });

    it('does not evict cache when server returns an error', async () => {
        const mockRecord = getMock('record-Opportunity-fields-Opportunity.FiscalYear');
        const recordId = mockRecord.id;

        const config = {
            recordId: mockRecord.id,
            fields: ['Opportunity.FiscalYear'],
        };

        mockGetRecordNetwork(config, mockRecord);

        const mockError = getMock('delete-record-error');
        mockDeleteRecordNetwork(recordId, { reject: true, data: mockError });

        // populate cache
        await setupElement(config, RecordFields);

        try {
            await deleteRecord(recordId);
            fail("deleteRecord should've thrown");
        } catch (e) {
            // delete record fails
        }

        // record still exists in cache
        const element = await setupElement(config, RecordFields);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecord);
    });
});
