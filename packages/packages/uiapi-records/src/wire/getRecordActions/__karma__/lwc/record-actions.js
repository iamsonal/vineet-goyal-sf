import { LightningElement, wire, api } from 'lwc';
import { getRecordActions, refresh } from 'lds';

export default class RecordActions extends LightningElement {
    @api recordIds;
    @api actionTypes;
    @api apiNames;
    @api formFactor;
    @api retrievalMode;
    @api sections;
    wirePushCount = -1;

    @wire(getRecordActions, {
        recordIds: '$recordIds',
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

    @api refresh() {
        return refresh(this.action);
    }
}
