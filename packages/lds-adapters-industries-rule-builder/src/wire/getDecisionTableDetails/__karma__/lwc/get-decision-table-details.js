import { api, LightningElement, wire } from 'lwc';
import { getDecisionTableDetails } from 'lds-adapters-industries-rule-builder';

export default class GetDecisionTableDetails extends LightningElement {
    wirePushCount = -1;

    @api id;

    @wire(getDecisionTableDetails, {
        decisionTableId: '$id',
    })
    onGetDecisionTableDetails({ data, error }) {
        this.decisionTableDetails = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredDecisionTableDetails() {
        return this.decisionTableDetails;
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
