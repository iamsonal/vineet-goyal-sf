import { api, LightningElement, wire, track } from 'lwc';
import { getQuestionnaires } from 'lds-adapters-platform-admin-success-guidance';

export default class GetQuestionnaires extends LightningElement {
    wirePushCount = -1;

    @track questionnaires;
    @track error;

    @api assistantName;

    @wire(getQuestionnaires, {
        assistantName: '$assistantName',
    })
    onGetQuestionnaires({ data, error }) {
        this.questionnaires = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredQuestionnaires() {
        return this.questionnaires;
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
