import { api, LightningElement, wire } from 'lwc';
import { getDecisionMatrixDetails } from 'lds-adapters-industries-rule-builder';

export default class GetDecisionMatrixDetails extends LightningElement {
    wirePushCount = -1;

    @api id;

    @wire(getDecisionMatrixDetails, {
        matrixId: '$id',
    })
    onGetDecisionMatrixDetails({ data, error }) {
        this.decisionMatrixDetails = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredDecisionMatrixDetails() {
        return this.decisionMatrixDetails;
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
