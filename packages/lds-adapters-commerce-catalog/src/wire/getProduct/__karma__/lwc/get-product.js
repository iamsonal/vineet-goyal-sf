import { LightningElement, api, wire } from 'lwc';
import { getProduct } from 'lds';

export default class GetProduct extends LightningElement {
    @api webstoreId;
    @api productId;

    wirePushCount = -1;

    @wire(getProduct, { webstoreId: '$webstoreId', productId: '$productId' })
    onGetWiredProduct(results) {
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
