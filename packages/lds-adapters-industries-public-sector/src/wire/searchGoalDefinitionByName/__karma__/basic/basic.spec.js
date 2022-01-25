import SearchGoalDefinitionByName from '../lwc/search-goal-definition-by-name';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockSearchGoalDefinitionByNameNetworkOnce,
    mockSearchGoalDefinitionByNameNetworkErrorOnce,
    expireSearchData,
} from 'industries-public-sector-test-util';
const MOCK_PREFIX = 'wire/searchGoalDefinitionByName/__karma__/data/';
const MOCK_SEARCH_GOAL_DEFINITIONS_EMPTY_JSON = 'searchGoalDefinitionByNameEmpty';
const MOCK_SEARCH_GOAL_DEFINITIONS_JSON = 'searchGoalDefinitionByName';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}
describe('basic', () => {
    it('fetches search result Goal Definitions successfully using a valid configuration', async () => {
        const mock = getMock(MOCK_SEARCH_GOAL_DEFINITIONS_JSON);
        const config = {
            query: {
                searchKey: 'Goal1',
            },
        };
        mockSearchGoalDefinitionByNameNetworkOnce(config, mock);
        const el = await setupElement(config.query, SearchGoalDefinitionByName);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredGoalDefinitions())).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock(MOCK_SEARCH_GOAL_DEFINITIONS_JSON);
        const config = {
            query: {
                searchKey: 'Goal1',
            },
        };

        // Mock network request once only
        mockSearchGoalDefinitionByNameNetworkOnce(config, mock);

        const el = await setupElement(config.query, SearchGoalDefinitionByName);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredGoalDefinitions()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(config.query, SearchGoalDefinitionByName);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredGoalDefinitions()).toEqual(mock);
    });

    it('makes two network calls when time elapsed > TTL', async () => {
        const mock = getMock(MOCK_SEARCH_GOAL_DEFINITIONS_JSON);
        const config = {
            query: {
                searchKey: 'Goal1',
            },
        };
        mockSearchGoalDefinitionByNameNetworkOnce(config, [mock, mock]);

        const el1 = await setupElement(config.query, SearchGoalDefinitionByName);

        expect(el1.pushCount()).toBe(1);
        expect(el1.getWiredGoalDefinitions()).toEqualSnapshotWithoutEtags(mock);

        expireSearchData();

        const el2 = await setupElement(config.query, SearchGoalDefinitionByName);

        // el2 should not have received new value
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredGoalDefinitions()).toEqualSnapshotWithoutEtags(mock);
    });

    it('fetches search results successfully with no items', async () => {
        const mock = getMock(MOCK_SEARCH_GOAL_DEFINITIONS_EMPTY_JSON);
        const config = {
            query: {
                searchKey: 'NoGOAL',
            },
        };
        mockSearchGoalDefinitionByNameNetworkOnce(config, mock);
        const el = await setupElement(config.query, SearchGoalDefinitionByName);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredGoalDefinitions())).toEqual(mock);
    });

    it('displays error when network request 404s', async () => {
        const config = { query: {} };
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
        mockSearchGoalDefinitionByNameNetworkErrorOnce(config, mock);
        const el = await setupElement(config.query, SearchGoalDefinitionByName);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
