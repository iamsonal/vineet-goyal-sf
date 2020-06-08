import { LightningElement, wire, api } from 'lwc';
import { getNavItems, refresh } from 'lds';

export default class NavItems extends LightningElement {
    @api formFactor;
    @api navItemNames;

    wirePushCount = -1;

    @wire(getNavItems, {
        formFactor: '$formFactor',
        navItemNames: '$navItemNames',
    })
    onGetNavItems(result) {
        this.tabs = result;
        this.wirePushCount += 1;
    }

    @api getWiredData() {
        return this.tabs.data;
    }

    @api pushCount() {
        return this.wirePushCount;
    }

    @api getWiredError() {
        return this.tabs.error;
    }

    @api refresh() {
        return refresh(this.tabs);
    }
}
