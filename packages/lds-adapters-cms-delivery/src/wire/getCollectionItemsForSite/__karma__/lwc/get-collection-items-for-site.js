import { api, LightningElement, wire } from 'lwc';
import { getCollectionItemsForSite } from 'lds-adapters-cms-delivery';

export default class GetCollectionItemsForSite extends LightningElement {
    wirePushCount = -1;

    @api siteId;
    @api collectionKeyOrId;

    @wire(getCollectionItemsForSite, {
        siteId: '$siteId',
        collectionKeyOrId: '$collectionKeyOrId',
    })
    onGetCollectionItemsForSite(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    get collectionItemsForSite() {
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
