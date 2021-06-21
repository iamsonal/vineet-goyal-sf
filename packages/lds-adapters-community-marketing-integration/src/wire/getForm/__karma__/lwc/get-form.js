import { api, LightningElement, wire } from 'lwc';
import { getForm } from 'lds-adapters-experience-marketing-integration';

export default class GetForm extends LightningElement {
    wirePushCount = -1;

    @api siteId;
    @api formId;

    @wire(getForm, {
        siteId: '$siteId',
        formId: '$formId',
    })
    onGetForm({ data, error }) {
        this.form = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api getWiredForm() {
        return this.form;
    }

    @api
    pushCount() {
        return this.wirePushCount;
    }

    @api getError() {
        return this.error.body;
    }
}
