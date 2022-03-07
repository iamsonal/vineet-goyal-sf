import SearchActiveBenefitsByName from '../lwc/search-active-benefits-by-name';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    clone,
    mockSearchBenefitsByNameNetworkOnce,
    mockSearchBenefitsByNameNetworkErrorOnce,
    expireSearchData,
} from 'industries-public-sector-test-util';

const MOCK_PREFIX = 'wire/searchActiveBenefitsByName/__karma__/data/';
const MOCK_SEARCH_BENEFITS_EMPTY_JSON = 'searchActiveBenefitsByNameEmpty';
const MOCK_SEARCH_BENEFITS_JSON = 'searchActiveBenefitsByName';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches search result Benefits successfully using a valid configuration', async () => {
        const mock = getMock(MOCK_SEARCH_BENEFITS_JSON);
        const config = {
            query: {
                searchKey: 'benefit-1',
            },
        };
        mockSearchBenefitsByNameNetworkOnce(config, mock);
        const el = await setupElement(config.query, SearchActiveBenefitsByName);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredBenefits())).toEqual(mock);
    });

    it('makes single network call for multiple wire function invocations', async () => {
        const mock = getMock(MOCK_SEARCH_BENEFITS_JSON);
        const config = {
            query: {
                searchKey: 'benefit-1',
            },
        };

        // Mock network request once only
        mockSearchBenefitsByNameNetworkOnce(config, mock);

        const el = await setupElement(config.query, SearchActiveBenefitsByName);
        expect(el.pushCount()).toBe(1);
        expect(el.getWiredBenefits()).toEqual(mock);

        // second element should receive a value from LDS
        // even though it only mocked the network request once
        const el2 = await setupElement(config.query, SearchActiveBenefitsByName);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredBenefits()).toEqual(mock);
    });

    it('makes two network calls when time elapsed > TTL', async () => {
        const mock = getMock(MOCK_SEARCH_BENEFITS_JSON);
        const config = {
            query: {
                searchKey: 'benefit-1',
            },
        };
        mockSearchBenefitsByNameNetworkOnce(config, [mock, mock]);

        const el1 = await setupElement(config.query, SearchActiveBenefitsByName);

        expect(el1.pushCount()).toBe(1);
        expect(el1.getWiredBenefits()).toEqualSnapshotWithoutEtags(mock);

        expireSearchData();

        const el2 = await setupElement(config.query, SearchActiveBenefitsByName);

        // el2 should not have received new value
        expect(el2.pushCount()).toBe(1);
        expect(el2.getWiredBenefits()).toEqualSnapshotWithoutEtags(mock);
    });

    it('fetches search results successfully with no items', async () => {
        const mock = getMock(MOCK_SEARCH_BENEFITS_EMPTY_JSON);
        const config = {
            query: {
                searchKey: 'NoBenefit',
            },
        };
        mockSearchBenefitsByNameNetworkOnce(config, mock);
        const el = await setupElement(config.query, SearchActiveBenefitsByName);
        expect(el.pushCount()).toBe(1);
        expect(clone(el.getWiredBenefits())).toEqual(mock);
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
        mockSearchBenefitsByNameNetworkErrorOnce(config, mock);
        const el = await setupElement(config.query, SearchActiveBenefitsByName);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
