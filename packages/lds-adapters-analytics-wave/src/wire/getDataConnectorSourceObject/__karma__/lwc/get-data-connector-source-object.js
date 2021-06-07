import { api, LightningElement, wire } from 'lwc';
import { getDataConnectorSourceObject } from 'lds-adapters-analytics-wave';

export default class GetDataConnectorSourceObject extends LightningElement {
    wirePushCount = -1;

    @api connectorIdOrApiName;
    @api sourceObjectName;

    @wire(getDataConnectorSourceObject, {
        connectorIdOrApiName: '$connectorIdOrApiName',
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
        return this.error.body;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
