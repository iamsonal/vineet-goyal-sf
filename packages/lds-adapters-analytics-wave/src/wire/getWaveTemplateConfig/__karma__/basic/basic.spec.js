import timekeeper from 'timekeeper';
import GetWaveTemplateConfig from '../lwc/get-wave-template-config';

import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetWaveTemplateConfigNetworkOnce,
    mockGetWaveTemplateConfigNetworkErrorOnce,
} from 'analytics-wave-test-util';

const TTL = 300000; // from luvio.raml
const MOCK_PREFIX = 'wire/getWaveTemplateConfig/__karma__/data/';

function getMock(filename) {
    return globalGetMock(`${MOCK_PREFIX}${filename}`);
}

describe('basic', () => {
    ['minimal', 'with-nulls', 'full', 'sales-app'].forEach((filename) => {
        it(`gets ${filename} by id`, async () => {
            const mock = getMock(filename);
            const config = { templateIdOrApiName: mock.id };
            mockGetWaveTemplateConfigNetworkOnce(config, mock);

            const el = await setupElement(config, GetWaveTemplateConfig);
            expect(el.pushCount()).toEqual(1);
            expect(el.getWiredData()).toEqual(mock);
        });
    });

    ['CreateApp', 'ManageableOnly', 'ViewOnly'].forEach((options) => {
        it(`gets with options=${options}`, async () => {
            const mock = getMock('full');
            const config = {
                templateIdOrApiName: mock.id,
                options,
                disableApex: options === 'CreateApp',
            };
            mockGetWaveTemplateConfigNetworkOnce(config, mock);

            const el = await setupElement(config, GetWaveTemplateConfig);
            expect(el.pushCount()).toEqual(1);
            expect(el.getWiredData()).toEqual(mock);
        });
    });

    it('does not fetch a second time by id', async () => {
        const mock = getMock('full');
        const config = { templateIdOrApiName: mock.id };
        mockGetWaveTemplateConfigNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplateConfig);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetWaveTemplateConfig);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('gets by name', async () => {
        const mock = getMock('full');
        const config = { templateIdOrApiName: `${mock.namespace}__${mock.name}` };
        mockGetWaveTemplateConfigNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplateConfig);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time by name', async () => {
        const mock = getMock('full');
        const config = { templateIdOrApiName: `${mock.namespace}__${mock.name}` };
        mockGetWaveTemplateConfigNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplateConfig);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetWaveTemplateConfig);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time by name (case-insensitive)', async () => {
        const mock = getMock('full');
        const config = { templateIdOrApiName: `${mock.namespace}__${mock.name}` };
        mockGetWaveTemplateConfigNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplateConfig);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(
            { templateIdOrApiName: config.templateIdOrApiName.toUpperCase() },
            GetWaveTemplateConfig
        );
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('does not fetch by name after fetching by id', async () => {
        const mock = getMock('minimal');
        mockGetWaveTemplateConfigNetworkOnce({ templateIdOrApiName: mock.id }, mock);

        const el = await setupElement({ templateIdOrApiName: mock.id }, GetWaveTemplateConfig);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement({ templateIdOrApiName: mock.name }, GetWaveTemplateConfig);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);

        const el3 = await setupElement(
            { templateIdOrApiName: mock.name.toUpperCase() },
            GetWaveTemplateConfig
        );
        expect(el3.pushCount()).toBe(1);
        expect(el3.getWiredData()).toEqual(mock);
    });

    it('does not fetch by id after fetching by name', async () => {
        const mock = getMock('minimal');
        mockGetWaveTemplateConfigNetworkOnce({ templateIdOrApiName: mock.name }, mock);

        const el = await setupElement({ templateIdOrApiName: mock.name }, GetWaveTemplateConfig);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement({ templateIdOrApiName: mock.id }, GetWaveTemplateConfig);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock1 = getMock('minimal');
        const mock2 = getMock('full');
        const config = { templateIdOrApiName: mock1.id };
        mockGetWaveTemplateConfigNetworkOnce(config, [mock1, mock2]);

        const el1 = await setupElement(config, GetWaveTemplateConfig);
        expect(el1.pushCount()).toEqual(1);
        expect(el1.getWiredData()).toEqual(mock1);

        // go past cache ttl
        timekeeper.travel(Date.now() + TTL + 1);
        const el2 = await setupElement(config, GetWaveTemplateConfig);
        expect(el2.pushCount()).toEqual(1);
        expect(el2.getWiredData()).toEqual(mock2);
    });

    it('displays error when network request 400s', async () => {
        const mock = {
            ok: false,
            status: 400,
            statusText: 'BAD_REQUEST',
            body: [
                {
                    errorCode: 'BAD_REQUEST',
                    message: 'Bad request',
                },
            ],
        };
        const config = { templateIdOrApiName: 'foo' };
        mockGetWaveTemplateConfigNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplateConfig);
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
        const config = { templateIdOrApiName: '0Nkxx0000004FICCA2' };
        mockGetWaveTemplateConfigNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplateConfig);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetWaveTemplateConfig);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
