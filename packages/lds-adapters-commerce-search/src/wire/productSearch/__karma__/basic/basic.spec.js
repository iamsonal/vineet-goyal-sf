import ProductSearch from '../lwc/product-search';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockPostProductSearchNetworkOnce,
    mockPostProductSearchNetworkErrorOnce,
} from 'commerce-search-test-util';

const MOCK_PREFIX = 'wire/productSearch/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('search for a product', async () => {
        const mock = getMock('product-search');
        const config = {
            webstoreId: '0ZExx0000000001',
            query: {
                searchTerm: 'car',
                pageSize: 10,
                page: 0,
                sortOrderId: 'price-low-to-high',
                categoryId: 'blah',
                fields: [],
                refinements: [],
            },
        };

        mockPostProductSearchNetworkOnce(config, mock);

        // eslint-disable-next-line @salesforce/lds/no-invalid-todo
        // TODO: wire adapter binding on nested object properties does not work in ie11
        // So the query is destructured here:
        const wireParams = { webstoreId: config.webstoreId, ...config.query };

        const el = await setupElement(wireParams, ProductSearch);
        expect(el.pushCount()).toBe(1);
        expect(el.getData()).toEqual(mock);
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
        const config = {
            webstoreId: '0ZExx0000000001',
            query: {
                searchTerm: 'car',
                pageSize: 10,
                page: 0,
                sortOrderId: 'price-low-to-high',
                categoryId: 'blah',
                fields: [],
                refinements: [],
            },
        };

        mockPostProductSearchNetworkErrorOnce(config, mock);

        // eslint-disable-next-line @salesforce/lds/no-invalid-todo
        // TODO: wire adapter binding on nested object properties does not work in ie11
        // So the query is destructured here:
        const wireParams = { webstoreId: config.webstoreId, ...config.query };

        const el = await setupElement(wireParams, ProductSearch);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
