import WiredExecuteQuery from '../lwc/wired';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockExecuteQueryNetworkOnce,
    mockExecuteQueryNetworkErrorOnce,
} from 'analytics-wave-test-util';

const MOCK_PREFIX = 'wire/executeQuery/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('wired', () => {
    [
        { mockname: 'saql-results' }, // defaults to Saql in the server logic
        { mockname: 'saql-results', queryLanguage: 'Saql' },
        { mockname: 'sql-results', queryLanguage: 'Sql' },
        { mockname: 'sql-live-results', queryLanguage: 'Sql' },
    ].forEach(({ mockname, queryLanguage }) => {
        it(`executes ${queryLanguage ||
            'default'} query with results from ${mockname}.json`, async () => {
            const mock = getMock(mockname);
            const query = { query: mock.query, queryLanguage };
            mockExecuteQueryNetworkOnce({ query }, mock);

            const el = await setupElement({ query }, WiredExecuteQuery);

            expect(el.getWiredData()).toEqual(mock);
            expect(el.pushCount()).toBe(1);
        });
    });

    it('does not issue network request on config with undefined query', async () => {
        const element = await setupElement({}, WiredExecuteQuery);

        expect(element.pushCount()).toBe(0);
    });

    it('does not fetch a second time', async () => {
        const mock = getMock('saql-results');
        const query = { query: mock.query };
        mockExecuteQueryNetworkOnce({ query }, mock);

        const el = await setupElement({ query }, WiredExecuteQuery);

        expect(el.getWiredData()).toEqual(mock);
        expect(el.pushCount()).toBe(1);

        const el2 = await setupElement({ query }, WiredExecuteQuery);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('does fetch a second time with different params', async () => {
        let mock = getMock('saql-results');
        let query = { query: mock.query };
        mockExecuteQueryNetworkOnce({ query }, mock);
        const el = await setupElement({ query }, WiredExecuteQuery);
        expect(el.getWiredData()).toEqual(mock);
        expect(el.pushCount()).toBe(1);

        query = { query: mock.query, timezone: 'America/Los_Angeles' };
        mockExecuteQueryNetworkOnce({ query }, mock);
        const el2 = await setupElement({ query }, WiredExecuteQuery);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredData()).toEqual(mock);
    });

    it('displays error when network request 400s', async () => {
        // this simulates an invalid SAQL expression passed in
        const mock = {
            ok: false,
            status: 400,
            statusText: 'BAD_REQUEST',
            body: [
                {
                    errorCode: '119',
                    message:
                        'Operation EXPR requires a variable assignment, otherwise it is dead code (the result of the operation is lost).',
                },
            ],
        };
        const query = { query: 'Bad query;' };
        mockExecuteQueryNetworkErrorOnce({ query }, mock);

        const el = await setupElement({ query }, WiredExecuteQuery);
        expect(el.getWiredError()).toEqual(mock);
        expect(el.pushCount()).toBe(1);
    });
});
