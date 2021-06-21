import { api, LightningElement, wire } from 'lwc';
import { getCalcProcVersionDetails } from 'lds-adapters-industries-rule-builder';

export default class GetCalcProcVersionDetails extends LightningElement {
    wirePushCount = -1;

    @api id;

    @wire(getCalcProcVersionDetails, {
        id: '$id',
    })
    onGetCalcProcVersionDetails({ data, error }) {
        this.calcProcVersionDetails = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredCalcProcVersionDetails() {
        return this.calcProcVersionDetails;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error.body;
    }
}
