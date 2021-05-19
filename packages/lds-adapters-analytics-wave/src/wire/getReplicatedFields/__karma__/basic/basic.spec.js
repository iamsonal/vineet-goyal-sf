import GetReplicatedFields from '../lwc/get-replicated-fields';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetReplicatedFieldsNetworkOnce,
    mockGetReplicatedFieldsNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getReplicatedFields/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets replicated dataset fields', async () => {
        const mock = getMock('replicated-fields');
        const replicatedDatasetMock = getMock('replicated-dataset');
        const config = { id: replicatedDatasetMock.id };
        mockGetReplicatedFieldsNetworkOnce(config, mock);

        const el = await setupElement(
            { replicatedDatasetId: replicatedDatasetMock.id },
            GetReplicatedFields
        );
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('replicated-fields');
        const replicatedDatasetMock = getMock('replicated-dataset');
        const config = { id: replicatedDatasetMock.id };
        mockGetReplicatedFieldsNetworkOnce(config, mock);

        const el = await setupElement(
            { replicatedDatasetId: replicatedDatasetMock.id },
            GetReplicatedFields
        );
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(
            { replicatedDatasetId: replicatedDatasetMock.id },
            GetReplicatedFields
        );
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            id: '0IuS70000004CqXKAU',
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
        const config = { id: mock.id };
        mockGetReplicatedFieldsNetworkErrorOnce(config, mock);

        const el = await setupElement({ replicatedDatasetId: mock.id }, GetReplicatedFields);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const mock = {
            id: '0IuS70000004CqXKAU',
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
        const config = { id: mock.id };
        mockGetReplicatedFieldsNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement({ replicatedDatasetId: mock.id }, GetReplicatedFields);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement({ replicatedDatasetId: mock.id }, GetReplicatedFields);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});