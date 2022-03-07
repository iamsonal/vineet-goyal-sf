import { api, LightningElement, wire } from 'lwc';
import { getCatalogSchema } from 'lds-adapters-analytics-data-service';

export default class GetCatalogSchema extends LightningElement {
    wirePushCount = -1;

    @api qualifiedSchemaName;

    @wire(getCatalogSchema, {
        qualifiedName: '$qualifiedSchemaName',
    })
    onGetCatalogSchema({ data, error }) {
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
