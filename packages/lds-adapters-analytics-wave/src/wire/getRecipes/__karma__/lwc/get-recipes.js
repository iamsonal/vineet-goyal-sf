import { api, LightningElement, wire } from 'lwc';
import { getRecipes } from 'lds-adapters-analytics-wave';

export default class GetRecipes extends LightningElement {
    wirePushCount = -1;

    @api format;
    @api licenseType;
    @api pageParam;
    @api pageSize;
    @api q;
    @api sortParam;

    @wire(getRecipes, {
        format: '$format',
        licenseType: '$licenseType',
        page: '$pageParam',
        pageSize: '$pageSize',
        q: '$q',
        sort: '$sortParam',
    })
    onGetRecipes({ data, error }) {
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
