import { api, LightningElement, wire } from 'lwc';
import { searchDecisionMatrixByName } from 'lds-adapters-industries-rule-builder';
export default class SearchDecisionMatrixByName extends LightningElement {
    wirePushCount = -1;
    @api searchKey;
    @wire(searchDecisionMatrixByName, {
        searchKey: '$searchKey',
    })
    onSearchDecisionMatrixByName({ data, error }) {
        this.decisionMatrices = data;
        this.error = error;
        this.wirePushCount += 1;
    }
    @api
    getWiredDecisionMatrices() {
        return this.decisionMatrices;
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
