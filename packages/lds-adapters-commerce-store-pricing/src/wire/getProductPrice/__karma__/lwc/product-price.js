import { LightningElement, api, wire } from 'lwc';
import { getProductPrice } from 'lds';

export default class ProductPrice extends LightningElement {
    wirePushCount = -1;

    @api productId;

    @api effectiveAccountId;

    @api webstoreId;

    @wire(getProductPrice, {
        webstoreId: '$webstoreId',
        productId: '$productId',
        effectiveAccountId: '$effectiveAccountId',
    })
    onGetProductPrice(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    getData() {
        return this.data;
    }

    @api
    getError() {
        return this.error.body;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
