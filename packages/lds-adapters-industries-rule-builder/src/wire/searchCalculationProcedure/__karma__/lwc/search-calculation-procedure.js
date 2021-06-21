import { api, LightningElement, wire } from 'lwc';
import { searchCalculationProcedure } from 'lds-adapters-industries-rule-builder';
export default class SearchCalculationProcedure extends LightningElement {
    wirePushCount = -1;
    @api searchKey;
    @wire(searchCalculationProcedure, {
        searchKey: '$searchKey',
    })
    onSearchCalculationProcedures({ data, error }) {
        this.calculationProcedures = data;
        this.error = error;
        this.wirePushCount += 1;
    }
    @api
    getWiredCalculationProcedures() {
        return this.calculationProcedures;
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
