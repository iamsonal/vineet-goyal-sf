import { LightningElement, wire, api } from 'lwc';
import { listContentInternal } from 'lds-adapters-cms-delivery';

export default class ListContentInternal extends LightningElement {
    wirePushCount = -1;

    @api communityId;

    @wire(listContentInternal, { communityId: '$communityId' })
    onListContentInternal(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    get contentList() {
        return this.data;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error;
    }
}
