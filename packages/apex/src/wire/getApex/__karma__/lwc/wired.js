import { refreshApex } from '@salesforce/apex';
import getContactList from '@salesforce/apex/ContactController.getContactList';
import { api, LightningElement, wire } from 'lwc';

export default class Wired extends LightningElement {
    wirePushCount = -1;

    @wire(getContactList)
    onGetWiredContacts(results) {
        this.contacts = results;
        this.wirePushCount += 1;
    }

    @api
    getWiredContacts() {
        return this.contacts.data;
    }

    @api
    getWiredError() {
        return this.contacts.error;
    }

    @api
    refreshWiredContacts() {
        refreshApex(this.contacts);
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }
}
