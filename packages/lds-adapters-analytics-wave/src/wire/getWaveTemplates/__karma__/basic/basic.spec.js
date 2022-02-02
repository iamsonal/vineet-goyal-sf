import timekeeper from 'timekeeper';
import GetWaveTemplates from '../lwc/get-wave-templates';

import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetWaveTemplatesNetworkOnce,
    mockGetWaveTemplatesNetworkErrorOnce,
} from 'analytics-wave-test-util';

const TTL = 300000; // from luvio.raml
const MOCK_PREFIX = 'wire/getWaveTemplates/__karma__/data/';

function getMock(filename) {
    return globalGetMock(`${MOCK_PREFIX}${filename}`);
}

describe('basic', () => {
    it('gets templates', async () => {
        const mock = getMock('all-templates');
        const config = {};
        mockGetWaveTemplatesNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplates);
        expect(el.pushCount()).toEqual(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    ['CreateApp', 'ManageableOnly', 'ViewOnly'].forEach((options) => {
        it(`gets templates by ${options} options`, async () => {
            const mock = getMock('all-templates');
            const config = { options };
            mockGetWaveTemplatesNetworkOnce(config, mock);

            const el = await setupElement(config, GetWaveTemplates);
            expect(el.pushCount()).toEqual(1);
            expect(el.getWiredData()).toEqual(mock);
        });
    });

    ['App', 'Dashboard', 'Data', 'EmbeddedApp', 'Lens'].forEach((type) => {
        it(`gets templates by ${type} type`, async () => {
            const mock = getMock('app-templates');
            const config = { type };
            mockGetWaveTemplatesNetworkOnce(config, mock);

            const el = await setupElement(config, GetWaveTemplates);
            expect(el.pushCount()).toEqual(1);
            expect(el.getWiredData()).toEqual(mock);
        });
    });

    it('gets templates by options and type', async () => {
        const mock = getMock('app-templates');
        const config = { options: 'ViewOnly', type: 'App' };
        mockGetWaveTemplatesNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplates);
        expect(el.pushCount()).toEqual(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('all-templates');
        const config = {};
        mockGetWaveTemplatesNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplates);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetWaveTemplates);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock1 = getMock('app-templates');
        const mock2 = getMock('all-templates');
        const config = { templateIdOrApiName: mock1.id };
        mockGetWaveTemplatesNetworkOnce(config, [mock1, mock2]);

        const el1 = await setupElement(config, GetWaveTemplates);
        expect(el1.pushCount()).toEqual(1);
        expect(el1.getWiredData()).toEqual(mock1);

        // go past cache ttl
        timekeeper.travel(Date.now() + TTL + 1);
        const el2 = await setupElement(config, GetWaveTemplates);
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
        const config = {};
        mockGetWaveTemplatesNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplates);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);
    });
});
