import { api, LightningElement, wire } from 'lwc';
import { getCollectionMetadataForSite } from 'lds-adapters-cms-delivery';

export default class GetCollectionMetadataForSite extends LightningElement {
    wirePushCount = -1;

    @api siteId;
    @api collectionKeyOrId;

    @wire(getCollectionMetadataForSite, {
        siteId: '$siteId',
        collectionKeyOrId: '$collectionKeyOrId',
    })
    onGetCollectionMetadataForSite(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    get collectionMetadataForSite() {
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
