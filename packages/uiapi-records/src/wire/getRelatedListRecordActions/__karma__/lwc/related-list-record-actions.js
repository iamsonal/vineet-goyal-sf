import { LightningElement, wire, api } from 'lwc';
import { getRelatedListRecordActions } from 'lds';

export default class RelatedListRecordActions extends LightningElement {
    @api recordIds;
    @api relatedListRecordIds;
    @api actionTypes;
    @api formFactor;
    @api sections;
    wirePushCount = -1;

    @wire(getRelatedListRecordActions, {
        recordIds: '$recordIds',
        relatedListRecordIds: '$relatedListRecordIds',
        actionTypes: '$actionTypes',
        formFactor: '$formFactor',
        sections: '$sections',
    })
    onGetRelatedListRecordActions(result) {
        this.action = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.action.data;
    }

    @api getWiredError() {
        return this.action.error;
    }

    @api pushCount() {
        return this.wirePushCount;
    }
}
