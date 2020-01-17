import { LightningElement, wire, api } from 'lwc';
import { getRecordEditActions } from 'lds';

export default class Basic extends LightningElement {
    @api recordIds;
    wirePushCount = -1;

    @wire(getRecordEditActions, {
        recordIds: '$recordIds',
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
