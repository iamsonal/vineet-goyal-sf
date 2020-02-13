import getContactList from '@salesforce/lds-adapters-apex/ContactController.getContactList';
import { api, LightningElement, wire } from 'lwc';

export default class Wired extends LightningElement {
    @api
    property = null;

    wirePushCount = -1;

    @wire(getContactList, { property: '$property' })
    onGetWiredContacts() {
        this.wirePushCount += 1;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
