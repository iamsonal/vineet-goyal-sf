import GetXmd from '../lwc/get-xmd';
import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetXmdNetworkOnce, mockGetXmdNetworkErrorOnce } from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getXmd/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function getIdsFromMock(xmd) {
    // the datasetId and versionId for an Xmd is only in the url in the json, so pull it from there.
    const m = xmd.url.match(new RegExp('/datasets/([^/])+/versions/([^/]+)/xmds'));
    return { datasetId: m[1], versionId: m[2] };
}

describe('basic', () => {
    [
        { filename: 'xmd-user-empty' },
        { filename: 'xmd-user' },
        { filename: 'opportunity_products_user_xmd' },
        { filename: 'pipeline_trending_system_xmd', xmdType: 'System' },
    ].forEach(({ filename, xmdType }) => {
        it(`gets ${filename} by dataset id`, async () => {
            const mock = getMock(filename);
            const { datasetId, versionId } = getIdsFromMock(mock);
            mockGetXmdNetworkOnce(
                {
                    datasetIdOrApiName: datasetId,
                    versionId,
                    xmdType: xmdType || 'User',
                },
                mock
            );

            const el = await setupElement(
                { idOrApiName: datasetId, versionId, xmdType: xmdType || 'User' },
                GetXmd
            );
            expect(el.pushCount()).toBe(1);
            expect(el.getWiredData()).toEqual(mock);
        });
    });

    it('gets xmd by dataset name', async () => {
        const mock = getMock('xmd-system');
        const { versionId } = getIdsFromMock(mock);
        mockGetXmdNetworkOnce(
            {
                // the dataset name is not in the response json
                datasetIdOrApiName: 'ABCWidgetSales2017',
                versionId,
                xmdType: 'System',
            },
            mock
        );

        const el = await setupElement(
            { idOrApiName: 'ABCWidgetSales2017', versionId, xmdType: 'System' },
            GetXmd
        );
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('xmd-system2');
        const { datasetId, versionId } = getIdsFromMock(mock);
        mockGetXmdNetworkOnce(
            { datasetIdOrApiName: datasetId, versionId, xmdType: 'System' },
            mock
        );

        const params = { idOrApiName: datasetId, versionId, xmdType: 'System' };
        const el = await setupElement(params, GetXmd);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(params, GetXmd);
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
        mockGetXmdNetworkErrorOnce(
            { datasetIdOrApiName: 'foo', versionId: 'bar', xmdType: 'System' },
            mock
        );

        const el = await setupElement(
            { idOrApiName: 'foo', versionId: 'bar', xmdType: 'System' },
            GetXmd
        );
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
        mockGetXmdNetworkOnce({ datasetIdOrApiName: 'foo', versionId: 'bar', xmdType: 'System' }, [
            {
                reject: true,
                status: 404,
                statusText: 'Not Found',
                ok: false,
                data: mock,
            },
        ]);

        const params = { idOrApiName: 'foo', versionId: 'bar', xmdType: 'System' };
        const el = await setupElement(params, GetXmd);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(params, GetXmd);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
