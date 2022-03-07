import { api, LightningElement, wire, track } from 'lwc';
import { getAssistantTarget } from 'lds-adapters-platform-admin-success-guidance';

export default class GetAssistantTarget extends LightningElement {
    wirePushCount = -1;

    @track assistantTargetResponse;
    @track error;

    @api assistantTarget;

    @wire(getAssistantTarget, {
        assistantTarget: '$assistantTarget',
    })
    onGetAssistantTarget({ data, error }) {
        this.assistantTargetResponse = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredAssistantTarget() {
        return this.assistantTargetResponse;
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
