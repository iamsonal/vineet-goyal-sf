import { api, LightningElement, wire } from 'lwc';
import { getCommunityNavigationMenu } from 'lds';

export default class GetNavItems extends LightningElement {
    wirePushCount = -1;

    @api communityId;

    @wire(getCommunityNavigationMenu, { communityId: '$communityId' })
    onGetWiredNavItems(results) {
        this.navItems = results;
        this.wirePushCount += 1;
    }

    @api
    getWiredNavItems() {
        return this.navItems.data;
    }

    @api
    getWiredError() {
        return this.navItems.error;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
