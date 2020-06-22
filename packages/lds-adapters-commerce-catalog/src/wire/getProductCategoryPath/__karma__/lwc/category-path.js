import { LightningElement, api, wire } from 'lwc';
import { getProductCategoryPath } from 'lds-adapters-commerce-catalog';

export default class CategoryPath extends LightningElement {
    wirePushCount = -1;

    @api webstoreId;
    @api productCategoryId;

    @wire(getProductCategoryPath, {
        webstoreId: '$webstoreId',
        productCategoryId: '$productCategoryId',
    })
    onWiredProductCategoryPath(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error.body;
    }
}
