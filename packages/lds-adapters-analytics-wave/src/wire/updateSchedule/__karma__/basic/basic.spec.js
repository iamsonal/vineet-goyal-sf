import { updateSchedule } from 'lds-adapters-analytics-wave';
import { getMock as globalGetMock } from 'test-util';
import {
    mockUpdateScheduleNetworkOnce,
    mockUpdateScheduleNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/getSchedule/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('updates a recipe with minutely schedule', async () => {
        const mock = getMock('schedule-recipe-minutely');
        const config = {
            assetId: mock.assetId,
            schedule: {
                frequency: 'minutely',
                daysOfWeek: ['Monday'],
                lastHour: 2,
                minutelyInterval: 30,
                time: {
                    hour: 1,
                    minute: 0,
                    timeZone: 'America/Los_Angeles',
                },
            },
        };
        mockUpdateScheduleNetworkOnce(config, mock);

        const data = await updateSchedule(config);

        expect(data).toEqualWithExtraNestedData(mock);
    });

    it('updates a recipe with hourly schedule', async () => {
        const mock = getMock('schedule-recipe-hourly');
        const config = {
            assetId: mock.assetId,
            schedule: {
                frequency: 'hourly',
                daysOfWeek: ['Thursday', 'Tuesday'],
                hourlyInterval: 24,
                time: {
                    hour: 1,
                    minute: 0,
                    timeZone: 'America/Los_Angeles',
                },
            },
        };
        mockUpdateScheduleNetworkOnce(config, mock);

        const data = await updateSchedule(config);

        expect(data).toEqualWithExtraNestedData(mock);
    });

    it('updates a recipe with weekly schedule', async () => {
        const mock = getMock('schedule-recipe-weekly');
        const config = {
            assetId: mock.assetId,
            schedule: {
                frequency: 'weekly',
                daysOfWeek: ['Monday'],
                time: {
                    hour: 1,
                    minute: 0,
                    timeZone: 'America/Los_Angeles',
                },
            },
        };
        mockUpdateScheduleNetworkOnce(config, mock);

        const data = await updateSchedule(config);

        expect(data).toEqualWithExtraNestedData(mock);
    });

    it('updates a recipe with monthly relative schedule', async () => {
        const mock = getMock('schedule-recipe-monthly-relative');
        const config = {
            assetId: mock.assetId,
            schedule: {
                frequency: 'monthlyrelative',
                weekInMonth: 'First',
                dayInWeek: 'Sunday',
                time: {
                    hour: 1,
                    minute: 0,
                    timeZone: 'America/Los_Angeles',
                },
            },
        };
        mockUpdateScheduleNetworkOnce(config, mock);

        const data = await updateSchedule(config);

        expect(data).toEqualWithExtraNestedData(mock);
    });

    it('updates a recipe with monthly specific schedule', async () => {
        const mock = getMock('schedule-recipe-monthly-specific');
        const config = {
            assetId: mock.assetId,
            schedule: {
                frequency: 'monthly',
                daysOfMonth: [1, 2, 5],
                time: {
                    hour: 14,
                    minute: 30,
                    timeZone: 'America/Los_Angeles',
                },
            },
        };
        mockUpdateScheduleNetworkOnce(config, mock);

        const data = await updateSchedule(config);

        expect(data).toEqualWithExtraNestedData(mock);
    });

    it('updates a recipe with event-based schedule', async () => {
        const mock = getMock('schedule-recipe-event-based');
        const config = {
            assetId: mock.assetId,
            schedule: {
                triggerRule: '$ALL_SALESFORCE_OBJECTS',
                frequency: 'eventdriven',
            },
        };
        mockUpdateScheduleNetworkOnce(config, mock);

        const data = await updateSchedule(config);

        expect(data).toEqualWithExtraNestedData(mock);
    });

    it('clears the schedule on a recipe', async () => {
        const mock = getMock('schedule-recipe-cleared');
        const config = {
            assetId: mock.assetId,
            schedule: {},
        };
        mockUpdateScheduleNetworkOnce(config, mock);

        const data = await updateSchedule(config);

        expect(data).toEqualWithExtraNestedData(mock);
    });

    it('displays error when network request 404s', async () => {
        const mock = {
            assetId: '05vRM00000003rZYAQ',
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
        const config = {
            assetId: '05vRM00000003rZYAQ',
            schedule: {
                frequency: 'weekly',
                daysOfWeek: ['Monday'],
                time: {
                    hour: 1,
                    minute: 0,
                    timeZone: 'America/Los_Angeles',
                },
            },
        };
        mockUpdateScheduleNetworkErrorOnce(config, mock);

        try {
            await updateSchedule(config);
            // make sure we are hitting the catch
            fail('updateSchedule did not throw');
        } catch (e) {
            expect(e).toContainErrorResponse(mock);
        }
    });
});
