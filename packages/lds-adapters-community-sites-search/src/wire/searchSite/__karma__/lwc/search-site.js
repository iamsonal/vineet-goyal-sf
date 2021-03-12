import { LightningElement, wire, api } from 'lwc';
import { searchSite } from 'lds-adapters-community-sites-search';

export default class SearchSite extends LightningElement {
    wirePushCount = -1;

    @api siteId;
    @api queryTerm;
    @api pageToken;
    @api pageSize;
    @api language;

    @wire(searchSite, {
        siteId: '$siteId',
        queryTerm: '$queryTerm',
        pageToken: '$pageToken',
        pageSize: '$pageSize',
        language: '$language',
    })
    onSearchSite(results) {
        this.data = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    get searchData() {
        return this.data;
    }

    @api
    get pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error;
    }
}
