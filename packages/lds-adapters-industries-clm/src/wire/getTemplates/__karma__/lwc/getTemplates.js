import { api, LightningElement, wire } from 'lwc';
import { getTemplates } from 'lds-adapters-industries-clm';

export default class GetTemplates extends LightningElement {
    wirePushCount = -1;
    @api objecttype;

    @wire(getTemplates, {
        objecttype: '$objecttype',
    })
    onGetContractDetails({ data, error }) {
        this.response = data;
        this.error = error;
        this.wirePushCount += 1;
    }
    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error;
    }
    @api
    getWiredContractDetails() {
        return this.response;
    }
}
