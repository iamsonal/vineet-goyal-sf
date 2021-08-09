import GetSchedule from '../lwc/get-schedule';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetScheduleNetworkOnce,
    mockGetScheduleNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getSchedule/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    [
        { mockfilename: 'schedule-recipe-minutely' },
        { mockfilename: 'schedule-recipe-hourly' },
        { mockfilename: 'schedule-recipe-weekly' },
        { mockfilename: 'schedule-recipe-monthly-relative' },
        { mockfilename: 'schedule-recipe-monthly-specific' },
        { mockfilename: 'schedule-recipe-event-based' },
    ].forEach(({ mockfilename }) => {
        it(`gets ${mockfilename}`, async () => {
            const mock = getMock(mockfilename);
            const config = { assetId: mock.assetId };
            mockGetScheduleNetworkOnce(config, mock);

            const el = await setupElement(config, GetSchedule);
            expect(el.pushCount()).toBe(1);
            expect(el.getWiredData()).toEqual(mock);
        });
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('schedule-recipe-hourly');
        const config = { assetId: mock.assetId };
        mockGetScheduleNetworkOnce(config, mock);

        const el = await setupElement(config, GetSchedule);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredData()).toEqual(mock);

        const el2 = await setupElement(config, GetSchedule);
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
        const config = { assetId: '05vRM00000003rZYAQ' };
        mockGetScheduleNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetSchedule);
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
        const config = { assetId: '05vRM00000003rZYAQ' };

        mockGetScheduleNetworkOnce(config, [
            {
                reject: true,
                data: mock,
            },
        ]);

        const el = await setupElement(config, GetSchedule);
        expect(el.getWiredError()).toEqual(mock);
        expect(el.getWiredError()).toBeImmutable();

        const el2 = await setupElement(config, GetSchedule);
        expect(el2.getWiredError()).toEqual(mock);
        expect(el2.getWiredError()).toBeImmutable();
    });
});
