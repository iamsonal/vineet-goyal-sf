import GetReplicatedDatasets from '../lwc/get-replicated-datasets';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetReplicatedDatasetsNetworkOnce,
    mockGetReplicatedDatasetsNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getReplicatedDatasets/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets replicated datasets', async () => {
        const mock = getMock('replicated-datasets');
        const config = {};
        mockGetReplicatedDatasetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetReplicatedDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets replicated datasets with SFDC_REMOTE connector', async () => {
        const mock = getMock('replicated-datasets-sfdc-local-connector');
        const config = { connector: 'SFDC_LOCAL' };
        mockGetReplicatedDatasetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetReplicatedDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets replicated datasets with opportunity source', async () => {
        const mock = getMock('replicated-datasets-opportunity-source');
        const config = { sourceObject: 'Opportunity' };
        mockGetReplicatedDatasetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetReplicatedDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets replicated datasets with input category', async () => {
        const mock = getMock('replicated-datasets-category');
        const config = { category: 'Input' };
        mockGetReplicatedDatasetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetReplicatedDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets replicated datasets with search query param', async () => {
        const mock = getMock('replicated-datasets-opportunity-label');
        const config = { q: 'Oppor' };
        mockGetReplicatedDatasetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetReplicatedDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('replicated-datasets');
        const config = {};
        mockGetReplicatedDatasetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetReplicatedDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetReplicatedDatasets);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
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
        const config = {};
        mockGetReplicatedDatasetsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetReplicatedDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });

    it('should cause a cache hit on query after server returned 404', async () => {
        const mock = {
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
        const config = {};
        mockGetReplicatedDatasetsNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetReplicatedDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetReplicatedDatasets);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
