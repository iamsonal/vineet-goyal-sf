import ProductPrice from '../lwc/product-price';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetProductPriceNetworkOnce,
    mockGetProductPriceNetworkErrorOnce,
} from 'commerce-store-pricing-test-util';

const MOCK_PREFIX = 'wire/getProductPrice/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets a product price', async () => {
        const mock = getMock('product-price');
        const config = {
            webstoreId: '0ZExx0000000001',
            productId: '01txx0000006i2SAAQ',
            effectiveAccountId: '001xx000003GYTfAAO',
        };

        mockGetProductPriceNetworkOnce(config, mock);

        const el = await setupElement(config, ProductPrice);
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
            productId: '01txx0000006i2SAAQ',
            effectiveAccountId: '001xx000003GYTfAAO',
        };

        mockGetProductPriceNetworkErrorOnce(config, mock);

        const el = await setupElement(config, ProductPrice);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
