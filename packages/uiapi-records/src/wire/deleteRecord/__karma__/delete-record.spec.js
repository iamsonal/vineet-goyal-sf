import { getMock as globalGetMock, setupElement } from 'test-util';
import { URL_BASE, mockDeleteRecordNetwork, mockGetRecordNetwork } from 'uiapi-test-util';
import { deleteRecord, karmaNetworkAdapter } from 'lds';

import RecordFields from '../../getRecord/__karma__/lwc/record-fields';

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
            path: `${URL_BASE}/records/${recordId}`,
            method: 'delete',
            urlParams: { recordId },
        };

        expect(karmaNetworkAdapter.firstCall.args[0]).toEqual(jasmine.objectContaining(expected));
    });

    it('emit error to existing wires', async () => {
        const mockRecord = getMock('record-Opportunity-fields-Opportunity.FiscalYear');
        const mockError = getMock('delete-record-not-exist');
        const recordId = mockRecord.id;

        const config = {
            recordId,
            fields: ['FiscalYear'],
        };
        mockGetRecordNetwork(config, [
            mockRecord,
            {
                reject: true,
                status: 404,
                data: mockError,
            },
        ]);
        mockDeleteRecordNetwork(recordId);

        const element = await setupElement(config, RecordFields);

        await deleteRecord(recordId);

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredError()).toEqual({
            status: 404,
            statusText: 'Server Error',
            ok: false,
            body: mockError,
        });

        expect(element.getWiredError()).toBeImmutable();
    });

    it('evicts record from cache', async () => {
        const mockRecord = getMock('record-Opportunity-fields-Opportunity.FiscalYear');
        const mockError = getMock('delete-record-not-exist');
        const recordId = mockRecord.id;

        const config = {
            recordId,
            fields: ['FiscalYear'],
        };
        mockGetRecordNetwork(config, [
            mockRecord,
            {
                reject: true,
                status: 404,
                data: mockError,
            },
        ]);
        mockDeleteRecordNetwork(recordId);

        // populate cache
        const element = await setupElement(config, RecordFields);

        await deleteRecord(recordId);

        // hit network
        expect(element.getWiredError()).toEqual({
            status: 404,
            statusText: 'Server Error',
            ok: false,
            body: mockError,
        });

        expect(element.getWiredError()).toBeImmutable();
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
                message: 'Unexpected parameter, expected a Salesforce Record id.',
            })
        );
    });

    it('rejects when server returns an error', async () => {
        const recordId = '005B00000029o0qIAA';
        const mockError = getMock('delete-record-error');

        mockDeleteRecordNetwork(recordId, { reject: true, data: mockError });

        let error;
        try {
            await deleteRecord(recordId);
            fail("deleteRecord should've thrown");
        } catch (e) {
            error = e;
        }

        expect(error).toContainErrorResponse(mockError);
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
