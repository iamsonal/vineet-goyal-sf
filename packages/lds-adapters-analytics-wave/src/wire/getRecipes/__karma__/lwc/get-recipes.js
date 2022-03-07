import { api, LightningElement, wire } from 'lwc';
import { getRecipes } from 'lds-adapters-analytics-wave';

export default class GetRecipes extends LightningElement {
    wirePushCount = -1;

    @api format;
    @api licenseType;
    @api page;
    @api pageSize;
    @api q;
    @api sort;
    @api lastModifiedAfter;
    @api lastModifiedBefore;
    @api nextScheduledAfter;
    @api nextScheduledBefore;
    @api status;

    @wire(getRecipes, {
        format: '$format',
        licenseType: '$licenseType',
        page: '$page',
        pageSize: '$pageSize',
        q: '$q',
        sort: '$sort',
        lastModifiedAfter: '$lastModifiedAfter',
        lastModifiedBefore: '$lastModifiedBefore',
        nextScheduledAfter: '$nextScheduledAfter',
        nextScheduledBefore: '$nextScheduledBefore',
        status: '$status',
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
        return this.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
