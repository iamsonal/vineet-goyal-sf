import { api, LightningElement, wire } from 'lwc';
import { getAssistant } from 'lds-adapters-platform-admin-success-guidance';

export default class GetAssistant extends LightningElement {
    wirePushCount = -1;

    @api assistantGroup;

    @wire(getAssistant, {
        assistantGroup: '$assistantGroup',
    })
    onGetAssistant({ data, error }) {
        this.assistant = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredAssistant() {
        return this.assistant;
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
