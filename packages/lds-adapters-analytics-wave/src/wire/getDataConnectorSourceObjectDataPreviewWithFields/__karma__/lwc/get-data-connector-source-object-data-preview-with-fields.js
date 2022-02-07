import { api, LightningElement, wire } from 'lwc';
import { getDataConnectorSourceObjectDataPreviewWithFields } from 'lds-adapters-analytics-wave';

export default class WiredGetDataConnectorSourceObjectDataPreviewWithFields extends LightningElement {
    wirePushCount = -1;

    @api sourceObjectFields;
    @api connectorIdOrApiName;
    @api sourceObjectName;
    @api advancedProperties;

    @wire(getDataConnectorSourceObjectDataPreviewWithFields, {
        sourceObjectFields: '$sourceObjectFields',
        connectorIdOrApiName: '$connectorIdOrApiName',
        sourceObjectName: '$sourceObjectName',
        advancedProperties: '$advancedProperties',
    })
    onGetDataConnectorSourceObjectDataPreviewWithFields(results) {
        this.data = results.data;
        this.error = results.error;
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
