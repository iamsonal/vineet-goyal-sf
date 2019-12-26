import { LightningElement, wire, api } from 'lwc';
import { getRecordEditActions } from 'lds';

export default class Basic extends LightningElement {
    @api recordId;
    wirePushCount = -1;

    @wire(getRecordEditActions, {
        recordId: '$recordId',
    })
    onGetRecordEditActionss(result) {
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
