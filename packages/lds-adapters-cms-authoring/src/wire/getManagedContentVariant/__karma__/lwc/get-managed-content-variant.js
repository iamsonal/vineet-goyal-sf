import { LightningElement, wire, api } from 'lwc';
import { getManagedContentVariant } from 'lds-adapters-cms-authoring';

export default class GetManagedContentVariant extends LightningElement {
    wirePushCount = -1;

    @api variantId;

    @wire(getManagedContentVariant, {
        variantId: '$variantId',
    })
    onGetManagedContentVariant(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    get variant() {
        return this.data;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error;
    }
}
