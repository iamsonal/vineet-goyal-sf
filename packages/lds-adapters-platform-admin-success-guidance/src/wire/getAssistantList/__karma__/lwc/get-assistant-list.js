import { api, LightningElement, wire, track } from 'lwc';
import { getAssistantList } from 'lds-adapters-platform-admin-success-guidance';

export default class GetAssistantList extends LightningElement {
    wirePushCount = -1;

    @track assistantList;
    @track error;

    @api assistantTarget;

    @wire(getAssistantList, {
        assistantTarget: '$assistantTarget',
    })
    onGetAssistantList({ data, error }) {
        this.assistantList = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredAssistantList() {
        return this.assistantList;
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
