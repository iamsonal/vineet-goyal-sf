import { api, LightningElement, wire } from 'lwc';
import { getDataConnectors } from 'lds-adapters-analytics-wave';

export default class GetDataConnectors extends LightningElement {
    wirePushCount = -1;

    @api category;
    @api connectorType;
    @api scope;

    @wire(getDataConnectors, {
        category: '$category',
        connectorType: '$connectorType',
        scope: '$scope',
    })
    onGetDataConnectors({ data, error }) {
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
