import { api, LightningElement, wire } from 'lwc';
import { getCatalogGrants } from 'lds-adapters-analytics-data-service';

export default class GetCatalogGrants extends LightningElement {
    wirePushCount = -1;

    @wire(getCatalogGrants, {
        qualifiedName: 'testdb01.testSchema01.Account',
    })
    onGetCatalogGrants({ data, error }) {
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
