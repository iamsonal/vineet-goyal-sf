import { LightningElement, wire, api } from 'lwc';
import { getRelatedListActions } from 'lds-adapters-uiapi';

export default class RelatedListActions extends LightningElement {
    @api recordIds;
    @api relatedListId;
    @api apiNames;
    @api retrievalMode;
    wirePushCount = -1;

    @wire(getRelatedListActions, {
        recordIds: '$recordIds',
        relatedListId: '$relatedListId',
        apiNames: '$apiNames',
        retrievalMode: '$retrievalMode',
    })
    onGetRelatedListActions(result) {
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
