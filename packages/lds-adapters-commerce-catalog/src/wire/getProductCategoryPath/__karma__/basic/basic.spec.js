import CategoryPath from '../lwc/category-path';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetProductCategoryPathNetworkOnce,
    mockGetProductCategoryPathNetworkErrorOnce,
} from 'commerce-catalog-test-util';

const MOCK_PREFIX = 'wire/getProductCategoryPath/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets a product category path', async () => {
        const mock = getMock('product-category-path');
        const config = { webstoreId: '0ZExx0000000001', productCategoryId: '01txx0000006i2SAAQ' };

        mockGetProductCategoryPathNetworkOnce(config, mock);

        const el = await setupElement(config, CategoryPath);
        expect(el.pushCount()).toBe(1);
    });

    it('does not fetch data again', async () => {
        const mock = getMock('product-category-path');
        const config = { webstoreId: '0ZExx0000000001', productCategoryId: '01txx0000006i2SAAQ' };

        mockGetProductCategoryPathNetworkOnce(config, mock);

        const el = await setupElement(config, CategoryPath);
        expect(el.pushCount()).toBe(1);

        const el2 = await setupElement(config, CategoryPath);
        expect(el2.pushCount()).toBe(1);
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
        const config = { webstoreId: '0ZExx0000000001', productCategoryId: '01txx0000006i2SAAQ' };

        mockGetProductCategoryPathNetworkErrorOnce(config, mock);

        const el = await setupElement(config, CategoryPath);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
