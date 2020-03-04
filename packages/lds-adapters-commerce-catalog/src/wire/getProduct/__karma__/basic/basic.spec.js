import GetProduct from '../lwc/get-product';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetProductNetworkOnce,
    mockGetProductNetworkErrorOnce,
} from 'commerce-catalog-test-util';

const MOCK_PREFIX = 'wire/getProduct/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets some product data', async () => {
        const mock = getMock('product');
        const config = { webstoreId: '0ZExx0000000001', productId: '01txx0000006i2SAAQ' };

        mockGetProductNetworkOnce(config, mock);

        const el = await setupElement(config, GetProduct);
        expect(el.pushCount()).toBe(1);
        expect(el.getData()).toEqual(mock);
    });

    it('does not fetch data again', async () => {
        const mock = getMock('product');
        const config = { webstoreId: '0ZExx0000000001', productId: '01txx0000006i2SAAQ' };

        mockGetProductNetworkOnce(config, mock);

        const el = await setupElement(config, GetProduct);
        expect(el.pushCount()).toBe(1);
        expect(el.getData()).toEqual(mock);

        const el2 = await setupElement(config, GetProduct);
        expect(el2.pushCount()).toBe(1);
        expect(el2.getData()).toEqual(mock);
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
        const config = { webstoreId: '0ZExx0000000001', productId: '01txx0000006i2SAAQ' };

        mockGetProductNetworkErrorOnce(config, mock);

        const el = await setupElement(config, GetProduct);
        expect(el.pushCount()).toBe(1);
        expect(el.getError()).toEqual(mock);
    });
});
