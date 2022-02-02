import timekeeper from 'timekeeper';
import GetWaveTemplateReleaseNotes from '../lwc/get-wave-template-release-notes';

import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetWaveTemplateReleaseNotesNetworkOnce,
    mockGetWaveTemplateReleaseNotesNetworkErrorOnce,
} from 'analytics-wave-test-util';

const TTL = 300000; // from luvio.raml
const MOCK_PREFIX = 'wire/getWaveTemplateReleaseNotes/__karma__/data/';

function getMock(filename) {
    return globalGetMock(`${MOCK_PREFIX}${filename}`);
}

describe('basic', () => {
    ['with-nulls', 'full'].forEach((filename) => {
        it(`gets ${filename} by id`, async () => {
            const mock = getMock(filename);
            const config = { templateIdOrApiName: mock.id };
            mockGetWaveTemplateReleaseNotesNetworkOnce(config, mock);

            const el = await setupElement(config, GetWaveTemplateReleaseNotes);
            expect(el.pushCount()).toEqual(1);
            expect(el.getWiredData()).toEqual(mock);
        });
    });

    it('does not fetch a second time by id', async () => {
        const mock = getMock('full');
        const config = { templateIdOrApiName: mock.id };
        mockGetWaveTemplateReleaseNotesNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplateReleaseNotes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetWaveTemplateReleaseNotes);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('gets by name', async () => {
        const mock = getMock('full');
        const config = { templateIdOrApiName: `${mock.namespace}__${mock.name}` };
        mockGetWaveTemplateReleaseNotesNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplateReleaseNotes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time by name', async () => {
        const mock = getMock('full');
        const config = { templateIdOrApiName: `${mock.namespace}__${mock.name}` };
        mockGetWaveTemplateReleaseNotesNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplateReleaseNotes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetWaveTemplateReleaseNotes);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('does not fetch a second time by name (case-insensitive)', async () => {
        const mock = getMock('full');
        const config = { templateIdOrApiName: `${mock.namespace}__${mock.name}` };
        mockGetWaveTemplateReleaseNotesNetworkOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplateReleaseNotes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(
            { templateIdOrApiName: config.templateIdOrApiName.toUpperCase() },
            GetWaveTemplateReleaseNotes
        );
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('does not fetch by name after fetching by id', async () => {
        const mock = getMock('with-nulls');
        mockGetWaveTemplateReleaseNotesNetworkOnce({ templateIdOrApiName: mock.id }, mock);

        const el = await setupElement(
            { templateIdOrApiName: mock.id },
            GetWaveTemplateReleaseNotes
        );
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(
            { templateIdOrApiName: mock.name },
            GetWaveTemplateReleaseNotes
        );
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);

        const el3 = await setupElement(
            { templateIdOrApiName: mock.name.toUpperCase() },
            GetWaveTemplateReleaseNotes
        );
        expect(el3.pushCount()).toBe(1);
        expect(el3.getWiredData()).toEqual(mock);
    });

    it('does not fetch by id after fetching by name', async () => {
        const mock = getMock('with-nulls');
        mockGetWaveTemplateReleaseNotesNetworkOnce({ templateIdOrApiName: mock.name }, mock);

        const el = await setupElement(
            { templateIdOrApiName: mock.name },
            GetWaveTemplateReleaseNotes
        );
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(
            { templateIdOrApiName: mock.id },
            GetWaveTemplateReleaseNotes
        );
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mock1 = getMock('full');
        const mock2 = { ...mock1, notes: 'Some other release notes text' };
        const config = { templateIdOrApiName: mock1.id };
        mockGetWaveTemplateReleaseNotesNetworkOnce(config, [mock1, mock2]);

        const el1 = await setupElement(config, GetWaveTemplateReleaseNotes);
        expect(el1.pushCount()).toEqual(1);
        expect(el1.getWiredData()).toEqual(mock1);

        // go past cache ttl
        timekeeper.travel(Date.now() + TTL + 1);
        const el2 = await setupElement(config, GetWaveTemplateReleaseNotes);
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
        mockGetWaveTemplateReleaseNotesNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplateReleaseNotes);
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
        mockGetWaveTemplateReleaseNotesNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetWaveTemplateReleaseNotes);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredError()).toEqual(mock);

        const el2 = await setupElement(config, GetWaveTemplateReleaseNotes);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredError()).toEqual(mock);
    });
});
