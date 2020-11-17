import { api, LightningElement, wire } from 'lwc';
import { getDataflowJobs } from 'lds-adapters-analytics-wave';

export default class GetDataflowJobs extends LightningElement {
    wirePushCount = -1;

    @api licenseType;
    @api page;
    @api pageSize;
    @api q;
    @api status;

    @wire(getDataflowJobs, {
        licenseType: '$licenseType',
        page: '$page',
        pageSize: '$pageSize',
        q: '$q',
        status: '$status',
    })
    onGetDataflowJobs({ data, error }) {
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
