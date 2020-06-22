import { LightningElement, wire, api } from 'lwc';
import { getRelatedListActions } from 'lds-adapters-uiapi';

export default class RelatedListActions extends LightningElement {
    @api recordIds;
    @api relatedListId;
    wirePushCount = -1;

    @wire(getRelatedListActions, {
        recordIds: '$recordIds',
        relatedListId: '$relatedListId',
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
