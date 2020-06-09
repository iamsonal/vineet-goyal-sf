import { LightningElement, wire, api } from 'lwc';
import { getDuplicates } from 'lds';

export default class Basic extends LightningElement {
    _fields = null;
    wirePushCount = -1;

    @api
    set fields(value) {
        this._fields = Object.assign({}, value);
    }

    get fields() {
        return this._fields;
    }

    @wire(getDuplicates, {
        apiName: 'Lead',
        fields: '$_fields',
    })
    onGetDuplicates(result) {
        this.results = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.results.data;
    }

    @api getWiredError() {
        return this.results.error;
    }

    @api pushCount() {
        return this.wirePushCount;
    }
}
