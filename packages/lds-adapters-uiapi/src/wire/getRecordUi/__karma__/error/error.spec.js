import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireRecordUi, mockGetRecordUiNetwork } from 'uiapi-test-util';

import RecordUi from '../lwc/record-ui';

const MOCK_PREFIX = 'wire/getRecordUi/__karma__/error/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('record-ui error responses', () => {
    it('should emit error when server returns error', async () => {
        const mockError = getMock('single-record-invalid-layouttype-modes-View');
        const config = {
            recordIds: 'a07B0000002MTICIA4', // record id doesn't matter
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(config, { reject: true, data: mockError });

        const wireA = await setupElement(config, RecordUi);

        expect(wireA.getWiredError()).toContainErrorResponse(mockError);
    });

    it('should cause a cache hit when a recordUi is queried after server returned 404', async () => {
        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];
        const config = {
            recordIds: 'a07B0000002MTICIA4', // record id doesn't matter
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(config, {
            reject: true,
            status: 404,
            statusText: 'Not Found',
            ok: false,
            data: mockError,
        });

        const expectedError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: mockError,
        };

        const elm = await setupElement(config, RecordUi);
        expect(elm.getWiredError()).toEqualSnapshotWithoutEtags(expectedError);

        const secondElm = await setupElement(config, RecordUi);
        expect(secondElm.getWiredError()).toEqualSnapshotWithoutEtags(expectedError);
    });

    it('should refetch recordUi when ingested error TTLs out', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];
        const config = {
            recordIds: Object.keys(mockData.records)[0],
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mockError,
            },
            mockData,
        ]);

        const expectedError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: mockError,
        };

        const elm = await setupElement(config, RecordUi);
        expect(elm.getWiredError()).toEqualSnapshotWithoutEtags(expectedError);

        expireRecordUi();

        const secondElm = await setupElement(config, RecordUi);
        expect(secondElm.getWiredError()).toBeUndefined();
        expect(secondElm.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('should not emit when refetching recordUi responding with the same error after ingested error TTLs out', async () => {
        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];
        const config = {
            recordIds: 'a07B0000002MTICIA4', // record id doesn't matter
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mockError,
            },
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mockError,
            },
        ]);

        const expectedError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: mockError,
        };

        const elm = await setupElement(config, RecordUi);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredError()).toEqualSnapshotWithoutEtags(expectedError);

        expireRecordUi();

        const secondElm = await setupElement(config, RecordUi);
        expect(secondElm.pushCount()).toBe(1);
        expect(secondElm.getWiredError()).toEqualSnapshotWithoutEtags(expectedError);

        // verify no new emit to elm
        expect(elm.pushCount()).toBe(1);
    });
});
