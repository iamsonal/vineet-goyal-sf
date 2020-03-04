import { api, LightningElement, wire } from 'lwc';
import { getCommunityNavigationMenu } from 'lds';

export default class GetNavItems extends LightningElement {
    wirePushCount = -1;

    @api communityId;

    @wire(getCommunityNavigationMenu, { communityId: '$communityId' })
    onGetWiredNavItems(results) {
        this.navItems = results.data;
        this.error = results.error;
        this.wirePushCount += 1;
    }

    @api
    getWiredNavItems() {
        return this.navItems;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api
    getError() {
        return this.error.body;
    }
}
