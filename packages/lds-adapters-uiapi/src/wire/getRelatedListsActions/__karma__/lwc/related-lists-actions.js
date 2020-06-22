import { LightningElement, wire, api } from 'lwc';
import { getRelatedListsActions } from 'lds-adapters-uiapi';

export default class RelatedListsActions extends LightningElement {
    @api recordIds;
    @api relatedListIds;
    wirePushCount = -1;

    @wire(getRelatedListsActions, {
        recordIds: '$recordIds',
        relatedListIds: '$relatedListIds',
    })
    onGetRelatedListsActions(result) {
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
