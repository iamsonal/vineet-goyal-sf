import { api, LightningElement, wire } from 'lwc';
import { getConnectionSourceObject } from 'lds-adapters-analytics-data-service';

export default class GetConnectionSourceObject extends LightningElement {
    wirePushCount = -1;

    @api id;
    @api sourceObjectName;

    @wire(getConnectionSourceObject, {
        id: '$id',
        sourceObjectName: '$sourceObjectName',
    })
    onGetDataConnectorSourceObject({ data, error }) {
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
