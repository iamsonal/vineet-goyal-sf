import GetWaveFolders from '../lwc/get-wave-folders';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetWaveFoldersNetworkOnce,
    mockGetWaveFoldersNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getWaveFolders/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets wave folders', async () => {
        const mock = getMock('folders');
        const config = {};
        mockGetWaveFoldersNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveFolders);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets pinned folders', async () => {
        const mock = getMock('folders-pinned');
        const config = { isPinned: true };
        mockGetWaveFoldersNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveFolders);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets folders with scope and sort', async () => {
        const mock = getMock('folders-sort-scope');
        const config = { sort: 'Mru', scope: 'CreatedByMe', pageSize: 3 };
        mockGetWaveFoldersNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveFolders);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets folders with templateSource and mobileOnlyAssets', async () => {
        const mock = getMock('folders-template-mobile');
        const config = {
            templateSourceId: 'sfdc_internal__Learning_Adventure',
            mobileOnlyFeaturedAssets: true,
        };
        mockGetWaveFoldersNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveFolders);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets folders with page token', async () => {
        const mock = getMock('folders-page');
        const config = {
            page:
                'eyJwYWdlU2l6ZSI6Mywic29ydE9yZGVyIjoiTVJVIiwibGFzdElkIjoiMDJJUk0wMDAwMDAwOGtrMkFBIiwibGFzdE5hbWUiOiJhMSIsImxhc3RUaW1lIjoxNTk4MDM2NzEwMDAwLCJvdGhlclBhcmFtZXRlcnMiOnsidGVtcGxhdGVTb3VyY2VJZCI6InNmZGNfaW50ZXJuYWxfX0xlYXJuaW5nX0FkdmVudHVyZSJ9fQ==',
            pageSize: 3,
        };
        mockGetWaveFoldersNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveFolders);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('gets folders with search param', async () => {
        const mock = getMock('folders-search');
        const config = {
            q: 'Learning',
        };
        mockGetWaveFoldersNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveFolders);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('folders');
        const config = {};
        mockGetWaveFoldersNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveFolders);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetWaveFolders);
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
        mockGetWaveFoldersNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetWaveFolders);
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
        mockGetWaveFoldersNetworkOnce(config, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetWaveFolders);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetWaveFolders);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
