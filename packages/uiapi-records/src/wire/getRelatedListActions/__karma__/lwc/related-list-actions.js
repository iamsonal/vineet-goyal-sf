import { LightningElement, wire, api } from 'lwc';
import { getRelatedListActions } from 'lds';

export default class RelatedListActions extends LightningElement {
    @api recordId;
    @api relatedListIds;
    wirePushCount = -1;

    @wire(getRelatedListActions, {
        recordId: '$recordId',
        relatedListIds: '$relatedListIds',
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
