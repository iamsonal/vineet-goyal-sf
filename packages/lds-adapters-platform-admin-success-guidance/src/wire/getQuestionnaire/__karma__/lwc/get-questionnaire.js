import { api, LightningElement, wire, track } from 'lwc';
import { getQuestionnaire } from 'lds-adapters-platform-admin-success-guidance';

export default class GetQuestionnaires extends LightningElement {
    wirePushCount = -1;

    @api questionnaireName;

    @track questionnaire;

    @wire(getQuestionnaire, {
        questionnaireName: '$questionnaireName',
    })
    onGetQuestionnaires({ data, error }) {
        this.questionnaire = data;
        this.error = error;
        this.wirePushCount += 1;
    }

    @api
    getWiredQuestionnaire() {
        return this.questionnaire;
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
