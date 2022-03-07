import { api, LightningElement, wire } from 'lwc';
import { getFields } from 'lds-adapters-analytics-data-service';

export default class GetFields extends LightningElement {
    wirePushCount = -1;

    @api id;
    @api sourceObjectName;
    @api pageParam;
    @api pageSize;
    @api q;

    @wire(getFields, {
        id: '$id',
        sourceObjectName: '$sourceObjectName',
        page: '$pageParam',
        pageSize: '$pageSize',
        q: '$q',
    })
    onGetDataFields({ data, error }) {
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
