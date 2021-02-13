import GetDatasets from '../lwc/get-datasets';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetDatasetsNetworkOnce,
    mockGetDatasetsNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getDatasets/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets datasets', async () => {
        const mock = getMock('datasets');
        const config = {};
        mockGetDatasetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets datasets by scope', async () => {
        const mock = getMock('datasets-scope');
        const config = { scope: 'CreatedByMe' };
        mockGetDatasetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets datasets with folderId and search', async () => {
        const mock = getMock('datasets-folderId-search');
        const config = { folderId: mock.datasets[0].folder.id, q: 'Opportunities' };
        mockGetDatasetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets datasets with folderId, page and pageSize', async () => {
        const mock = getMock('datasets-page');
        const config = {
            folderId: mock.datasets[0].folder.id,
            // this simulates fetching a 2nd page (this is a base64-encoded json with the various query params in it,
            // generated by the server in the nextPageUrl on the previous response)
            page:
                'eyJwYWdlU2l6ZSI6MiwibGFzdElkIjoiMEZieHgwMDAwMDA0Q3g1Q0FFIiwibGFzdE5hbWUiOiJRdW90YV9SZWdpb24iLCJmb2xkZXJJZCI6IjAwbHh4MDAwMDAwajlUQkFBWSIsIm90aGVyUGFyYW1ldGVycyI6eyJoYXNDdXJyZW50T25seSI6ImZhbHNlIn0sImRhdGFzZXRTb3J0T3JkZXIiOiJNUlUifQ==',
            pageSize: 2,
        };
        mockGetDatasetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('datasets');
        const config = {};
        mockGetDatasetsNetworkOnce(config, mock);

        const el = await setupElement(config, GetDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetDatasets);
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
        mockGetDatasetsNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetDatasets);
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
        mockGetDatasetsNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetDatasets);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetDatasets);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});