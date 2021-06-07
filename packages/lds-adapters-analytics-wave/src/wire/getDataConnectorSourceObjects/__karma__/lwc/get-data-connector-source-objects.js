import { api, LightningElement, wire } from 'lwc';
import { getDataConnectorSourceObjects } from 'lds-adapters-analytics-wave';

export default class GetDataConnectorSourceObjects extends LightningElement {
    wirePushCount = -1;

    @api connectorIdOrApiName;
    @api page;
    @api pageSize;

    @wire(getDataConnectorSourceObjects, {
        connectorIdOrApiName: '$connectorIdOrApiName',
        page: '$page',
        pageSize: '$pageSize',
    })
    onGetDataConnectorSourceObjects({ data, error }) {
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
