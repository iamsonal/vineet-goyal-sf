import { api, LightningElement, wire } from 'lwc';
import { searchDecisionTableByName } from 'lds-adapters-industries-rule-builder';
export default class SearchDecisionTableByName extends LightningElement {
    wirePushCount = -1;
    @api searchKey;
    @wire(searchDecisionTableByName, {
        searchKey: '$searchKey',
    })
    onSearchDecisionTableByName({ data, error }) {
        this.decisionTables = data;
        this.error = error;
        this.wirePushCount += 1;
    }
    @api
    getWiredDecisionTables() {
        return this.decisionTables;
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
