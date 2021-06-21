import { api, LightningElement, wire } from 'lwc';
import { getDataConnectorSourceFields } from 'lds-adapters-analytics-wave';

export default class GetDataConnectorSourceFields extends LightningElement {
    wirePushCount = -1;

    @api connectorIdOrApiName;
    @api sourceObjectName;

    @wire(getDataConnectorSourceFields, {
        connectorIdOrApiName: '$connectorIdOrApiName',
        sourceObjectName: '$sourceObjectName',
    })
    onGetDataConnectorSourceFields({ data, error }) {
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
