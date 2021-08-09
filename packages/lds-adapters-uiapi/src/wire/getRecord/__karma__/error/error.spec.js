import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireRecords, mockGetRecordNetwork } from 'uiapi-test-util';

import RecordFields from '../lwc/record-fields';

const MOCK_PREFIX = 'wire/getRecord/__karma__/error/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('getRecord errors', () => {
    it('should propagate error when server returns 500', async () => {
        const errorMock = getMock('record-Opportunity-fields-NoExistEntity');
        const config = {
            recordId: 'a07B0000002MTICIA4', // record id doesn't matter, we are throwing
            fields: ['NoExistEntity'],
        };
        mockGetRecordNetwork(config, { reject: true, data: { body: errorMock } });

        const element = await setupElement(config, RecordFields);

        expect(element.getWiredError()).toContainErrorBody(errorMock);
    });

    it('should emit error when server returns bad request', async () => {
        const errorMock = getMock('record-Opportunity-MissingColumn');
        const config = {
            recordId: 'a07B0000002MTICIA4', // record id doesn't matter, we are throwing
            fields: ['Opportunity.Name', 'Opportunity.NoExist'],
        };
        mockGetRecordNetwork(config, { reject: true, data: { body: errorMock } });

        const element = await setupElement(config, RecordFields);

        expect(element.getWiredError()).toContainErrorBody(errorMock);
    });

    it('should not propagate error when re-requesting record returns error', async () => {
        const recordMock = getMock('record-Opportunity-fields-Opportunity.Name');
        const recordConfig = {
            recordId: recordMock.id,
            fields: ['Opportunity.Name'],
        };
        mockGetRecordNetwork(recordConfig, recordMock);

        const errorMock = getMock('record-Opportunity-MissingColumn');
        const errorConfig = {
            recordId: recordMock.id,
            fields: ['Opportunity.Foo'],
        };
        mockGetRecordNetwork(errorConfig, { reject: true, data: { body: errorMock } });

        const wireA = await setupElement(recordConfig, RecordFields);
        const error = await setupElement(errorConfig, RecordFields);

        // wireA should not have received new data
        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(recordMock);
        expect(error.getWiredError()).toContainErrorBody(errorMock);
    });

    it('should cause a cache hit when a record is queried after server returned 404', async () => {
        const recordMock = getMock('record-Opportunity-fields-Opportunity.Name');
        const mockError = {
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

        const config = {
            recordId: recordMock.id,
            fields: ['Opportunity.Name'],
        };

        mockGetRecordNetwork(config, [
            {
                reject: true,
                data: mockError,
            },
        ]);

        const elm = await setupElement(config, RecordFields);
        expect(elm.getWiredError()).toEqual(mockError);
        expect(elm.getWiredError()).toBeImmutable();

        const secondElm = await setupElement(config, RecordFields);
        expect(secondElm.getWiredError()).toEqual(mockError);
        expect(elm.getWiredError()).toBeImmutable();
    });

    it('should refetch record when ingested record error TTLs out', async () => {
        const recordMock = getMock('record-Opportunity-fields-Opportunity.Name');
        const mockError = {
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

        const config = {
            recordId: recordMock.id,
            fields: ['Opportunity.Name'],
        };

        mockGetRecordNetwork(config, [
            {
                reject: true,
                data: mockError,
            },
            recordMock,
        ]);

        const elm = await setupElement(config, RecordFields);
        expect(elm.getWiredError()).toEqualSnapshotWithoutEtags(mockError);

        expireRecords();
        const secondElm = await setupElement(config, RecordFields);
        expect(secondElm.getWiredError()).toBeUndefined();
        expect(secondElm.getWiredData()).toEqualSnapshotWithoutEtags(recordMock);
    });
});
