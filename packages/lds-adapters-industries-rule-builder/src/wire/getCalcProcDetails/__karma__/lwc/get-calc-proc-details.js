import { api, LightningElement, wire } from 'lwc';
import { getCalcProcDetails } from 'lds-adapters-industries-rule-builder';

export default class GetCalcProcDetails extends LightningElement {
    wirePushCount = -1;

    @api id;

    @wire(getCalcProcDetails, {
        id: '$id',
    })
    onGetCalcProcDetails({ data, error }) {
        this.calcProcDetails = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredCalcProcDetails() {
        return this.calcProcDetails;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error;
    }
}
