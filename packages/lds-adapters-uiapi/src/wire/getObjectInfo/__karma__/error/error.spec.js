import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireObjectInfo, mockGetObjectInfoNetwork } from 'uiapi-test-util';

import ObjectBasic from '../lwc/object-basic';

const MOCK_PREFIX = 'wire/getObjectInfo/__karma__/error/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('getObjectInfo - fetch errors', () => {
    it('should emit network error to component', async () => {
        const mockError = getMock('object-error');

        const config = { objectApiName: 'Invalid' };
        mockGetObjectInfoNetwork(config, { reject: true, data: { body: mockError } });

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toBeUndefined();
        expect(element.getWiredError()).toContainErrorBody(mockError);
    });

    it('should resolve with correct data when an error is refreshed', async () => {
        const mock = getMock('object-Account');
        const mockError = getMock('object-error');

        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, [
            {
                reject: true,
                data: { body: mockError },
            },
            mock,
        ]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorBody(mockError);

        const refreshed = await element.refresh();

        expect(refreshed).toBeUndefined();
    });

    it('should reject when refresh results in an error', async () => {
        const mock = getMock('object-Account');
        const mockError = getMock('object-error');

        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, [
            mock,
            {
                reject: true,
                data: { body: mockError },
            },
        ]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);

        try {
            await element.refresh();
            fail();
        } catch (e) {
            expect(e).toContainErrorBody(mockError);
        }
    });

    it('should be a cache hit when ingested 404 does not exceed ttl', async () => {
        const mockError = getMock('object-error');

        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, {
            reject: true,
            data: {
                status: 404,
                statusText: 'Not Found',
                ok: false,
                body: mockError,
            },
        });

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorBody(mockError);

        const elementB = await setupElement(config, ObjectBasic);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toContainErrorBody(mockError);
    });

    it('should not emit when refetching objectInfo returns the same error after ingested error TTLs out', async () => {
        const mockError = getMock('object-error');
        const mockErrorResponse = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: mockError,
        };

        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, [
            {
                reject: true,
                data: mockErrorResponse,
            },
            {
                reject: true,
                data: mockErrorResponse,
            },
        ]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorBody(mockError);

        expireObjectInfo();

        const elementB = await setupElement(config, ObjectBasic);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toContainErrorBody(mockError);

        // First element should not have received new error
        expect(element.pushCount()).toBe(1);
    });

    it('should refresh when ingested error exceeds ttl', async () => {
        const mock = getMock('object-Account');
        const mockError = getMock('object-error');

        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, [
            {
                reject: true,
                data: {
                    status: 404,
                    statusText: 'Not Found',
                    ok: false,
                    body: mockError,
                },
            },
            mock,
        ]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorBody(mockError);

        expireObjectInfo();

        const elementB = await setupElement(config, ObjectBasic);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toBeUndefined();
        expect(elementB.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should emit error when refresh results in error', async () => {
        const mockAccount = getMock('object-Account');
        const mockErrorObject = getMock('object-error');
        const mockError = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: mockErrorObject,
        };

        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, [
            mockAccount,
            {
                reject: true,
                data: mockError,
            },
        ]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        try {
            await element.refresh();
            fail('refresh call is expected to throw when error response is returned.');
        } catch (e) {
            expect(element.getWiredError()).toEqual(mockError);
            expect(element.getWiredError()).toBeImmutable();
        }
    });
});
