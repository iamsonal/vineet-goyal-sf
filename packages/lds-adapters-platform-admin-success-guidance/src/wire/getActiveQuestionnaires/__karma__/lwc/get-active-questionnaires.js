import { api, LightningElement, wire, track } from 'lwc';
import { getActiveQuestionnaires } from 'lds-adapters-platform-admin-success-guidance';

export default class GetActiveQuestionnaires extends LightningElement {
    wirePushCount = -1;

    @track questionnaires;
    @track error;

    @api assistantGroup;

    @wire(getActiveQuestionnaires, {
        assistantGroup: '$assistantGroup',
    })
    onGetActiveQuestionnaires({ data, error }) {
        this.questionnaires = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredActiveQuestionnaires() {
        return this.questionnaires;
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
