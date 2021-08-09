import { LightningElement, api, wire } from 'lwc';
import { getProductPrice } from 'lds-adapters-commerce-store-pricing';

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
        return this.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
