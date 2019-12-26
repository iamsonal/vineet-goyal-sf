import { LightningElement, wire, api } from 'lwc';
import { getRecordActions } from 'lds';

export default class RecordActions extends LightningElement {
    @api recordId;
    @api actionTypes;
    @api apiNames;
    @api formFactor;
    @api retrievalMode;
    @api sections;
    wirePushCount = -1;

    @wire(getRecordActions, {
        recordId: '$recordId',
        actionTypes: '$actionTypes',
        apiNames: '$apiNames',
        formFactor: '$formFactor',
        retrievalMode: '$retrievalMode',
        sections: '$sections',
    })
    onGetRecordActions(result) {
        this.action = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.action.data;
    }

    @api pushCount() {
        return this.wirePushCount;
    }
}
