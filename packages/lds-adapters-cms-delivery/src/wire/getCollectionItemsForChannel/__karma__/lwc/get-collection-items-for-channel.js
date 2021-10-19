import { api, LightningElement, wire } from 'lwc';
import { getCollectionItemsForChannel } from 'lds-adapters-cms-delivery';

export default class GetCollectionItems extends LightningElement {
    wirePushCount = -1;

    @api channelId;
    @api collectionKeyOrId;

    @wire(getCollectionItemsForChannel, {
        channelId: '$channelId',
        collectionKeyOrId: '$collectionKeyOrId',
    })
    onGetCollectionItemsForChannel(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    get collectionItemsForChannel() {
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
