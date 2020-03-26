import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireObjectInfo, mockGetObjectInfoNetwork } from 'uiapi-test-util';
import { refresh } from 'lds';

import ObjectBasic from '../lwc/object-basic';

const MOCK_PREFIX = 'wire/getObjectInfo/__karma__/error/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('getObjectInfo - fetch errors', () => {
    it('should emit network error to component', async () => {
        const mockError = getMock('object-error');

        const config = { objectApiName: 'Invalid' };
        mockGetObjectInfoNetwork(config, { reject: true, data: mockError });

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toBeUndefined();
        expect(element.getWiredError()).toContainErrorResponse(mockError);
    });

    it('should resolve with correct data when an error is refreshed', async () => {
        const mock = getMock('object-Account');
        const mockError = getMock('object-error');

        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, [
            {
                reject: true,
                data: mockError,
            },
            mock,
        ]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorResponse(mockError);

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
                data: mockError,
            },
        ]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);

        try {
            await element.refresh();
            fail();
        } catch (e) {
            expect(e).toContainErrorResponse(mockError);
        }
    });

    it('should be a cache hit when ingested 404 does not exceed ttl', async () => {
        const mockError = getMock('object-error');

        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            reject: true,
            data: mockError,
        });

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorResponse(mockError);

        const elementB = await setupElement(config, ObjectBasic);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toContainErrorResponse(mockError);
    });

    it('should not emit when refetching objectInfo returns the same error after ingested error TTLs out', async () => {
        const mockError = getMock('object-error');

        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, [
            {
                status: 404,
                statusText: 'Not Found',
                ok: false,
                reject: true,
                data: mockError,
            },
            {
                status: 404,
                statusText: 'Not Found',
                ok: false,
                reject: true,
                data: mockError,
            },
        ]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorResponse(mockError);

        expireObjectInfo();

        const elementB = await setupElement(config, ObjectBasic);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toContainErrorResponse(mockError);

        // First element should not have received new error
        expect(element.pushCount()).toBe(1);
    });

    it('should refresh when ingested error exceeds ttl', async () => {
        const mock = getMock('object-Account');
        const mockError = getMock('object-error');

        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, [
            {
                status: 404,
                statusText: 'Not Found',
                ok: false,
                reject: true,
                data: mockError,
            },
            mock,
        ]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorResponse(mockError);

        expireObjectInfo();

        const elementB = await setupElement(config, ObjectBasic);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toBeUndefined();
        expect(elementB.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    // TODO: Implement error snapshot subscription
    xit('should emit error when refresh results in error', async () => {
        const mock = getMock('object-Account');
        const mockError = getMock('object-error');

        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, [
            mock,
            {
                reject: true,
                data: mockError,
            },
        ]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);

        try {
            await element.refresh();
            fail();
        } catch (e) {
            expect(element.getWiredError()).toContainErrorResponse(mockError);
        }
    });

    // TODO: Once a component receives an error, we DO NOT ever provision another
    // value for the component. This matches existing 222 behavior, but we should
    // investigate enabling this.
    xit('should emit correct object when error is refreshed', async () => {
        const mock = getMock('object-Account');
        const mockError = getMock('object-error');

        const config = { objectApiName: 'Account' };
        mockGetObjectInfoNetwork(config, [
            {
                reject: true,
                data: mockError,
            },
            mock,
        ]);

        const element = await setupElement(config, ObjectBasic);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toEqual(mockError);
        expect(element.getWiredError()).toBeImmutable();

        const refreshed = await refresh(element.getWiredError());

        expect(refreshed).toBeUndefined();

        // New push
        expect(element.pushCount()).toBe(2);

        // Should not have an error
        expect(element.getWiredError()).toBeUndefined();

        // Should have new data
        expect(element.getData()).toEqualSnapshotWithoutEtags(mock);
    });
});
