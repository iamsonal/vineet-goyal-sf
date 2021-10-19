import { api, LightningElement, wire } from 'lwc';
import { getCollectionMetadataForChannel } from 'lds-adapters-cms-delivery';

export default class GetCollectionItems extends LightningElement {
    wirePushCount = -1;

    @api channelId;
    @api collectionKeyOrId;

    @wire(getCollectionMetadataForChannel, {
        channelId: '$channelId',
        collectionKeyOrId: '$collectionKeyOrId',
    })
    onGetCollectionMetadataForChannel(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    get collectionMetadataForChannel() {
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
