import { api, LightningElement, wire } from 'lwc';
import { getRecipeNotification } from 'lds-adapters-analytics-wave';

export default class GetRecipeNotification extends LightningElement {
    wirePushCount = -1;

    @api id;

    @wire(getRecipeNotification, {
        id: '$id',
    })
    onGetRecipeNotification({ data, error }) {
        this.data = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredData() {
        return this.data;
    }

    @api
    getWiredError() {
        return this.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
