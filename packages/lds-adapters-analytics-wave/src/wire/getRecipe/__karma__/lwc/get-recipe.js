import { api, LightningElement, wire } from 'lwc';
import { getRecipe } from 'lds-adapters-analytics-wave';

export default class GetRecipe extends LightningElement {
    wirePushCount = -1;

    @api id;
    @api format;

    @wire(getRecipe, {
        id: '$id',
        format: '$format',
    })
    onGetRecipe({ data, error }) {
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
        return this.error.body;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
