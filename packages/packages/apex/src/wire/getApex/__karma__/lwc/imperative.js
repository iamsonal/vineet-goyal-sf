import { refreshApex } from '@salesforce/apex';
import getContactList from '@salesforce/apex/ContactController.getContactList';
import { api, LightningElement } from 'lwc';

export default class Imperative extends LightningElement {
    contactsOrErrors;

    @api
    async getContacts() {
        try {
            this.contactsOrErrors = await getContactList();
        } catch (e) {
            this.contactsOrErrors = e;
        }

        return this.contactsOrErrors;
    }

    @api
    refreshContacts() {
        refreshApex(this.contactsOrErrors);
    }
}
