import { api, LightningElement, wire } from 'lwc';
import { getColumns } from 'lds-adapters-industries-decision-matrix-designer';

export default class GetColumns extends LightningElement {
    wirePushCount = -1;

    @api matrixId;

    @wire(getColumns, {
        matrixId: '$matrixId',
    })
    onGetColumns(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    getData() {
        return this.data;
    }

    @api
    getError() {
        return this.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
