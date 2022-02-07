import { api, LightningElement, wire } from 'lwc';
import { getCatalogTable } from 'lds-adapters-analytics-data-service';

export default class GetCatalogTable extends LightningElement {
    wirePushCount = -1;

    @api qualifiedName;

    @wire(getCatalogTable, {
        qualifiedName: '$qualifiedName',
    })
    onGetCatalogTable({ data, error }) {
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
